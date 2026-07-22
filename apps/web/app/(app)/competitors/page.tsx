import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createCompetitor, setCompetitorActive } from "@/lib/actions/competitors";

function formatTHB(n: number) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
}

type CompetitorRow = { id: string; name: string; is_active: boolean };

export default async function CompetitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ whatif_competitor?: string; whatif_n?: string }>;
}) {
  const { whatif_competitor, whatif_n } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  const [{ data: competitors }, { data: intelRows }, { data: deals }] = await Promise.all([
    supabase.from("competitors").select("id, name, is_active").order("is_active", { ascending: false }).order("name"),
    supabase
      .from("competitor_intelligence")
      .select("company_id, predicted_competitor_id, confidence_level, generated_at, companies(id, name, country, business_type, status)")
      .order("generated_at", { ascending: false }),
    supabase
      .from("deals")
      .select("id, company_id, stage, value_estimate, lost_to_competitor_id"),
  ]);

  const competitorList = (competitors ?? []) as CompetitorRow[];
  const competitorNameById = new Map(competitorList.map((c) => [c.id, c.name]));

  // Latest competitor_intelligence prediction per company (rows already ordered newest-first)
  type IntelRow = {
    company_id: string;
    predicted_competitor_id: string | null;
    companies: { id: string; name: string; country: string | null; business_type: string | null; status: string } | null;
  };
  const latestIntelByCompany = new Map<string, IntelRow>();
  for (const row of (intelRows ?? []) as unknown as IntelRow[]) {
    if (!latestIntelByCompany.has(row.company_id)) {
      latestIntelByCompany.set(row.company_id, row);
    }
  }
  // Only count active companies with an actual predicted competitor
  const predictedRows = [...latestIntelByCompany.values()].filter(
    (r) => r.companies?.status === "active" && r.predicted_competitor_id
  );

  const totalActiveCompaniesWithPrediction = predictedRows.length;
  const unknownCount = [...latestIntelByCompany.values()].filter(
    (r) => r.companies?.status === "active" && !r.predicted_competitor_id
  ).length;

  // Market share: % of predicted companies per competitor
  const predictedCountByCompetitor = new Map<string, number>();
  for (const row of predictedRows) {
    const id = row.predicted_competitor_id!;
    predictedCountByCompetitor.set(id, (predictedCountByCompetitor.get(id) ?? 0) + 1);
  }
  const marketShare = [...predictedCountByCompetitor.entries()]
    .map(([competitorId, count]) => ({
      name: competitorNameById.get(competitorId) ?? "ไม่ทราบชื่อ",
      count,
      pct: totalActiveCompaniesWithPrediction > 0 ? Math.round((count / totalActiveCompaniesWithPrediction) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Actual lost-to facts, from deals.lost_to_competitor_id
  const lostCountByCompetitor = new Map<string, number>();
  for (const d of deals ?? []) {
    if (d.lost_to_competitor_id) {
      lostCountByCompetitor.set(
        d.lost_to_competitor_id,
        (lostCountByCompetitor.get(d.lost_to_competitor_id) ?? 0) + 1
      );
    }
  }
  const topLost = [...lostCountByCompetitor.entries()]
    .map(([competitorId, count]) => ({ name: competitorNameById.get(competitorId) ?? "ไม่ทราบชื่อ", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topPredicted = marketShare.slice(0, 8);

  // By country / by industry — top competitor per group, based on predicted rows
  function topByGroup(keyFn: (r: IntelRow) => string | null) {
    const counts = new Map<string, Map<string, number>>(); // group -> competitorId -> count
    for (const row of predictedRows) {
      const group = keyFn(row) ?? "ไม่ระบุ";
      if (!counts.has(group)) counts.set(group, new Map());
      const inner = counts.get(group)!;
      const cid = row.predicted_competitor_id!;
      inner.set(cid, (inner.get(cid) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([group, inner]) => {
        const [topCompetitorId, topCount] =
          [...inner.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
        const total = [...inner.values()].reduce((a, b) => a + b, 0);
        return {
          group,
          topCompetitor: topCompetitorId ? competitorNameById.get(topCompetitorId) ?? "ไม่ทราบชื่อ" : "-",
          topCount,
          total,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }
  const byCountry = topByGroup((r) => r.companies?.country ?? null);
  const byIndustry = topByGroup((r) => r.companies?.business_type ?? null);

  // Win/loss vs predicted competitor: among companies predicted to use competitor X,
  // what fraction of their deals are won vs lost
  const dealsByCompany = new Map<string, { won: number; lost: number }>();
  for (const d of deals ?? []) {
    if (d.stage !== "won" && d.stage !== "lost") continue;
    if (!dealsByCompany.has(d.company_id)) dealsByCompany.set(d.company_id, { won: 0, lost: 0 });
    const bucket = dealsByCompany.get(d.company_id)!;
    if (d.stage === "won") bucket.won++;
    else bucket.lost++;
  }
  const winLossByCompetitor = new Map<string, { won: number; lost: number }>();
  for (const row of predictedRows) {
    const bucket = dealsByCompany.get(row.company_id);
    if (!bucket) continue;
    const cid = row.predicted_competitor_id!;
    if (!winLossByCompetitor.has(cid)) winLossByCompetitor.set(cid, { won: 0, lost: 0 });
    const agg = winLossByCompetitor.get(cid)!;
    agg.won += bucket.won;
    agg.lost += bucket.lost;
  }
  const winLossRows = [...winLossByCompetitor.entries()]
    .map(([competitorId, { won, lost }]) => ({
      name: competitorNameById.get(competitorId) ?? "ไม่ทราบชื่อ",
      won,
      lost,
      total: won + lost,
      winRate: won + lost >= 3 ? Math.round((won / (won + lost)) * 100) : null,
    }))
    .sort((a, b) => b.total - a.total);

  // What-if projection: avg deal value of companies predicted to use the selected competitor
  let whatIfResult: { competitorName: string; avgValue: number; n: number; projected: number } | null = null;
  if (whatif_competitor && whatif_n) {
    const n = Number(whatif_n);
    const companyIdsForCompetitor = predictedRows
      .filter((r) => r.predicted_competitor_id === whatif_competitor)
      .map((r) => r.company_id);
    const valuesForThoseCompanies = (deals ?? [])
      .filter((d) => companyIdsForCompetitor.includes(d.company_id) && d.value_estimate)
      .map((d) => Number(d.value_estimate));
    if (valuesForThoseCompanies.length > 0 && n > 0) {
      const avgValue =
        valuesForThoseCompanies.reduce((a, b) => a + b, 0) / valuesForThoseCompanies.length;
      whatIfResult = {
        competitorName: competitorNameById.get(whatif_competitor) ?? "ไม่ทราบชื่อ",
        avgValue,
        n,
        projected: avgValue * n,
      };
    }
  }

  return (
    <div className="p-8 max-w-4xl flex flex-col gap-8">
      <div>
        <h1 className="text-brand text-xl font-extrabold">คู่แข่ง (Competitors)</h1>
        <p className="text-ink-soft text-sm mt-1">
          ทำเนียบคู่แข่ง และภาพรวมส่วนแบ่งตลาดภายในฐานข้อมูล CRM
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">ทำเนียบคู่แข่ง (Master Data)</h2>
        <div className="flex flex-col gap-2">
          {competitorList.map((c) => (
            <div
              key={c.id}
              className="border border-line rounded-xl p-3 text-sm flex items-center justify-between"
            >
              <span className={`font-bold ${!c.is_active ? "text-ink-soft line-through" : ""}`}>{c.name}</span>
              {isAdmin && (
                <form action={setCompetitorActive.bind(null, c.id, !c.is_active)}>
                  <button
                    type="submit"
                    className="border border-line rounded-lg px-3 py-1 text-xs font-semibold text-ink-soft hover:bg-line-soft"
                  >
                    {c.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </button>
                </form>
              )}
            </div>
          ))}
          {competitorList.length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีคู่แข่งในระบบ</p>}
        </div>

        {isAdmin && (
          <form action={createCompetitor} className="border border-line rounded-xl p-4 flex gap-2">
            <input
              name="name"
              placeholder="ชื่อคู่แข่งใหม่ (เช่น Kerry Express)"
              required
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
            >
              เพิ่มคู่แข่ง
            </button>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">Market Share ภายใน CRM</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
          นี่คือส่วนแบ่งตลาด<b>ภายในฐานข้อมูล CRM ของบริษัทเอง</b> (จากการคาดการณ์ของ Competitor Intelligence Agent) ไม่ใช่ market share ระดับประเทศ
        </div>
        <div className="flex flex-col gap-2">
          {marketShare.map((m) => (
            <div key={m.name} className="flex items-center gap-3 text-sm">
              <span className="w-32 flex-none font-medium truncate">{m.name}</span>
              <div className="flex-1 bg-line-soft rounded-full h-3 overflow-hidden">
                <div className="bg-brand h-full rounded-full" style={{ width: `${m.pct}%` }} />
              </div>
              <span className="w-20 flex-none text-right text-ink-soft text-xs">
                {m.pct}% ({m.count})
              </span>
            </div>
          ))}
          {unknownCount > 0 && (
            <p className="text-xs text-ink-soft">
              และอีก {unknownCount} บริษัทที่ยังไม่ได้วิเคราะห์คู่แข่ง (Unknown)
            </p>
          )}
          {marketShare.length === 0 && (
            <p className="text-sm text-ink-soft">
              ยังไม่มีข้อมูล — ต้องกด "วิเคราะห์คู่แข่ง" ในหน้ารายละเอียดบริษัทก่อน
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand">
            Top Competitor — คาดการณ์ (AI)
          </h2>
          <p className="text-xs text-ink-soft -mt-1">จาก Competitor Intelligence — ยังไม่ปิดดีล</p>
          {topPredicted.map((c, i) => (
            <div key={c.name} className="border border-line rounded-lg px-3 py-2 text-sm flex justify-between">
              <span>{i + 1}. {c.name}</span>
              <span className="text-ink-soft">{c.count} บริษัท</span>
            </div>
          ))}
          {topPredicted.length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีข้อมูล</p>}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand">
            Top Competitor — แพ้ดีลจริง
          </h2>
          <p className="text-xs text-ink-soft -mt-1">จาก deals ที่บันทึกว่าเสียโอกาสให้คู่แข่งจริง</p>
          {topLost.map((c, i) => (
            <div key={c.name} className="border border-line rounded-lg px-3 py-2 text-sm flex justify-between">
              <span>{i + 1}. {c.name}</span>
              <span className="text-ink-soft">{c.count} ดีล</span>
            </div>
          ))}
          {topLost.length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีดีลที่บันทึกว่าเสียให้คู่แข่ง</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand">คู่แข่งหลักแยกตามประเทศ</h2>
          {byCountry.map((row) => (
            <div key={row.group} className="border border-line rounded-lg px-3 py-2 text-sm flex justify-between">
              <span>{row.group}</span>
              <span className="text-ink-soft">
                {row.topCompetitor} ({row.topCount}/{row.total})
              </span>
            </div>
          ))}
          {byCountry.length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีข้อมูล</p>}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand">คู่แข่งหลักแยกตามอุตสาหกรรม</h2>
          {byIndustry.map((row) => (
            <div key={row.group} className="border border-line rounded-lg px-3 py-2 text-sm flex justify-between">
              <span>{row.group}</span>
              <span className="text-ink-soft">
                {row.topCompetitor} ({row.topCount}/{row.total})
              </span>
            </div>
          ))}
          {byIndustry.length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีข้อมูล</p>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">Win/Loss เทียบกับคู่แข่งแต่ละราย</h2>
        <p className="text-xs text-ink-soft -mt-1">
          Win Rate จากดีลของบริษัทที่คาดว่าใช้คู่แข่งรายนั้นอยู่ (แสดง "ข้อมูลยังไม่พอ" ถ้าปิดดีลน้อยกว่า 3 ดีล)
        </p>
        <div className="flex flex-col gap-2">
          {winLossRows.map((row) => (
            <div key={row.name} className="border border-line rounded-lg px-3 py-2 text-sm flex justify-between">
              <span>{row.name}</span>
              <span className="text-ink-soft">
                {row.winRate !== null ? `Win Rate ${row.winRate}%` : "ข้อมูลยังไม่พอ"} (ชนะ {row.won} / แพ้ {row.lost})
              </span>
            </div>
          ))}
          {winLossRows.length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีข้อมูล</p>}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">What-if Projection</h2>
        <p className="text-xs text-ink-soft -mt-1">
          ประมาณการคร่าวๆ ว่าถ้าปิดดีลลูกค้าที่ใช้คู่แข่งรายนี้เพิ่ม N ราย จะเพิ่มยอดขายประมาณเท่าไร (คำนวณจากมูลค่าดีลเฉลี่ยของลูกค้ากลุ่มนี้เท่านั้น — เป็นการประมาณการ ไม่ใช่การพยากรณ์แม่นยำ)
        </p>
        <form className="border border-line rounded-xl p-4 flex gap-2 flex-wrap items-end">
          <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <span className="text-xs font-semibold text-ink-soft">คู่แข่ง</span>
            <select
              name="whatif_competitor"
              defaultValue={whatif_competitor ?? ""}
              className="border border-line rounded-lg px-3 py-2 text-sm"
            >
              <option value="">-- เลือกคู่แข่ง --</option>
              {competitorList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 w-32">
            <span className="text-xs font-semibold text-ink-soft">จำนวนดีล (N)</span>
            <input
              type="number"
              name="whatif_n"
              min={1}
              defaultValue={whatif_n ?? ""}
              className="border border-line rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            ประมาณการ
          </button>
        </form>
        {whatIfResult && (
          <div className="bg-brand-tint border border-brand-tint2 rounded-xl p-4 text-sm">
            ถ้าปิดดีลลูกค้าที่ใช้ <b>{whatIfResult.competitorName}</b> เพิ่ม {whatIfResult.n} ราย
            (มูลค่าดีลเฉลี่ยของกลุ่มนี้ {formatTHB(whatIfResult.avgValue)} บาท) — ประมาณการยอดขายเพิ่มขึ้น{" "}
            <b>{formatTHB(whatIfResult.projected)} บาท</b>
          </div>
        )}
        {whatif_competitor && whatif_n && !whatIfResult && (
          <p className="text-xs text-ink-soft">
            ยังไม่มีข้อมูลมูลค่าดีลของบริษัทที่ใช้คู่แข่งรายนี้พอสำหรับประมาณการ
          </p>
        )}
      </section>
    </div>
  );
}
