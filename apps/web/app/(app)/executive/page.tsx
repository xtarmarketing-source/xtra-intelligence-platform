import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SalesFunnel, type FunnelStage } from "./sales-funnel";
import { DateRangePicker } from "./date-range-picker";

const STAGE_LABEL: Record<string, string> = {
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  qualified: "ผ่านเกณฑ์",
  quoted: "เสนอราคาแล้ว",
  negotiation: "เจรจาต่อรอง",
  won: "ปิดการขาย",
  lost: "เสียโอกาส",
};

// Distinct accent per stage so the funnel reads top-to-bottom at a glance.
const STAGE_ACCENT: Record<string, string> = {
  new: "bg-ink-soft",
  contacted: "bg-blue-500",
  qualified: "bg-purple-500",
  quoted: "bg-warn",
  negotiation: "bg-brand",
  won: "bg-good",
  lost: "bg-ink-soft",
};

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  call: "โทรศัพท์",
  meeting: "นัดพบ",
  email: "อีเมล",
  line_message: "LINE",
  note: "บันทึกช่วยจำ",
  task_completed: "งานเสร็จสิ้น",
  quotation: "ใบเสนอราคา",
  document: "เอกสาร",
  invoice: "ใบแจ้งหนี้",
  shipment_update: "อัปเดตการขนส่ง",
  system: "ระบบ",
};

function formatTHB(n: number) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
}

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as week start
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function getRange(preset: string | undefined, from: string | undefined, to: string | undefined) {
  const now = new Date();
  if (preset === "custom" && from && to) {
    return { start: startOfDay(new Date(from)), end: endOfDay(new Date(to)) };
  }
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now), end: endOfDay(now) };
    case "year":
      return { start: startOfYear(now), end: endOfDay(now) };
    case "month":
    default:
      return { start: startOfMonth(now), end: endOfDay(now) };
  }
}

function getPreviousRange(start: Date, end: Date) {
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { prevStart, prevEnd };
}

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}) {
  const { preset, from, to } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { start, end } = getRange(preset, from, to);
  const { prevStart, prevEnd } = getPreviousRange(start, end);
  const activePreset = preset && ["today", "week", "month", "year", "custom"].includes(preset) ? preset : "month";

  const [
    { count: companyCount },
    { data: deals },
    { data: recentActivities },
    { count: searchJobCount },
    { count: pendingLeadCount },
    { count: prevCompanyCount },
    { data: prevDeals },
    { count: prevSearchJobCount },
    { count: prevPendingLeadCount },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("deals")
      .select("id, stage, value_estimate, weight_kg, service_type, company_id, companies(name)")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("activities")
      .select("id, type, subject, occurred_at, companies(name)")
      .gte("occurred_at", start.toISOString())
      .lte("occurred_at", end.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(8),
    supabase
      .from("search_jobs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("candidate_leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString()),
    supabase
      .from("deals")
      .select("stage, value_estimate")
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString()),
    supabase
      .from("search_jobs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString()),
    supabase
      .from("candidate_leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review")
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString()),
  ]);

  const dealList = deals ?? [];
  const openDeals = dealList.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const wonDeals = dealList.filter((d) => d.stage === "won");
  const lostDeals = dealList.filter((d) => d.stage === "lost");

  const pipelineValue = openDeals.reduce((sum, d) => sum + (Number(d.value_estimate) || 0), 0);
  const wonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value_estimate) || 0), 0);

  const prevDealList = prevDeals ?? [];
  const prevOpenDeals = prevDealList.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const prevWonDeals = prevDealList.filter((d) => d.stage === "won");
  const prevLostDeals = prevDealList.filter((d) => d.stage === "lost");
  const prevPipelineValue = prevOpenDeals.reduce((sum, d) => sum + (Number(d.value_estimate) || 0), 0);
  const prevWonValue = prevWonDeals.reduce((sum, d) => sum + (Number(d.value_estimate) || 0), 0);

  // Funnel shows only the forward-moving stages (won included as the final stage) —
  // "lost" is a dead-end outcome, not a funnel step, and already has its own KPI card above.
  const FUNNEL_STAGES = ["new", "contacted", "qualified", "quoted", "negotiation", "won"];
  const funnelStages: FunnelStage[] = FUNNEL_STAGES.map((stage) => {
    const inStage = dealList.filter((d) => d.stage === stage);
    return {
      stage,
      label: STAGE_LABEL[stage],
      accent: STAGE_ACCENT[stage],
      count: inStage.length,
      value: inStage.reduce((sum, d) => sum + (Number(d.value_estimate) || 0), 0),
      deals: inStage.map((d) => ({
        id: d.id,
        companyId: d.company_id,
        companyName: (d.companies as unknown as { name: string } | null)?.name ?? "-",
        serviceType: d.service_type,
        value: Number(d.value_estimate) || 0,
        weightKg: d.weight_kg ? Number(d.weight_kg) : null,
      })),
    };
  });

  return (
    <div className="max-w-5xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-brand text-xl font-extrabold">Executive Dashboard — ภาพรวมธุรกิจ</h1>
        <p className="text-ink-soft text-xs mt-1">
          {toDateInputValue(start)} ถึง {toDateInputValue(end)} — เทียบกับช่วงก่อนหน้า{" "}
          {toDateInputValue(prevStart)} ถึง {toDateInputValue(prevEnd)}
        </p>
      </div>

      <DateRangePicker
        activePreset={activePreset}
        from={toDateInputValue(start)}
        to={toDateInputValue(end)}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="บริษัทใหม่ในช่วงนี้"
          value={String(companyCount ?? 0)}
          accent="bg-brand-tint text-brand"
          icon={<IconBuilding />}
          comparison={<ComparisonBadge current={companyCount ?? 0} previous={prevCompanyCount ?? 0} />}
        />
        <StatCard
          label="มูลค่า Pipeline ใหม่ (เปิดอยู่)"
          value={`฿${formatTHB(pipelineValue)}`}
          accent="bg-blue-50 text-blue-600"
          icon={<IconTrend />}
          comparison={<ComparisonBadge current={pipelineValue} previous={prevPipelineValue} />}
        />
        <StatCard
          label="ปิดการขายแล้ว"
          value={`฿${formatTHB(wonValue)}`}
          sub={`${wonDeals.length} ดีล`}
          accent="bg-good-soft text-good"
          icon={<IconCheck />}
          comparison={<ComparisonBadge current={wonValue} previous={prevWonValue} />}
        />
        <StatCard
          label="เสียโอกาส"
          value={String(lostDeals.length)}
          sub="ดีล"
          accent="bg-warn-soft text-warn"
          icon={<IconX />}
          comparison={
            <ComparisonBadge current={lostDeals.length} previous={prevLostDeals.length} invert />
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">CRM Pipeline</h2>
        <p className="text-xs text-ink-soft -mt-1">แสดงเฉพาะดีลที่สร้างในช่วงเวลาที่เลือกด้านบน</p>
        <SalesFunnel stages={funnelStages} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand">กิจกรรมล่าสุด</h2>
          <div className="flex flex-col gap-2">
            {(recentActivities ?? []).map((a) => (
              <div
                key={a.id}
                className="border border-line rounded-xl px-3 py-2.5 text-sm flex items-center gap-3"
              >
                <div className="flex-none w-8 h-8 rounded-full bg-brand-tint flex items-center justify-center">
                  <IconActivity />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">
                    {ACTIVITY_TYPE_LABEL[a.type] ?? a.type}
                    {a.subject && <span className="font-normal text-ink-soft ml-1.5">— {a.subject}</span>}
                  </div>
                  <div className="text-ink-soft text-xs truncate">
                    {(a.companies as unknown as { name: string } | null)?.name ?? "-"}
                  </div>
                </div>
                <span className="flex-none text-ink-soft text-xs">
                  {new Date(a.occurred_at).toLocaleDateString("th-TH")}
                </span>
              </div>
            ))}
            {(recentActivities ?? []).length === 0 && (
              <p className="text-sm text-ink-soft">ไม่มีกิจกรรมในช่วงเวลานี้</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand">AI Prospecting</h2>
          <div className="flex flex-col gap-2">
            <div className="border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Search Job ในช่วงนี้</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-brand text-lg">{searchJobCount ?? 0}</span>
                <ComparisonBadge current={searchJobCount ?? 0} previous={prevSearchJobCount ?? 0} />
              </div>
            </div>
            <div className="border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Lead ใหม่ในช่วงนี้ที่รอตรวจสอบ</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-brand text-lg">{pendingLeadCount ?? 0}</span>
                <ComparisonBadge current={pendingLeadCount ?? 0} previous={prevPendingLeadCount ?? 0} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ComparisonBadge({
  current,
  previous,
  invert = false,
}: {
  current: number;
  previous: number;
  invert?: boolean;
}) {
  if (previous === 0 && current === 0) return null;

  if (previous === 0) {
    return <span className="text-xs font-semibold text-good">ใหม่</span>;
  }

  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    return <span className="text-xs font-semibold text-ink-soft">ไม่เปลี่ยนแปลง</span>;
  }

  const isGoodDirection = invert ? pct < 0 : pct > 0;
  const colorClass = isGoodDirection ? "text-good" : "text-brand";
  const arrow = pct > 0 ? "▲" : "▼";

  return (
    <span className={`text-xs font-semibold ${colorClass}`}>
      {arrow} {Math.abs(pct)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
  comparison,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
  comparison?: React.ReactNode;
}) {
  return (
    <div className="border border-line rounded-2xl p-4 flex flex-col gap-3 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${accent}`}>{icon}</div>
        {comparison}
      </div>
      <div>
        <div className="text-ink-soft text-xs">{label}</div>
        <div className="text-ink text-lg font-extrabold mt-0.5">
          {value}
          {sub && <span className="text-ink-soft text-xs font-normal ml-1">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </svg>
  );
}

function IconTrend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
