import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createContact, updateContactConsent } from "@/lib/actions/contacts";
import { createDeal, updateDealStage } from "@/lib/actions/deals";
import { createActivity } from "@/lib/actions/activities";
import { createTask, setTaskStatus, reassignTask } from "@/lib/actions/tasks";
import {
  createQuotation,
  updateQuotationStatus,
  requestQuotationApproval,
  decideQuotationApproval,
} from "@/lib/actions/quotations";
import { createDocument } from "@/lib/actions/documents";
import { createCompanyMessage } from "@/lib/actions/company-messages";
import { analyzeCompetitorAction } from "@/lib/actions/competitor-intelligence";
import { DeleteCompanyButton } from "../delete-company-button";

const ROLE_TYPE_LABEL: Record<string, string> = {
  owner: "เจ้าของ/ผู้บริหาร",
  export_manager: "ผู้จัดการฝ่ายส่งออก",
  sales_manager: "ผู้จัดการฝ่ายขาย",
  procurement: "ฝ่ายจัดซื้อ",
  logistics: "ฝ่าย Logistics",
  other: "อื่นๆ",
};

const STAGE_LABEL: Record<string, string> = {
  new: "ใหม่",
  contacted: "ติดต่อแล้ว",
  qualified: "ผ่านเกณฑ์",
  quoted: "เสนอราคาแล้ว",
  negotiation: "เจรจาต่อรอง",
  won: "ปิดการขาย",
  lost: "เสียโอกาส",
};

const STAGES = ["new", "contacted", "qualified", "quoted", "negotiation", "won", "lost"];

const CONSENT_LABEL: Record<string, string> = {
  subscribed: "สมัครรับข่าวสาร",
  unsubscribed: "ยกเลิกรับข่าวสาร",
  not_asked: "ยังไม่ได้ถาม",
};

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  call: "โทรศัพท์",
  meeting: "นัดพบ",
  email: "อีเมล",
  line_message: "LINE",
  note: "บันทึกช่วยจำ",
};

const QUOTATION_STATUS_LABEL: Record<string, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  accepted: "ลูกค้ายอมรับ",
  rejected: "ลูกค้าปฏิเสธ",
};

const QUOTATION_STATUSES = ["draft", "sent", "accepted", "rejected"];

const APPROVAL_STATUS_LABEL: Record<string, string> = {
  not_requested: "ยังไม่ขออนุมัติ",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
};

const APPROVAL_STATUS_STYLE: Record<string, string> = {
  not_requested: "bg-line-soft text-ink-soft border-line",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

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

const OUTCOME_REASON_LABEL: Record<string, string> = {
  price: "ราคา",
  competitor_incumbent: "ลูกค้าใช้คู่แข่งอยู่แล้ว",
  transit_time: "ระยะเวลาขนส่ง",
  service_mismatch: "บริการไม่ตรงความต้องการ",
  relationship: "ความสัมพันธ์/ความไว้ใจ",
  other: "อื่นๆ",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: company } = await supabase.from("companies").select("*").eq("id", id).single();
  if (!company) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const canDelete = profile?.role === "admin" || profile?.role === "sales_manager";
  const canApprove = canDelete;

  const { data: orgUsers } = await supabase
    .from("users")
    .select("id, name")
    .eq("organization_id", company.organization_id)
    .eq("status", "active")
    .order("name");

  const { data: messages } = await supabase
    .from("company_messages")
    .select("id, body, created_at, sender_id, users(name)")
    .eq("company_id", id)
    .order("created_at", { ascending: true });

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("company_id", id)
    .order("is_primary", { ascending: false });

  const { data: deals } = await supabase
    .from("deals")
    .select("id, service_type, stage, value_estimate, weight_kg, currency, business_unit_id")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const { data: businessUnits } = await supabase
    .from("business_units")
    .select("id, name")
    .order("code");

  const { data: competitorsList } = await supabase
    .from("competitors")
    .select("id, name")
    .eq("organization_id", company.organization_id)
    .eq("is_active", true)
    .order("name");

  const dealIds = (deals ?? []).map((d) => d.id);
  const { data: openStageRows } =
    dealIds.length > 0
      ? await supabase
          .from("deal_stage_history")
          .select("deal_id, entered_at")
          .in("deal_id", dealIds)
          .is("exited_at", null)
      : { data: [] };

  const daysInStageByDeal = new Map<string, number>();
  for (const row of openStageRows ?? []) {
    const days = Math.floor((Date.now() - new Date(row.entered_at).getTime()) / 86400000);
    daysInStageByDeal.set(row.deal_id, days);
  }

  const { data: activities } = await supabase
    .from("activities")
    .select("id, type, subject, body, occurred_at")
    .eq("company_id", id)
    .order("occurred_at", { ascending: false });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, status, assigned_to")
    .eq("company_id", id)
    .order("due_date", { ascending: true, nullsFirst: false });

  const todayStr = new Date().toISOString().slice(0, 10);
  const dueTaskCount = (tasks ?? []).filter(
    (t) => t.status === "open" && t.due_date && t.due_date <= todayStr
  ).length;

  const { data: quotations } = await supabase
    .from("quotations")
    .select(
      "id, quote_number, service_type, amount, currency, status, deal_id, approval_status, requested_by"
    )
    .eq("company_id", id)
    .order("issued_at", { ascending: false, nullsFirst: false });

  const { data: documents } = await supabase
    .from("documents")
    .select("id, file_name, file_url, storage_path, uploaded_at")
    .eq("company_id", id)
    .order("uploaded_at", { ascending: false });

  const documentsWithUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      if (!doc.storage_path) return { ...doc, resolvedUrl: doc.file_url };
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 3600);
      return { ...doc, resolvedUrl: signed?.signedUrl ?? doc.file_url };
    })
  );

  const { data: competitorIntel } = await supabase
    .from("competitor_intelligence")
    .select(
      "id, confidence_score, confidence_level, evidence, why_this_prediction, competitor_strengths, competitor_weaknesses, recommended_strategy, recommended_service_first, generated_at, competitors(name)"
    )
    .eq("company_id", id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const predictedCompetitorName =
    (competitorIntel?.competitors as unknown as { name: string } | null)?.name ?? null;

  return (
    <div className="p-8 max-w-3xl flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-brand text-xl font-extrabold">{company.name}</h1>
          <p className="text-ink-soft text-sm mt-1">
            {company.country ?? "-"} · {company.business_type ?? "-"}
          </p>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="text-brand text-xs font-medium break-all"
            >
              {company.website}
            </a>
          )}
        </div>
        {canDelete && (
          <DeleteCompanyButton
            companyId={id}
            companyName={company.name}
            className="flex-none border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2 text-sm font-semibold"
          />
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">
          แชททีมเกี่ยวกับลูกค้ารายนี้ (Team Chat)
        </h2>
        <div className="border border-line rounded-xl p-3 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {(messages ?? []).map((m) => (
            <div key={m.id} className="text-sm">
              <span className="font-bold">
                {(m.users as unknown as { name: string } | null)?.name ?? "-"}
              </span>
              <span className="text-ink-soft text-xs ml-2">
                {new Date(m.created_at).toLocaleString("th-TH")}
              </span>
              <p className="mt-0.5">{m.body}</p>
            </div>
          ))}
          {(messages ?? []).length === 0 && (
            <p className="text-sm text-ink-soft">ยังไม่มีข้อความในแชทนี้</p>
          )}
        </div>
        <form action={createCompanyMessage.bind(null, id)} className="flex gap-2">
          <input
            name="body"
            placeholder="พิมพ์ข้อความถึงทีม..."
            required
            className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            ส่ง
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">
          Competitor Intelligence
        </h2>
        {competitorIntel ? (
          <div className="border border-line rounded-xl p-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">
                คู่แข่งที่คาดการณ์: {predictedCompetitorName ?? "ไม่สามารถระบุได้"}
              </span>
              <span
                className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${CONFIDENCE_STYLE[competitorIntel.confidence_level ?? "low"] ?? CONFIDENCE_STYLE.low}`}
              >
                {CONFIDENCE_LABEL[competitorIntel.confidence_level ?? "low"] ?? CONFIDENCE_LABEL.low}
                {" "}({competitorIntel.confidence_score}/100)
              </span>
            </div>

            {competitorIntel.why_this_prediction && (
              <p className="text-ink-soft text-xs">{competitorIntel.why_this_prediction}</p>
            )}

            {Array.isArray(competitorIntel.evidence) && competitorIntel.evidence.length > 0 && (
              <ul className="flex flex-col gap-1">
                {(competitorIntel.evidence as string[]).map((item, i) => (
                  <li key={i} className="text-xs flex gap-1.5">
                    <span className="text-good">✔</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {Array.isArray(competitorIntel.competitor_strengths) &&
              competitorIntel.competitor_strengths.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-ink-soft">จุดแข็งคู่แข่ง:</span>
                  <ul className="flex flex-col gap-0.5 mt-1">
                    {(competitorIntel.competitor_strengths as string[]).map((item, i) => (
                      <li key={i} className="text-xs">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {Array.isArray(competitorIntel.competitor_weaknesses) &&
              competitorIntel.competitor_weaknesses.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-ink-soft">จุดอ่อนคู่แข่ง:</span>
                  <ul className="flex flex-col gap-0.5 mt-1">
                    {(competitorIntel.competitor_weaknesses as string[]).map((item, i) => (
                      <li key={i} className="text-xs">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {competitorIntel.recommended_strategy && (
              <div className="bg-brand-tint rounded-lg p-3 mt-1">
                <span className="text-xs font-bold text-brand">กลยุทธ์แนะนำ:</span>
                <p className="text-xs mt-1">{competitorIntel.recommended_strategy}</p>
                {competitorIntel.recommended_service_first && (
                  <p className="text-xs mt-1">
                    <span className="font-bold">บริการที่ควรเสนอก่อน:</span>{" "}
                    {competitorIntel.recommended_service_first}
                  </p>
                )}
              </div>
            )}

            <form action={analyzeCompetitorAction.bind(null, id)} className="mt-1">
              <button
                type="submit"
                className="border border-brand text-brand rounded-lg px-4 py-1.5 text-xs font-semibold hover:bg-brand-tint"
              >
                วิเคราะห์ใหม่ (Re-analyze)
              </button>
            </form>
          </div>
        ) : (
          <form action={analyzeCompetitorAction.bind(null, id)}>
            <button
              type="submit"
              className="border border-brand text-brand rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-tint"
            >
              วิเคราะห์คู่แข่ง (Analyze Competitors)
            </button>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">ผู้ติดต่อ (Contacts)</h2>
        <div className="flex flex-col gap-2">
          {(contacts ?? []).map((c) => (
            <div key={c.id} className="border border-line rounded-xl p-3 text-sm">
              <div className="font-bold">
                {c.name}
                {c.is_primary && <span className="text-brand text-xs font-bold ml-1">(หลัก)</span>}
              </div>
              <div className="text-ink-soft text-xs">
                {c.position ?? "-"} · {c.role_type ? ROLE_TYPE_LABEL[c.role_type] : "-"}
              </div>
              <div className="text-ink-soft text-xs">
                {c.email ?? "-"} · {c.phone ?? "-"}
              </div>
              {c.email && (
                <form
                  action={updateContactConsent.bind(null, c.id, id)}
                  className="flex items-center gap-2 mt-2"
                >
                  <span className="text-ink-soft text-xs">Email Marketing:</span>
                  <select
                    name="email_marketing_consent"
                    defaultValue={c.email_marketing_consent}
                    className="border border-line rounded-lg px-2 py-1 text-xs"
                  >
                    {Object.entries(CONSENT_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="border border-brand text-brand rounded-lg px-2 py-1 text-xs font-semibold"
                  >
                    บันทึก
                  </button>
                </form>
              )}
            </div>
          ))}
          {(contacts ?? []).length === 0 && (
            <p className="text-sm text-ink-soft">ยังไม่มีผู้ติดต่อ</p>
          )}
        </div>

        <form
          action={createContact.bind(null, id)}
          className="border border-line rounded-xl p-4 flex flex-col gap-2"
        >
          <span className="text-xs font-bold text-ink-soft">เพิ่มผู้ติดต่อใหม่</span>
          <input
            name="name"
            placeholder="ชื่อ"
            required
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="position"
            placeholder="ตำแหน่ง"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <select name="role_type" className="border border-line rounded-lg px-3 py-2 text-sm">
            <option value="">-- บทบาท --</option>
            {Object.entries(ROLE_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="email"
            type="email"
            placeholder="อีเมล"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="phone"
            placeholder="เบอร์โทร"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            เพิ่มผู้ติดต่อ
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">ดีล (Deals)</h2>
        <div className="flex flex-col gap-2">
          {(deals ?? []).map((d) => (
            <div key={d.id} className="border border-line rounded-xl p-3 text-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">{d.service_type}</div>
                  <div className="text-ink-soft text-xs">
                    {d.value_estimate
                      ? `${Number(d.value_estimate).toLocaleString()} ${d.currency}`
                      : "ยังไม่ระบุมูลค่า"}
                    {d.weight_kg ? ` · ${Number(d.weight_kg).toLocaleString()} kg` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-brand">
                    {STAGE_LABEL[d.stage] ?? d.stage}
                  </span>
                  {daysInStageByDeal.has(d.id) && (
                    <div className="text-ink-soft text-xs">
                      อยู่ใน stage นี้มา {daysInStageByDeal.get(d.id)} วัน
                    </div>
                  )}
                </div>
              </div>
              <form action={updateDealStage.bind(null, d.id, id)} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select
                    name="stage"
                    defaultValue={d.stage}
                    className="border border-line rounded-lg px-2 py-1 text-xs flex-1"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="border border-brand text-brand rounded-lg px-3 py-1 text-xs font-semibold"
                  >
                    อัปเดต
                  </button>
                </div>
                <div className="flex flex-col gap-1 border-t border-line-soft pt-2">
                  <span className="text-ink-soft text-xs">
                    ถ้าจะปิดดีลเป็น "ปิดการขาย" หรือ "เสียโอกาส" กรอกข้อมูลนี้ด้วย (ไม่บังคับ)
                  </span>
                  <div className="flex gap-2">
                    <select
                      name="outcome_reason_category"
                      defaultValue=""
                      className="border border-line rounded-lg px-2 py-1 text-xs flex-1"
                    >
                      <option value="">-- เหตุผล --</option>
                      {Object.entries(OUTCOME_REASON_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      name="lost_to_competitor_id"
                      defaultValue=""
                      className="border border-line rounded-lg px-2 py-1 text-xs flex-1"
                    >
                      <option value="">-- แพ้ให้คู่แข่งราย (ถ้าเสียโอกาส) --</option>
                      {(competitorsList ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    name="outcome_reason_detail"
                    placeholder="รายละเอียดเพิ่มเติม"
                    className="border border-line rounded-lg px-2 py-1 text-xs"
                  />
                </div>
              </form>
            </div>
          ))}
          {(deals ?? []).length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีดีล</p>}
        </div>

        <form
          action={createDeal.bind(null, id)}
          className="border border-line rounded-xl p-4 flex flex-col gap-2"
        >
          <span className="text-xs font-bold text-ink-soft">สร้างดีลใหม่</span>
          <select name="business_unit_id" required className="border border-line rounded-lg px-3 py-2 text-sm">
            <option value="">-- เลือก Business Unit --</option>
            {(businessUnits ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <input
            name="service_type"
            placeholder="บริการ (เช่น International Express)"
            required
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="value_estimate"
            type="number"
            placeholder="มูลค่าประเมิน (บาท)"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="weight_kg"
            type="number"
            step="0.01"
            min="0"
            placeholder="น้ำหนัก (กิโลกรัม)"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            สร้างดีล
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">
          ใบเสนอราคา (Quotations)
        </h2>
        <div className="flex flex-col gap-2">
          {(quotations ?? []).map((q) => (
            <div key={q.id} className="border border-line rounded-xl p-3 text-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">
                    {q.service_type}
                    {q.quote_number && (
                      <span className="text-ink-soft font-normal ml-1">({q.quote_number})</span>
                    )}
                  </div>
                  <div className="text-ink-soft text-xs">
                    {q.amount
                      ? `${Number(q.amount).toLocaleString()} ${q.currency}`
                      : "ยังไม่ระบุมูลค่า"}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-brand">
                    {QUOTATION_STATUS_LABEL[q.status] ?? q.status}
                  </span>
                  <span
                    className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${APPROVAL_STATUS_STYLE[q.approval_status] ?? APPROVAL_STATUS_STYLE.not_requested}`}
                  >
                    {APPROVAL_STATUS_LABEL[q.approval_status] ?? q.approval_status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 border-t border-line-soft pt-2">
                {q.approval_status !== "pending" && (
                  <form action={requestQuotationApproval.bind(null, q.id, id)}>
                    <button
                      type="submit"
                      className="border border-brand text-brand rounded-lg px-3 py-1 text-xs font-semibold"
                    >
                      ส่งขออนุมัติ
                    </button>
                  </form>
                )}
                {canApprove && q.approval_status === "pending" && (
                  <>
                    <form action={decideQuotationApproval.bind(null, q.id, id)}>
                      <input type="hidden" name="decision" value="approved" />
                      <button
                        type="submit"
                        className="bg-good hover:opacity-90 text-white rounded-lg px-3 py-1 text-xs font-semibold"
                      >
                        อนุมัติ
                      </button>
                    </form>
                    <form action={decideQuotationApproval.bind(null, q.id, id)}>
                      <input type="hidden" name="decision" value="rejected" />
                      <button
                        type="submit"
                        className="border border-red-300 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1 text-xs font-semibold"
                      >
                        ไม่อนุมัติ
                      </button>
                    </form>
                  </>
                )}
              </div>
              <form action={updateQuotationStatus.bind(null, q.id, id)} className="flex gap-2">
                <select
                  name="status"
                  defaultValue={q.status}
                  className="border border-line rounded-lg px-2 py-1 text-xs flex-1"
                >
                  {QUOTATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {QUOTATION_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="border border-brand text-brand rounded-lg px-3 py-1 text-xs font-semibold"
                >
                  อัปเดต
                </button>
              </form>
            </div>
          ))}
          {(quotations ?? []).length === 0 && (
            <p className="text-sm text-ink-soft">ยังไม่มีใบเสนอราคา</p>
          )}
        </div>

        <form
          action={createQuotation.bind(null, id)}
          className="border border-line rounded-xl p-4 flex flex-col gap-2"
        >
          <span className="text-xs font-bold text-ink-soft">สร้างใบเสนอราคาใหม่</span>
          <select name="deal_id" required className="border border-line rounded-lg px-3 py-2 text-sm">
            <option value="">-- เลือกดีล --</option>
            {(deals ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.service_type}
              </option>
            ))}
          </select>
          <input
            name="quote_number"
            placeholder="เลขที่ใบเสนอราคา (ไม่บังคับ)"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="service_type"
            placeholder="บริการ"
            required
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="amount"
            type="number"
            placeholder="มูลค่า (บาท)"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            สร้างใบเสนอราคา
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">
          ประวัติการติดต่อ (Activities)
        </h2>
        <div className="flex flex-col gap-2">
          {(activities ?? []).map((a) => (
            <div key={a.id} className="border border-line rounded-xl p-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-bold">{ACTIVITY_TYPE_LABEL[a.type] ?? a.type}</span>
                <span className="text-ink-soft text-xs">
                  {new Date(a.occurred_at).toLocaleDateString("th-TH")}
                </span>
              </div>
              {a.subject && <div className="text-sm mt-1">{a.subject}</div>}
              {a.body && <div className="text-ink-soft text-xs mt-1">{a.body}</div>}
            </div>
          ))}
          {(activities ?? []).length === 0 && (
            <p className="text-sm text-ink-soft">ยังไม่มีประวัติการติดต่อ</p>
          )}
        </div>

        <form
          action={createActivity.bind(null, id)}
          className="border border-line rounded-xl p-4 flex flex-col gap-2"
        >
          <span className="text-xs font-bold text-ink-soft">บันทึกกิจกรรมใหม่</span>
          <select name="type" required className="border border-line rounded-lg px-3 py-2 text-sm">
            {Object.entries(ACTIVITY_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="subject"
            placeholder="หัวข้อ"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            placeholder="รายละเอียด"
            rows={2}
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            บันทึกกิจกรรม
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">งานที่ต้องทำ (Tasks)</h2>
        {canDelete && dueTaskCount > 0 && (
          <div className="bg-brand-tint border border-brand-tint2 rounded-xl px-4 py-3 text-sm text-ink">
            มีงานที่ครบกำหนดแล้วหรือวันนี้ <b>{dueTaskCount}</b> งาน ที่ยังไม่เสร็จ
          </div>
        )}
        <div className="flex flex-col gap-2">
          {(tasks ?? []).map((t) => {
            const assigneeName = (orgUsers ?? []).find((u) => u.id === t.assigned_to)?.name;
            return (
              <div key={t.id} className="border border-line rounded-xl p-3 text-sm flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className={`font-bold ${t.status === "done" ? "line-through text-ink-soft" : ""}`}>
                      {t.title}
                    </div>
                    {t.due_date && (
                      <div className="text-ink-soft text-xs">
                        ครบกำหนด: {new Date(t.due_date).toLocaleDateString("th-TH")}
                        {assigneeName ? ` · รับผิดชอบ: ${assigneeName}` : ""}
                      </div>
                    )}
                  </div>
                  <form action={setTaskStatus.bind(null, t.id, id)}>
                    <input type="hidden" name="status" value={t.status === "open" ? "done" : "open"} />
                    <button
                      type="submit"
                      className="border border-brand text-brand rounded-lg px-3 py-1 text-xs font-semibold"
                    >
                      {t.status === "open" ? "ทำเสร็จแล้ว" : "เปิดใหม่"}
                    </button>
                  </form>
                </div>
                <form action={reassignTask.bind(null, t.id, id)} className="flex gap-2 border-t border-line-soft pt-2">
                  <select
                    name="assigned_to"
                    defaultValue={t.assigned_to ?? ""}
                    className="border border-line rounded-lg px-2 py-1 text-xs flex-1"
                  >
                    <option value="">-- เลือกผู้รับผิดชอบ --</option>
                    {(orgUsers ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="border border-brand text-brand rounded-lg px-3 py-1 text-xs font-semibold"
                  >
                    ส่งต่องาน
                  </button>
                </form>
              </div>
            );
          })}
          {(tasks ?? []).length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีงานที่ต้องทำ</p>}
        </div>

        <form
          action={createTask.bind(null, id)}
          className="border border-line rounded-xl p-4 flex flex-col gap-2"
        >
          <span className="text-xs font-bold text-ink-soft">สร้างงานใหม่</span>
          <input
            name="title"
            placeholder="ชื่องาน"
            required
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="due_date"
            type="date"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            สร้างงาน
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand">เอกสารแนบ (Documents)</h2>
        <div className="flex flex-col gap-2">
          {documentsWithUrls.map((doc) => (
            <a
              key={doc.id}
              href={doc.resolvedUrl}
              target="_blank"
              rel="noreferrer"
              className="border border-line rounded-xl p-3 text-sm flex justify-between items-center hover:border-brand"
            >
              <span className="font-bold">{doc.file_name}</span>
              <span className="text-ink-soft text-xs">
                {new Date(doc.uploaded_at).toLocaleDateString("th-TH")}
              </span>
            </a>
          ))}
          {documentsWithUrls.length === 0 && (
            <p className="text-sm text-ink-soft">ยังไม่มีเอกสารแนบ</p>
          )}
        </div>

        <form
          action={createDocument.bind(null, id)}
          className="border border-line rounded-xl p-4 flex flex-col gap-2"
        >
          <span className="text-xs font-bold text-ink-soft">แนบเอกสารใหม่</span>
          <input
            name="file_name"
            placeholder="ชื่อไฟล์ (ไม่บังคับ — ถ้าอัปโหลดไฟล์จะใช้ชื่อไฟล์เดิมถ้าไม่ระบุ)"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-ink-soft">อัปโหลดไฟล์จากเครื่อง</span>
            <input
              name="file"
              type="file"
              className="border border-line rounded-lg px-3 py-2 text-sm bg-white"
            />
          </label>
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <span className="flex-1 border-t border-line-soft" />
            <span>หรือ</span>
            <span className="flex-1 border-t border-line-soft" />
          </div>
          <input
            name="file_url"
            type="url"
            placeholder="วางลิงก์ไฟล์ (Google Drive, Dropbox ฯลฯ)"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            แนบเอกสาร
          </button>
        </form>
      </section>

      <a href="/companies" className="text-brand text-sm font-semibold">
        ← กลับไปหน้ารายชื่อบริษัท
      </a>
    </div>
  );
}
