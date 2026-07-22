import { createSupabaseServerClient } from "@/lib/supabase-server";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

type ScoreResult = {
  opportunity_score: number;
  difficulty_score: number;
  revenue_potential: number;
  competition_level: number;
  confidence: "low" | "medium" | "high";
  evidence: string[];
  reasoning: string;
};

export async function scoreLead(leadId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: lead } = await supabase
    .from("candidate_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) throw new Error("ไม่พบ Lead");

  const sources = (lead.sources ?? []) as { title?: string; link?: string; snippet?: string }[];
  const sourceText = sources
    .map((s) => `- ${s.title ?? ""}: ${s.snippet ?? ""} (${s.link ?? ""})`)
    .join("\n");

  const prompt = `คุณคือ AI Sales Analyst ให้กับบริษัทโลจิสติกส์ระหว่างประเทศ RNP Express (International Express, Fulfillment) และ PUKA Logistic (Air Cargo, Sea Freight, Customs Clearance) ในประเทศไทย

งานของคุณ: ประเมินว่าบริษัทต่อไปนี้มีโอกาสเป็นลูกค้าที่ดีสำหรับบริการโลจิสติกส์ระหว่างประเทศหรือไม่ โดยอิงจากข้อมูลที่มีให้เท่านั้น ห้ามสมมติข้อมูลที่ไม่มี

ชื่อบริษัท/แหล่งข้อมูล: ${lead.name}
ประเทศ: ${lead.country ?? "ไม่ทราบ"}
ประเภทธุรกิจ: ${lead.business_type ?? "ไม่ทราบ"}
เว็บไซต์: ${lead.website ?? "ไม่มี"}

ข้อมูลจากการค้นหา:
${sourceText || "ไม่มีข้อมูลเพิ่มเติม"}

สำคัญ: ถ้าข้อมูลที่มีเป็นเพียงหน้ารวมรายชื่อ (directory/listing page) ไม่ใช่ข้อมูลบริษัทเดี่ยวๆ โดยตรง ให้ตั้งค่า confidence เป็น "low" และให้คะแนนอย่างระมัดระวัง อย่าแต่งข้อมูลที่ไม่มีในแหล่งข้อมูล

ตอบกลับเป็น JSON เท่านั้น ตามรูปแบบนี้ (ห้ามมีข้อความอื่นนอกเหนือจาก JSON):
{
  "opportunity_score": <0-100>,
  "difficulty_score": <0-100>,
  "revenue_potential": <0-100>,
  "competition_level": <0-100>,
  "confidence": "low" | "medium" | "high",
  "evidence": ["หลักฐานสั้นๆ ที่ดึงมาจากข้อมูลจริงเท่านั้น", ...],
  "reasoning": "คำอธิบายสั้นๆ ว่าทำไมถึงให้คะแนนนี้"
}`;

  const res = await fetch(ANTHROPIC_ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  const rawText = data.content?.[0]?.text ?? "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("ไม่สามารถแปลผลลัพธ์จาก AI เป็น JSON ได้");

  const result: ScoreResult = JSON.parse(jsonMatch[0]);

  const { error } = await supabase.from("lead_scores").insert({
    subject_type: "candidate_lead",
    subject_id: leadId,
    opportunity_score: result.opportunity_score,
    difficulty_score: result.difficulty_score,
    revenue_potential: result.revenue_potential,
    competition_level: result.competition_level,
    evidence: result.evidence,
    reasoning: { confidence: result.confidence, summary: result.reasoning },
    model_version: MODEL,
  });

  if (error) throw new Error(`บันทึกคะแนนไม่สำเร็จ: ${error.message}`);
}
