import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { generateSalesInsightsAction } from "@/lib/actions/sales-learning";

const INSIGHT_TYPE_LABEL: Record<string, string> = {
  win_pattern: "รูปแบบที่ทำให้ชนะ",
  loss_pattern: "รูปแบบที่ทำให้แพ้",
  market_response: "แนวโน้มตลาด",
};

const INSIGHT_TYPE_STYLE: Record<string, string> = {
  win_pattern: "bg-green-50 text-green-700 border-green-200",
  loss_pattern: "bg-red-50 text-red-700 border-red-200",
  market_response: "bg-blue-50 text-blue-700 border-blue-200",
};

const MIN_DEALS_THRESHOLD = 5;

export default async function InsightsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { count: closedDealCount } = profile
    ? await supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .in("stage", ["won", "lost"])
    : { count: 0 };

  const { data: insights } = profile
    ? await supabase
        .from("sales_insights")
        .select("id, insight_type, insight_text, confidence_score, supporting_deal_count, generated_at")
        .eq("organization_id", profile.organization_id)
        .order("generated_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const hasEnoughData = (closedDealCount ?? 0) >= MIN_DEALS_THRESHOLD;

  return (
    <div className="p-8 max-w-3xl flex flex-col gap-4">
      <h1 className="text-brand text-xl font-extrabold">Sales Learning — บทเรียนจากดีลที่ปิดแล้ว</h1>
      <p className="text-ink-soft text-sm">
        ดีลที่ปิดแล้ว (ชนะ/แพ้) ทั้งหมด {closedDealCount ?? 0} รายการ — ต้องมีอย่างน้อย{" "}
        {MIN_DEALS_THRESHOLD} รายการจึงจะวิเคราะห์ได้อย่างน่าเชื่อถือ
      </p>

      <form action={generateSalesInsightsAction}>
        <button
          type="submit"
          disabled={!hasEnoughData}
          className="bg-brand hover:bg-brand-dark disabled:bg-line disabled:cursor-not-allowed text-white font-bold rounded-lg px-5 py-2.5 text-sm"
        >
          สร้าง Insight ใหม่ (Generate Insights)
        </button>
      </form>

      {!hasEnoughData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          ข้อมูลไม่เพียงพอ — ต้องมีดีลที่ปิดเป็น &quot;ปิดการขาย&quot; หรือ &quot;เสียโอกาส&quot; อย่างน้อย{" "}
          {MIN_DEALS_THRESHOLD} รายการก่อน (ตอนนี้มี {closedDealCount ?? 0} รายการ) —
          ไปที่หน้ารายละเอียดบริษัทแต่ละแห่งเพื่ออัปเดตสถานะดีลที่ปิดแล้วพร้อมระบุเหตุผล
        </div>
      )}

      <div className="flex flex-col gap-3">
        {(insights ?? []).map((insight) => (
          <div key={insight.id} className="border border-line rounded-xl p-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${INSIGHT_TYPE_STYLE[insight.insight_type] ?? ""}`}
              >
                {INSIGHT_TYPE_LABEL[insight.insight_type] ?? insight.insight_type}
              </span>
              <span className="text-ink-soft text-xs">
                ความมั่นใจ {insight.confidence_score}/100 · อ้างอิงจาก {insight.supporting_deal_count} ดีล
              </span>
            </div>
            <p>{insight.insight_text}</p>
          </div>
        ))}

        {(insights ?? []).length === 0 && (
          <p className="text-sm text-ink-soft">ยังไม่มี Insight — สร้างครั้งแรกเมื่อมีข้อมูลเพียงพอ</p>
        )}
      </div>
    </div>
  );
}
