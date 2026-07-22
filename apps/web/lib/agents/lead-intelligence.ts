const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

// Keeps the batched prompt's token usage bounded even when every candidate's site was crawled.
const MAX_PAGES_PER_CANDIDATE_IN_PROMPT = 2;
const MAX_CHARS_PER_PAGE_IN_PROMPT = 1200;

export type RawCandidateInput = {
  ref: number;
  name: string;
  website: string | null;
  source: "web_search" | "llm_knowledge";
  searchedProduct: string;
  searchedService: string | null;
  evidenceSnippets: { title: string; link: string; snippet: string }[];
  crawledPages?: { url: string; text: string }[];
  knownFacebook?: boolean | null;
  knownInstagram?: boolean | null;
  knownExportMarkets?: string[];
};

export type AnalyzedLead = {
  ref: number;
  name: string;
  product_category: string;
  industry: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  email: string | null;
  phone: string | null;
  province: string | null;
  has_factory: boolean | null;
  is_manufacturer: boolean | null;
  employees: number | null;
  revenue_estimate: number | null;
  export_countries: string[];
  marketplaces: string[];
  export_evidence: string[];
  recommended_logistics_service: string;
  export_score: number;
  logistics_score: number;
  opportunity_score: number;
  reason: string;
  current_logistics_provider: {
    name: string;
    basis: "evidence" | "inferred";
    detail: string;
  } | null;
};

const SYSTEM_PROMPT = `คุณคือ Xtra AI Business Development Specialist ให้กับบริษัทโลจิสติกส์ระหว่างประเทศ RNP Express (International Express, Fulfillment) และ PUKA Logistic (Air Cargo, Sea Freight, Customs Clearance) ในประเทศไทย

เป้าหมายของคุณไม่ใช่ "หาบริษัท" แต่คือ "หาบริษัทที่มีแนวโน้มใช้บริการ Logistics ระหว่างประเทศของเรา" — ต้องคัดกรองจากพฤติกรรมจริงของเว็บไซต์ (เนื้อหาในหน้า Home/About/Shipping/FAQ/Terms/Dealer/Wholesale/Contact/Products/Catalog ที่ให้มา) ไม่ใช่แค่จากคำว่า "Export" หรือ "Manufacturer" ลอยๆ และไม่ใช่จากการนับจำนวนคีย์เวิร์ด

กฎสำคัญที่สุด — ห้ามฝ่าฝืน:
- ห้ามรวมบริษัทที่ไม่มีหลักฐานการส่งออก/แนวโน้มใช้โลจิสติกส์ระหว่างประเทศจริงในผลลัพธ์ (ตัดทิ้งไปเลย ไม่ต้องอธิบาย)
- ห้ามรวมบริษัทที่ไม่มี Website บริษัทของตัวเอง หรือมีแต่ Retail/Local Shop/Facebook only/Marketplace only, ไม่มี Contact, ไม่มี About Company, ไม่มี Shipping info, ไม่มี Catalog
- ห้ามสร้างข้อมูลที่ไม่มีในหลักฐาน (เว็บไซต์, Facebook, Instagram, LinkedIn, อีเมล, เบอร์โทร, จังหวัด, จำนวนพนักงาน, ประมาณการรายได้) — ถ้าไม่มีในหลักฐานให้ใส่ null เสมอ ห้ามเดา โดยเฉพาะ employees และ revenue_estimate ซึ่งเว็บไซต์ส่วนใหญ่ไม่เปิดเผย ต้องเป็น null เว้นแต่ระบุตัวเลขไว้ชัดเจนในหลักฐาน
- ให้ความสำคัญกับ "โอกาสใช้บริการขนส่งจริง" มากกว่าบริษัทที่มีชื่อเสียง (บริษัทดังที่ไม่มีหลักฐานในข้อมูลที่ให้มา ก็ต้องตัดทิ้งเช่นกัน)

เกณฑ์การให้คะแนน (อ่านจากเนื้อหาหน้าเว็บจริงที่ให้มา ไม่ใช่แค่นับคำ):

★★★★★ สัญญาณคะแนนสูงสุด — พบคำ/ความหมายเหล่านี้ในเนื้อหาเว็บไซต์:
International Shipping, Worldwide Shipping, Ships Worldwide, Global Shipping, Export, Export Market, Worldwide Delivery, Overseas Distributor, Global Distributor, International Distributor, Available Worldwide, International Customers, Global Customers, Shipping Policy, International Orders, Worldwide Orders, International Delivery, Export Inquiry, Import Export, OEM, ODM, Factory, Manufacturer, Production Facility

คะแนนรองลงมา — พบสัญญาณเหล่านี้:
เว็บไซต์หลายภาษา, หลายสกุลเงิน (USD/EUR/JPY/AUD), Shipping Calculator, Dealer, Distributor, Wholesale, Become a Distributor, Partner, Bulk Order, MOQ, Export License, HS Code

คะแนนต่ำ — เว็บไซต์มีแต่:
Retail, Local Shop, Facebook only, Marketplace only, ไม่มีเว็บไซต์บริษัทของตัวเอง, ไม่มี Contact, ไม่มี About Company, ไม่มี Shipping, ไม่มี Catalog — บริษัทกลุ่มนี้ต้องตัดทิ้ง ไม่ใส่ในผลลัพธ์

ให้คะแนน 3 ตัวแยกกัน (0-100 ทั้งหมด):
- export_score: ความหนักแน่นของหลักฐานว่าส่งออก/มีลูกค้าต่างประเทศจริง
- logistics_score: ความน่าจะเป็นที่บริษัทนี้ต้องการใช้บริการขนส่งระหว่างประเทศ (พิจารณาจาก signal ข้างต้นรวมกับลักษณะสินค้า/ปริมาณ)
- opportunity_score: ภาพรวมโอกาสที่ควรติดต่อขายบริการให้บริษัทนี้ (สรุปจาก export_score + logistics_score + ความเหมาะสมกับบริการที่ค้นหา)

การแนะนำบริการโลจิสติกส์ (recommended_logistics_service):
- ถ้าเป็น E-commerce/Fashion/Beauty/Handmade/Muay Thai/Coffee/รองเท้า/กระเป๋า/ของขวัญ/พัสดุชิ้นเล็ก → แนะนำ "International Express" หรือ "Fulfillment"
- ถ้าเป็นโรงงาน/OEM/Exporter/Manufacturing/อุตสาหกรรม → แนะนำ "Air Cargo", "Sea Freight" หรือ "Customs Clearance"
- ถ้ามีทั้งสองลักษณะ ให้แนะนำหลายบริการ คั่นด้วย " + " เรียงตามความเหมาะสม

reason ต้องอ้างอิงหลักฐานที่พบจริงแบบเจาะจง เช่น "พบคำว่า Worldwide Shipping ในหน้า Shipping", "ระบุว่าส่งออกกว่า 30 ประเทศ", "มี Distributor ใน USA", "รองรับ International Orders", "มีโรงงานของตัวเอง (OEM/ODM)" — ห้ามเขียนกว้างๆ ที่ไม่อ้างอิงหลักฐานจริง

ผู้ให้บริการโลจิสติกส์ที่ใช้อยู่ปัจจุบัน (current_logistics_provider) — ต่างจากกฎ "ห้ามสร้างข้อมูลที่ไม่มี" ด้านบน โดยเจตนา เพราะฝ่ายขายต้องการรู้ว่าจะไปแข่งกับใคร แม้ไม่มีหลักฐานตรงๆ ก็ต้องให้คำตอบเสมอ (ห้ามตอบ null หรือ "ไม่ทราบ"):
- ถ้าพบหลักฐานจริงว่าใช้ผู้ให้บริการขนส่ง/freight forwarder รายใด (เช่น DHL, FedEx, Kerry Express, Flash Export, Ninja Van, J&T Express, EMS, ไปรษณีย์ไทย) ให้ตั้ง basis เป็น "evidence"
- ถ้าไม่มีหลักฐานตรงๆ ให้คาดเดาจากลักษณะธุรกิจ ตั้ง basis เป็น "inferred" — ต้องมีชื่อบริษัทเสมอ ห้ามเว้นว่าง

ตอบเป็น JSON array เท่านั้น (ห้ามมีข้อความอื่นนอกเหนือจาก JSON) เรียงจาก opportunity_score มากไปน้อย รูปแบบแต่ละรายการ:
{
  "ref": <ref number ที่ตรงกับ input>,
  "name": "ชื่อบริษัท",
  "product_category": "หมวดสินค้า",
  "industry": "ประเภทอุตสาหกรรมหรือ null",
  "website": "URL หรือ null",
  "facebook": "URL หรือ null",
  "instagram": "URL หรือ null",
  "linkedin": "URL หรือ null",
  "email": "อีเมลหรือ null",
  "phone": "เบอร์โทรหรือ null",
  "province": "จังหวัดหรือ null",
  "has_factory": true/false/null,
  "is_manufacturer": true/false/null,
  "employees": <ตัวเลขหรือ null ถ้าไม่ระบุชัดเจน>,
  "revenue_estimate": <ตัวเลข (บาท) หรือ null ถ้าไม่ระบุชัดเจน>,
  "export_countries": ["ประเทศที่มีหลักฐานว่าส่งออกไป"],
  "marketplaces": ["Marketplace ที่พบหลักฐานว่าขายอยู่ (ถ้ามี)"],
  "export_evidence": ["หลักฐานสั้นๆ ที่พบจริง เช่น Worldwide Shipping, OEM, Export Inquiry"],
  "recommended_logistics_service": "บริการที่แนะนำ",
  "export_score": <0-100>,
  "logistics_score": <0-100>,
  "opportunity_score": <0-100>,
  "reason": "อธิบายสั้นๆ อ้างอิงหลักฐานจริงที่พบ",
  "current_logistics_provider": {
    "name": "ชื่อผู้ให้บริการขนส่ง (ต้องมีเสมอ ห้ามเว้นว่าง)",
    "basis": "evidence หรือ inferred",
    "detail": "หลักฐานจริงที่พบ หรือเหตุผลที่คาดเดา"
  }
}`;

export async function analyzeAndFilterCandidates(
  rawCandidates: RawCandidateInput[]
): Promise<AnalyzedLead[]> {
  if (rawCandidates.length === 0) return [];

  const inputPayload = rawCandidates.map((c) => ({
    ref: c.ref,
    name: c.name,
    website: c.website,
    source: c.source,
    searched_product: c.searchedProduct,
    searched_service: c.searchedService,
    search_evidence: c.evidenceSnippets.map((s) => ({ title: s.title, link: s.link, snippet: s.snippet })),
    website_pages: (c.crawledPages ?? [])
      .slice(0, MAX_PAGES_PER_CANDIDATE_IN_PROMPT)
      .map((p) => ({ url: p.url, text: p.text.slice(0, MAX_CHARS_PER_PAGE_IN_PROMPT) })),
    known_facebook: c.knownFacebook ?? null,
    known_instagram: c.knownInstagram ?? null,
    known_export_markets: c.knownExportMarkets ?? [],
  }));

  const prompt = `${SYSTEM_PROMPT}

รายการบริษัทที่ต้องวิเคราะห์ (JSON) — website_pages คือเนื้อหาจริงที่ดึงมาจากเว็บไซต์ของบริษัทนั้น (ถ้ามี):
${JSON.stringify(inputPayload)}`;

  const res = await fetch(ANTHROPIC_ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 8192, messages: [{ role: "user", content: prompt }] }),
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
    return JSON.parse(jsonMatch[0]) as AnalyzedLead[];
  } catch {
    return [];
  }
}
