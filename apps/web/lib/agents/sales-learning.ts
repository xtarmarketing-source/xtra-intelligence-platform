import { createSupabaseServerClient } from "@/lib/supabase-server";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const MIN_DEALS_THRESHOLD = 5;

type InsightResult = {
  insight_type: "win_pattern" | "loss_pattern" | "market_response";
  insight_text: string;
  confidence_score: number;
  supporting_deal_count: number;
};

export async function generateSalesInsights(organizationId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: deals } = await supabase
    .from("deals")
    .select(
      "id, service_type, stage, value_estimate, outcome_reason_category, outcome_reason_detail, lost_to_competitor_id"
    )
    .eq("organization_id", organizationId)
    .in("stage", ["won", "lost"]);

  const closedDeals = deals ?? [];

  if (closedDeals.length < MIN_DEALS_THRESHOLD) {
    return {
      generated: false as const,
      dealCount: closedDeals.length,
      threshold: MIN_DEALS_THRESHOLD,
    };
  }

  const competitorIds = closedDeals
    .map((d) => d.lost_to_competitor_id)
    .filter((v): v is string => !!v);
  const { data: competitors } =
    competitorIds.length > 0
      ? await supabase.from("competitors").select("id, name").in("id", competitorIds)
      : { data: [] };
  const competitorNameById = new Map((competitors ?? []).map((c) => [c.id, c.name]));

  const dealsText = closedDeals
    .map((d) => {
      const competitorName = d.lost_to_competitor_id
        ? competitorNameById.get(d.lost_to_competitor_id) ?? "ไม่ทราบชื่อ"
        : null;
      return `- ผลลัพธ์: ${d.stage === "won" ? "ชนะ" : "แพ้"} | บริการ: ${d.service_type} | มูลค่า: ${
        d.value_estimate ?? "ไม่ระบุ"
      } | เหตุผล: ${d.outcome_reason_category ?? "ไม่ระบุ"}${
        d.outcome_reason_detail ? ` (${d.outcome_reason_detail})` : ""
      }${competitorName ? ` | แพ้ให้: ${competitorName}` : ""}`;
    })
    .join("\n");

  const prompt = `คุณคือ AI Sales Learning Analyst ให้กับบริษัทโลจิสติกส์ระหว่างประเทศ RNP Express และ PUKA Logistic

วิเคราะห์ดีลที่ปิดแล้ว (ชนะ/แพ้) ต่อไปนี้ เพื่อหารูปแบบ (pattern) ที่เกิดขึ้นซ้ำๆ โดยอิงจากข้อมูลจริงเท่านั้น ห้ามสมมติ

ดีลที่ปิดแล้วทั้งหมด (${closedDeals.length} รายการ):
${dealsText}

หาข้อมูลเชิงลึกได้สูงสุด 3 ข้อ แบ่งเป็นประเภท:
- win_pattern: รูปแบบที่ทำให้ชนะดีล
- loss_pattern: รูปแบบที่ทำให้แพ้ดีล
- market_response: แนวโน้มตลาดโดยรวม

สำหรับแต่ละข้อมูลเชิงลึก ต้องระบุจำนวนดีลที่สนับสนุน (supporting_deal_count) ตามจริง ถ้าจำนวนดีลที่สนับสนุนน้อยเกินไป (น้อยกว่า 3 ดีล) ให้ลด confidence_score ลงอย่างเหมาะสม ถ้าไม่มีรูปแบบที่ชัดเจนพอ ให้คืนค่า array ว่าง

ตอบกลับเป็น JSON array เท่านั้น (ห้ามมีข้อความอื่น):
[
  {
    "insight_type": "win_pattern" | "loss_pattern" | "market_response",
    "insight_text": "คำอธิบาย insight สั้นๆ กระชับ",
    "confidence_score": <0-100>,
    "supporting_deal_count": <จำนวนเต็ม>
  }
]`;

  const res = await fetch(ANTHROPIC_ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1536,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const rawText = data.content?.[0]?.text ?? "";
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("ไม่สามารถแปลผลลัพธ์จาก AI เป็น JSON ได้");

  const insights: InsightResult[] = JSON.parse(jsonMatch[0]);

  if (insights.length === 0) {
    return { generated: true as const, dealCount: closedDeals.length, insightCount: 0 };
  }

  const rows = insights.map((insight) => ({
    organization_id: organizationId,
    scope_type: "organization",
    scope_key: {},
    insight_type: insight.insight_type,
    insight_text: insight.insight_text,
    supporting_deal_count: insight.supporting_deal_count,
    confidence_score: insight.confidence_score,
  }));

  const { error } = await supabase.from("sales_insights").insert(rows);
  if (error) throw new Error(`บันทึก insight ไม่สำเร็จ: ${error.message}`);

  return { generated: true as const, dealCount: closedDeals.length, insightCount: rows.length };
}
