import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { skipLead, saveLead, approveLead } from "@/lib/actions/leads";
import { scoreLeadAction } from "@/lib/actions/scoring";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const CONFIDENCE_LABEL: Record<string, string> = {
  low: "ความมั่นใจต่ำ — ข้อมูลไม่เพียงพอ",
  medium: "ความมั่นใจปานกลาง",
  high: "ความมั่นใจสูง",
};

const CONFIDENCE_STYLE: Record<string, string> = {
  low: "bg-yellow-50 text-yellow-700 border-yellow-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-green-50 text-green-700 border-green-200",
};

export default async function LeadResultPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job: jobFilter } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const canApprove = profile?.role === "admin" || profile?.role === "sales_manager";

  let leadsQuery = supabase
    .from("candidate_leads")
    .select(
      "id, name, website, country, business_type, province_state, facebook_url, linkedin_url, email, phone, has_factory, employee_count_est, revenue_est, export_markets, marketplace_platforms, export_evidence, recommended_logistics_service, lead_score, export_score, logistics_score, lead_reason, sources, raw_source_data, search_job_id, created_at"
    )
    .eq("status", "pending_review")
    .order("lead_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (jobFilter) {
    leadsQuery = leadsQuery.eq("search_job_id", jobFilter);
  }

  const { data: leads } = await leadsQuery;

  const jobLabel = jobFilter
    ? ((await supabase.from("search_jobs").select("wizard_filters").eq("id", jobFilter).single())
        .data?.wizard_filters as { product_categories?: string[] } | null)?.product_categories
    : null;

  type ScoreRow = {
    subject_id: string;
    opportunity_score: number;
    difficulty_score: number;
    evidence: unknown;
    reasoning: unknown;
    computed_at: string;
  };

  const leadIds = (leads ?? []).map((l) => l.id);
  const { data: scoreRows } =
    leadIds.length > 0
      ? await supabase
          .from("lead_scores")
          .select("subject_id, opportunity_score, difficulty_score, evidence, reasoning, computed_at")
          .eq("subject_type", "candidate_lead")
          .in("subject_id", leadIds)
          .order("computed_at", { ascending: false })
      : { data: [] as ScoreRow[] };

  const scoreByLead = new Map<string, ScoreRow>();
  for (const row of (scoreRows ?? []) as ScoreRow[]) {
    if (!scoreByLead.has(row.subject_id)) {
      scoreByLead.set(row.subject_id, row);
    }
  }

  const jobProductNames = (jobLabel ?? [])
    .map((code) => PRODUCT_CATEGORIES.find((p) => p.code === code)?.name ?? code)
    .join(", ");

  return (
    <div className="p-8 max-w-3xl flex flex-col gap-4">
      <h1 className="text-brand text-xl font-extrabold">Lead Result — บริษัทที่ AI ค้นพบ</h1>
      {jobFilter ? (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-ink-soft text-sm">
            แสดงเฉพาะผลจาก Search Job นี้ ({jobProductNames || "—"}) — {leads?.length ?? 0} รายการ
          </p>
          <a href="/leads" className="text-brand text-xs font-semibold hover:underline">
            แสดง Lead ทั้งหมด (ทุก Search Job)
          </a>
        </div>
      ) : (
        <p className="text-ink-soft text-sm">รอตรวจสอบทั้งหมด {leads?.length ?? 0} รายการ (จากทุก Search Job)</p>
      )}

      {canApprove && (leads?.length ?? 0) > 0 && (
        <div className="bg-brand-tint border border-brand-tint2 rounded-xl px-4 py-3 text-sm text-ink">
          มี Lead ที่ AI ค้นพบรออนุมัติเข้า CRM ทั้งหมด <b>{leads?.length}</b> รายการ — กด "อนุมัติเข้า CRM"
          ที่แต่ละรายการด้านล่างเพื่อส่งต่อให้ทีมขาย
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(leads ?? []).map((lead) => {
          const score = scoreByLead.get(lead.id);
          const reasoning = score?.reasoning as { confidence?: string; summary?: string } | null;
          const confidence = reasoning?.confidence ?? "low";
          const rawSource = lead.raw_source_data as {
            source_type?: string;
            current_logistics_provider?: { name: string; basis: "evidence" | "inferred"; detail: string } | null;
          } | null;
          const isLlmKnowledge = rawSource?.source_type === "llm_knowledge";
          const currentProvider = rawSource?.current_logistics_provider ?? null;

          const evidence = (lead.export_evidence ?? []) as string[];
          const marketplaces = (lead.marketplace_platforms ?? []) as string[];
          const exportCountries = (lead.export_markets ?? []) as string[];

          return (
            <div key={lead.id} className="border border-line rounded-xl p-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold">{lead.name}</div>
                  {isLlmKnowledge && (
                    <span className="text-xs font-semibold border border-purple-200 bg-purple-50 text-purple-700 rounded-full px-2 py-0.5">
                      ✨ แนะนำโดย AI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {typeof lead.export_score === "number" && (
                    <span className="text-xs font-semibold border border-green-200 bg-green-50 text-green-700 rounded-full px-2 py-0.5">
                      Export: {lead.export_score}
                    </span>
                  )}
                  {typeof lead.logistics_score === "number" && (
                    <span className="text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                      Logistics: {lead.logistics_score}
                    </span>
                  )}
                  {typeof lead.lead_score === "number" && (
                    <span className="text-xs font-bold border border-brand-tint2 bg-brand-tint text-brand rounded-full px-2.5 py-1">
                      Opportunity: {lead.lead_score}/100
                    </span>
                  )}
                </div>
              </div>
              <div className="text-ink-soft text-xs">
                {lead.country} · {lead.business_type ?? "-"}
                {lead.province_state ? ` · ${lead.province_state}` : ""}
                {lead.has_factory ? " · มีโรงงานเป็นของตัวเอง" : ""}
                {exportCountries.length > 0 ? ` · ส่งออก: ${exportCountries.join(", ")}` : ""}
              </div>
              <div className="text-ink-soft text-xs">
                พนักงาน: {lead.employee_count_est ?? "ไม่ทราบ"} · รายได้โดยประมาณ:{" "}
                {lead.revenue_est ? `฿${Number(lead.revenue_est).toLocaleString()}` : "ไม่ทราบ"}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand text-xs font-medium break-all"
                >
                  {lead.website}
                </a>
                {lead.linkedin_url && (
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand text-xs font-medium"
                  >
                    LinkedIn ↗
                  </a>
                )}
              </div>

              {lead.recommended_logistics_service && (
                <div className="text-xs">
                  <span className="font-semibold text-ink">บริการที่แนะนำ: </span>
                  <span className="text-ink-soft">{lead.recommended_logistics_service}</span>
                </div>
              )}

              {currentProvider && (
                <div className="text-xs">
                  <span className="font-semibold text-ink">ปัจจุบันน่าจะใช้บริการกับ: </span>
                  <span className="text-ink-soft">{currentProvider.name}</span>
                  <span
                    className={`ml-1.5 text-xs font-semibold border rounded-full px-2 py-0.5 ${
                      currentProvider.basis === "evidence"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }`}
                  >
                    {currentProvider.basis === "evidence" ? "พบหลักฐานจริง" : "AI คาดการณ์"}
                  </span>
                  <p className="text-ink-soft text-xs mt-0.5">{currentProvider.detail}</p>
                </div>
              )}

              {(evidence.length > 0 || marketplaces.length > 0) && (
                <ul className="flex flex-wrap gap-1.5">
                  {evidence.map((item, i) => (
                    <li
                      key={`ev-${i}`}
                      className="text-xs border border-green-200 bg-green-50 text-green-700 rounded-full px-2 py-0.5"
                    >
                      ✔ {item}
                    </li>
                  ))}
                  {marketplaces.map((item, i) => (
                    <li
                      key={`mp-${i}`}
                      className="text-xs border border-blue-200 bg-blue-50 text-blue-700 rounded-full px-2 py-0.5"
                    >
                      🛒 {item}
                    </li>
                  ))}
                </ul>
              )}

              {lead.lead_reason && (
                <p className="text-ink-soft text-xs border-t border-line-soft pt-2">
                  {lead.lead_reason}
                </p>
              )}

              {score ? (
                <div className="border-t border-line-soft pt-2 mt-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-brand">
                      Opportunity Score: {score.opportunity_score}/100
                    </span>
                    <span className="text-xs text-ink-soft">
                      Difficulty: {score.difficulty_score}/100
                    </span>
                    <span
                      className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${CONFIDENCE_STYLE[confidence] ?? CONFIDENCE_STYLE.low}`}
                    >
                      {CONFIDENCE_LABEL[confidence] ?? CONFIDENCE_LABEL.low}
                    </span>
                  </div>

                  {reasoning?.summary && (
                    <p className="text-ink-soft text-xs">{reasoning.summary}</p>
                  )}

                  {Array.isArray(score.evidence) && score.evidence.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {(score.evidence as string[]).map((item, i) => (
                        <li key={i} className="text-xs flex gap-1.5">
                          <span className="text-good">✔</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <form action={scoreLeadAction.bind(null, lead.id)} className="mt-1">
                  <button
                    type="submit"
                    className="border border-brand text-brand rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-brand-tint"
                  >
                    ให้ AI วิเคราะห์ (Analyze with AI)
                  </button>
                </form>
              )}

              <div className="flex gap-2 mt-2">
                <form action={skipLead.bind(null, lead.id)}>
                  <button
                    type="submit"
                    className="border border-line rounded-lg px-4 py-1.5 text-xs font-semibold text-ink-soft hover:bg-line-soft"
                  >
                    ข้าม (Skip)
                  </button>
                </form>

                {canApprove ? (
                  <form action={approveLead.bind(null, lead.id)}>
                    <button
                      type="submit"
                      className="bg-brand hover:bg-brand-dark text-white rounded-lg px-4 py-1.5 text-xs font-bold"
                    >
                      อนุมัติเข้า CRM (Approve)
                    </button>
                  </form>
                ) : (
                  <form action={saveLead.bind(null, lead.id)}>
                    <button
                      type="submit"
                      className="bg-brand hover:bg-brand-dark text-white rounded-lg px-4 py-1.5 text-xs font-bold"
                    >
                      บันทึกไว้ (Save)
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}

        {(leads ?? []).length === 0 && (
          <p className="text-sm text-ink-soft">ไม่มี Lead ที่รอตรวจสอบตอนนี้</p>
        )}
      </div>
    </div>
  );
}
