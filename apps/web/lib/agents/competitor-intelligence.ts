import { createSupabaseServerClient } from "@/lib/supabase-server";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

type PredictionResult = {
  predicted_competitor_name: string | null;
  confidence_score: number;
  confidence_level: "low" | "medium" | "high";
  evidence: string[];
  why_this_prediction: string;
  competitor_strengths: string[];
  competitor_weaknesses: string[];
  recommended_strategy: string;
  recommended_service_first: string;
};

export async function analyzeCompetitor(companyId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (!company) throw new Error("ไม่พบบริษัท");

  const { data: competitors } = await supabase
    .from("competitors")
    .select("name")
    .eq("organization_id", company.organization_id)
    .eq("is_active", true);

  const competitorNames = (competitors ?? []).map((c) => c.name);
  const sources = (company.sources ?? []) as { title?: string; link?: string; snippet?: string }[];
  const sourceText = sources
    .map((s) => `- ${s.title ?? ""}: ${s.snippet ?? ""} (${s.link ?? ""})`)
    .join("\n");

  const prompt = `คุณคือ AI Competitive Intelligence Analyst ให้กับบริษัทโลจิสติกส์ระหว่างประเทศ RNP Express และ PUKA Logistic ในประเทศไทย

รายชื่อคู่แข่งที่ต้องพิจารณา: ${competitorNames.length > 0 ? competitorNames.join(", ") : "ไม่มีข้อมูลคู่แข่งในระบบ"}

งานของคุณ: จากข้อมูลบริษัทลูกค้าเป้าหมายต่อไปนี้ ให้ประเมินว่าคู่แข่งรายไหน (จากรายชื่อด้านบนเท่านั้น) น่าจะเป็นผู้ให้บริการโลจิสติกส์อยู่แล้ว หรือมีความเสี่ยงด้านการแข่งขันสูงสุด โดยอิงจากข้อมูลที่มีให้เท่านั้น ห้ามสมมติข้อมูลที่ไม่มี

ชื่อบริษัท: ${company.name}
ประเทศ: ${company.country ?? "ไม่ทราบ"}
ประเภทธุรกิจ: ${company.business_type ?? "ไม่ทราบ"}
เว็บไซต์: ${company.website ?? "ไม่มี"}

ข้อมูลจากแหล่งที่มา:
${sourceText || "ไม่มีข้อมูลเพิ่มเติม"}

สำคัญ: ถ้าไม่มีหลักฐานที่บ่งชี้ถึงคู่แข่งรายใดรายหนึ่งโดยเฉพาะ ให้ตั้งค่า predicted_competitor_name เป็น null และ confidence_level เป็น "low" ห้ามเดาสุ่ม

ตอบกลับเป็น JSON เท่านั้น ตามรูปแบบนี้ (ห้ามมีข้อความอื่นนอกเหนือจาก JSON):
{
  "predicted_competitor_name": "<ชื่อคู่แข่งจากรายชื่อที่ให้ หรือ null>",
  "confidence_score": <0-100>,
  "confidence_level": "low" | "medium" | "high",
  "evidence": ["หลักฐานสั้นๆ ที่ดึงมาจากข้อมูลจริงเท่านั้น", ...],
  "why_this_prediction": "คำอธิบายสั้นๆ ว่าทำไมถึงคาดการณ์แบบนี้",
  "competitor_strengths": ["จุดแข็งของคู่แข่งที่คาดการณ์ (ถ้ามีข้อมูล)", ...],
  "competitor_weaknesses": ["จุดอ่อนของคู่แข่งที่คาดการณ์ (ถ้ามีข้อมูล)", ...],
  "recommended_strategy": "กลยุทธ์แนะนำสำหรับทีมขายในการเข้าหาลูกค้ารายนี้",
  "recommended_service_first": "บริการที่ควรเสนอเป็นอันดับแรก"
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
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("ไม่สามารถแปลผลลัพธ์จาก AI เป็น JSON ได้");

  const result: PredictionResult = JSON.parse(jsonMatch[0]);

  let predictedCompetitorId: string | null = null;
  if (result.predicted_competitor_name) {
    const { data: match } = await supabase
      .from("competitors")
      .select("id")
      .eq("organization_id", company.organization_id)
      .ilike("name", result.predicted_competitor_name)
      .maybeSingle();
    predictedCompetitorId = match?.id ?? null;
  }

  const { error } = await supabase.from("competitor_intelligence").insert({
    company_id: companyId,
    predicted_competitor_id: predictedCompetitorId,
    confidence_score: result.confidence_score,
    confidence_level: result.confidence_level,
    evidence: result.evidence,
    why_this_prediction: result.why_this_prediction,
    competitor_strengths: result.competitor_strengths,
    competitor_weaknesses: result.competitor_weaknesses,
    recommended_strategy: result.recommended_strategy,
    recommended_service_first: result.recommended_service_first,
    model_version: MODEL,
  });

  if (error) throw new Error(`บันทึกผลวิเคราะห์คู่แข่งไม่สำเร็จ: ${error.message}`);
}
