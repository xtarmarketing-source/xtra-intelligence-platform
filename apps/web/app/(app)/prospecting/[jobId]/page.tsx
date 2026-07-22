import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { startProspecting } from "@/lib/actions/prospecting";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const STATUS_LABEL: Record<string, string> = {
  queued: "รอดำเนินการ",
  running: "กำลังค้นหา",
  completed: "เสร็จสิ้น",
  failed: "ล้มเหลว",
};

export default async function SearchJobStatusPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: job } = await supabase
    .from("search_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) {
    notFound();
  }

  const productCodes: string[] =
    (job.wizard_filters as { product_categories?: string[] } | null)?.product_categories ?? [];
  const productNames = productCodes
    .map((code) => PRODUCT_CATEGORIES.find((p) => p.code === code)?.name ?? code)
    .join(", ");

  const { data: candidates } =
    job.status === "completed"
      ? await supabase
          .from("candidate_leads")
          .select(
            "id, name, website, country, business_type, lead_score, recommended_logistics_service, sources, raw_source_data"
          )
          .eq("search_job_id", jobId)
          .order("lead_score", { ascending: false, nullsFirst: false })
      : { data: null };

  return (
    <div className="p-8 max-w-2xl flex flex-col gap-4">
      <h1 className="text-brand text-xl font-extrabold">Search Job สร้างสำเร็จ</h1>

      <div className="border border-line rounded-xl p-5 flex flex-col gap-2 text-sm">
        <Row label="สถานะ" value={STATUS_LABEL[job.status] ?? job.status} />
        <Row label="ทิศทางการค้า" value={job.trade_direction === "export" ? "Export" : "Import"} />
        <Row label="สินค้า" value={productNames} />
        <Row label="อุตสาหกรรม" value={(job.business_types ?? []).join(", ")} />
        <Row label="บริการ" value={(job.services ?? []).join(", ")} />
      </div>

      {job.status === "queued" && (
        <form action={startProspecting.bind(null, job.id)}>
          <button
            type="submit"
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-5 py-3 text-sm"
          >
            เริ่มค้นหา (Start Prospecting)
          </button>
        </form>
      )}

      {job.status === "failed" && (
        <div className="flex flex-col gap-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            การค้นหาล้มเหลว — อาจเกิดจาก API key ไม่ถูกต้องหรือใช้โควตาเกินกำหนด กรุณาลองใหม่อีกครั้ง
          </div>
          <form action={startProspecting.bind(null, job.id)}>
            <button
              type="submit"
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-5 py-3 text-sm"
            >
              ลองค้นหาใหม่
            </button>
          </form>
        </div>
      )}

      {job.status === "completed" && (
        <div className="flex flex-col gap-3">
          <div className="bg-brand-tint border border-brand-tint2 rounded-xl p-4 text-sm text-ink flex items-center justify-between gap-3">
            <span>
              พบบริษัททั้งหมด {job.result_count} รายการ — ไปที่หน้า Lead Result เพื่อให้ AI วิเคราะห์
              และตรวจสอบก่อนอนุมัติเข้า CRM
            </span>
            <a
              href={`/leads?job=${job.id}`}
              className="flex-none bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-xs"
            >
              ไปที่ Lead Result
            </a>
          </div>

          <div className="flex flex-col gap-2">
            {(candidates ?? []).map((c) => {
              const rawSource = c.raw_source_data as { source_type?: string } | null;
              const isLlmKnowledge = rawSource?.source_type === "llm_knowledge";
              return (
              <div key={c.id} className="border border-line rounded-xl p-4 text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold">{c.name}</div>
                    {isLlmKnowledge && (
                      <span className="text-xs font-semibold border border-purple-200 bg-purple-50 text-purple-700 rounded-full px-2 py-0.5">
                        ✨ แนะนำโดย AI
                      </span>
                    )}
                  </div>
                  {typeof c.lead_score === "number" && (
                    <span className="text-xs font-bold border border-brand-tint2 bg-brand-tint text-brand rounded-full px-2.5 py-1">
                      Lead Score: {c.lead_score}/100
                    </span>
                  )}
                </div>
                <div className="text-ink-soft text-xs mt-1">
                  {c.country} · {c.business_type ?? "-"}
                  {c.recommended_logistics_service ? ` · แนะนำ: ${c.recommended_logistics_service}` : ""}
                </div>
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand text-xs font-medium break-all"
                >
                  {c.website}
                </a>
              </div>
              );
            })}
            {(candidates ?? []).length === 0 && (
              <p className="text-sm text-ink-soft">
                ไม่พบบริษัทที่ตรงเงื่อนไข ลองปรับตัวกรองแล้วสร้าง Search Job ใหม่
              </p>
            )}
          </div>
        </div>
      )}

      <a href="/prospecting/new" className="text-brand text-sm font-semibold">
        ← กลับไปสร้าง Search Job ใหม่
      </a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line-soft last:border-0 py-1.5">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium">{value || "-"}</span>
    </div>
  );
}
