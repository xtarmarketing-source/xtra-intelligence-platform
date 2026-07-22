const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

type KnownCompany = {
  name: string;
  website: string | null;
  province: string | null;
  has_facebook: boolean | null;
  has_instagram: boolean | null;
  export_markets: string[];
  confidence: "low" | "medium" | "high";
};

// Asks Claude directly, from its own training knowledge, for well-known Thai companies in a
// product category — no web search involved. Useful for surfacing established market-leading
// brands (e.g. Twins Special, Fairtex for Muay Thai gear) that generic web search buries under
// marketplace listing noise. Deliberately conservative: the model is instructed to return null
// for any detail it isn't confident about rather than inventing one.
export async function suggestKnownCompanies(
  productNameTh: string,
  productNameEn: string,
  tradeDirection: string
): Promise<KnownCompany[]> {
  const directionText =
    tradeDirection === "export" ? "ส่งออกขายต่างประเทศ" : "นำเข้าสินค้าจากต่างประเทศ";

  const prompt = `คุณคือผู้เชี่ยวชาญด้านตลาดสินค้าไทย

จากความรู้ที่คุณมีอยู่แล้ว (ไม่ต้องค้นหาเว็บ) ให้ระบุบริษัท/แบรนด์ไทยที่มีชื่อเสียงจริงและเป็นที่รู้จักในวงการ ที่ทำธุรกิจเกี่ยวกับ "${productNameTh}" (${productNameEn}) และ${directionText}

กฎสำคัญ:
- ระบุเฉพาะบริษัทที่คุณมั่นใจว่ามีอยู่จริงเท่านั้น (แบรนด์ระดับประเทศหรือนานาชาติที่เป็นที่รู้จัก)
- ห้ามสร้างบริษัทสมมติขึ้นมาโดยเด็ดขาด ถ้านึกไม่ออกจริงๆ ให้คืนค่า array ว่าง
- ถ้าไม่แน่ใจรายละเอียดใด (เว็บไซต์, จังหวัด, โซเชียลมีเดีย, ตลาดส่งออก) ให้ใส่ null แทนการเดา
- จำกัดไม่เกิน 8 บริษัท เรียงจากที่มั่นใจมากที่สุดก่อน

ตอบเป็น JSON array เท่านั้น (ห้ามมีข้อความอื่น):
[
  {
    "name": "ชื่อบริษัท",
    "website": "URL หรือ null",
    "province": "จังหวัดหรือ null",
    "has_facebook": true/false/null,
    "has_instagram": true/false/null,
    "export_markets": ["ประเทศที่ทราบว่าส่งออกไป"],
    "confidence": "low" | "medium" | "high"
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
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]) as KnownCompany[];
  } catch {
    return [];
  }
}
