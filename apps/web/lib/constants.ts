// Order matches docs/03-Functional-Requirements.md FR-1.1 — priority markets first
export const COUNTRIES = [
  { code: "TW", name: "ไต้หวัน", nameEn: "Taiwan" },
  { code: "KR", name: "เกาหลีใต้", nameEn: "South Korea" },
  { code: "AE", name: "UAE", nameEn: "United Arab Emirates" },
  { code: "US", name: "USA", nameEn: "United States" },
  { code: "AU", name: "ออสเตรเลีย", nameEn: "Australia" },
  { code: "CN", name: "จีน", nameEn: "China" },
  { code: "JP", name: "ญี่ปุ่น", nameEn: "Japan" },
  { code: "TH", name: "ไทย", nameEn: "Thailand" },
  { code: "CA", name: "Canada", nameEn: "Canada" },
  { code: "NZ", name: "New Zealand", nameEn: "New Zealand" },
  { code: "SG", name: "Singapore", nameEn: "Singapore" },
  { code: "MY", name: "Malaysia", nameEn: "Malaysia" },
  { code: "GB", name: "UK", nameEn: "United Kingdom" },
  { code: "DE", name: "Germany", nameEn: "Germany" },
  { code: "FR", name: "France", nameEn: "France" },
  { code: "IT", name: "Italy", nameEn: "Italy" },
  { code: "NL", name: "Netherlands", nameEn: "Netherlands" },
  { code: "VN", name: "Vietnam", nameEn: "Vietnam" },
] as const;

// Matches FR-1.2
export const BUSINESS_TYPES = [
  "โรงงาน/ผู้ผลิต",
  "ผู้ส่งออก",
  "ผู้นำเข้า",
  "Trading",
  "SME",
  "E-commerce",
] as const;

// English search terms used by the Prospecting Agent when querying Google Search
export const BUSINESS_TYPE_SEARCH_TERMS: Record<string, string> = {
  "โรงงาน/ผู้ผลิต": "factory manufacturer",
  "ผู้ส่งออก": "exporter",
  "ผู้นำเข้า": "importer",
  Trading: "trading company",
  SME: "SME business",
  "E-commerce": "e-commerce",
};

// Ordered by general knowledge of Thailand's most common SME/handmade export product
// categories — not pulled from a live official trade-statistics feed, so treat the exact
// ranking as an estimate rather than authoritative data.
export const PRODUCT_CATEGORIES = [
  { code: "clothing", name: "เสื้อผ้าและแฟชั่น", nameEn: "clothing apparel fashion" },
  { code: "jewelry", name: "อัญมณีและเครื่องประดับ", nameEn: "gems jewelry accessories" },
  {
    code: "rubber",
    name: "ผลิตภัณฑ์ยางพารา (หมอน/ที่นอนยาง)",
    nameEn: "latex rubber pillow mattress",
  },
  { code: "food", name: "อาหารและเครื่องปรุงไทย", nameEn: "Thai food snacks seasoning" },
  {
    code: "sporting_goods",
    name: "อุปกรณ์กีฬา/มวยไทย",
    nameEn: "Muay Thai boxing gear sporting goods",
  },
  {
    code: "home_decor",
    name: "ของตกแต่งบ้าน/งานฝีมือแฮนด์เมด",
    nameEn: "handmade home decor crafts",
  },
  {
    code: "cosmetics",
    name: "เครื่องสำอางและสมุนไพรไทย",
    nameEn: "cosmetics Thai herbal beauty products",
  },
  { code: "household", name: "ของใช้ในครัวเรือนทั่วไป", nameEn: "household goods items" },
  { code: "footwear_bags", name: "รองเท้าและกระเป๋า", nameEn: "footwear shoes bags" },
  { code: "spa_wellness", name: "ผลิตภัณฑ์สปาและความงาม", nameEn: "spa wellness products" },
] as const;

// Each logistics service targets a different shipment profile (B2C parcel vs B2B bulk cargo).
// Keyed by the exact service name strings stored in business_units.services (see
// packages/db/migrations/0003_seed.sql) — must match exactly for lookups to succeed.
// Search targets real company websites only (see EXCLUDED_DOMAINS) — no marketplace/social
// site: filters — so these profiles only carry keywords and optional B2B directory sites.
export const SERVICE_SEARCH_PROFILES: Record<
  string,
  {
    keywordsEn: string;
    directorySites: string[];
  }
> = {
  "International Express": {
    keywordsEn:
      "online shop worldwide shipping international shipping ships worldwide handmade fashion beauty shoes bags gift official website",
    directorySites: [],
  },
  Fulfillment: {
    keywordsEn:
      "online store D2C brand official website worldwide shipping international orders daily orders e-commerce brand",
    directorySites: [],
  },
  "Air Cargo": {
    keywordsEn:
      "factory OEM ODM manufacturer exporter trading wholesale B2B sample shipment high value goods fast shipping",
    directorySites: ["datawarehouse.dbd.go.th", "thaitrade.com", "exporthub.com", "europages.com"],
  },
  "Sea Freight": {
    keywordsEn:
      "factory exporter container FCL LCL furniture rubber food machinery building material wood steel heavy cargo B2B bulk order",
    directorySites: ["datawarehouse.dbd.go.th", "thaitrade.com", "exporthub.com", "europages.com"],
  },
  "Customs Clearance": {
    keywordsEn: "factory exporter manufacturer trading company import export B2B international trade",
    directorySites: ["datawarehouse.dbd.go.th", "thaitrade.com", "exporthub.com", "europages.com"],
  },
};

// AI must find real standalone company websites only — marketplace listing pages and social
// "shop" pages are excluded outright (a company's own domain is what gets crawled for Shipping/
// About/Wholesale page content; a marketplace listing page has none of that).
export const EXCLUDED_DOMAINS = [
  "amazon.",
  "shopee.",
  "lazada.",
  "temu.",
  "ebay.",
  "alibaba.",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "linkedin.com",
];
