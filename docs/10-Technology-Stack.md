# Technology Stack
**เวอร์ชัน:** 1.1 — เลือกโดยยึด 4 เงื่อนไข: ทีม 1-2 คน, งบ 3,000-10,000 บาท/เดือน, ต้องเร็ว, ต้องขยายเป็น SaaS ได้โดยไม่ rewrite

---

## 1. สรุป Stack

| Layer | เทคโนโลยี | เหตุผล |
|---|---|---|
| Frontend | **Next.js (React) + TypeScript + Tailwind CSS + shadcn/ui** | Full-stack framework เดียวจบ ลด context switching สำหรับทีมเล็ก, component สำเร็จรูปคุณภาพสูงลดเวลาทำ UI |
| Backend | **Next.js API Routes / Server Actions** | ไม่ต้องแยก service ตั้งแต่วันแรก ลดความซับซ้อนของ MVP; แยกออกเป็น service อิสระได้ภายหลังเมื่อ scale ต้องการ |
| Database | **PostgreSQL ผ่าน Supabase** | Relational เหมาะกับ CRM, Row-Level Security ในตัว (กลไกเดียวกับที่ multi-tenant SaaS ต้องใช้), มี Auth+Storage+Realtime มาพร้อมกัน ลดจำนวน vendor ที่ต้องบริหาร |
| Auth | **Supabase Auth** | Email/password พร้อม role-based session, ขยายเป็น SSO ได้ภายหลัง |
| File Storage | **Supabase Storage** | เอกสาร/รูปภาพบริษัท ผูก RLS เดียวกับ database |
| Background Jobs | **Supabase Edge Functions / Vercel Cron** | รองรับงาน async (Search Job, Brief generation) โดยไม่ต้องมี worker server แยกใน MVP |
| AI/LLM | **Claude API (Claude Sonnet/Haiku ตามงาน)** | Sonnet สำหรับ Scoring/Brief ที่ต้องเหตุผลซับซ้อน, Haiku สำหรับงานเบา (normalize ข้อมูล) เพื่อคุมต้นทุน |
| External Data APIs | Google Custom Search API, Google Maps Places API, DBD (กรมพัฒนาธุรกิจการค้า) | ตามที่ระบุใน AI Agent Architecture |
| Hosting | **Vercel** (Frontend+API) + **Supabase Cloud** (Data) | Managed ทั้งคู่ มี free/starter tier เพียงพอสำหรับ MVP, deploy จาก git ได้ทันที ไม่ต้องมี DevOps แยก |
| Import | Google Sheets API, SheetJS (xlsx parsing) | ตรงตาม FR-11 |

## 2. เหตุผลเชิงเปรียบเทียบ (ทำไมไม่เลือกทางอื่น)

| ทางเลือก | ทำไมไม่เลือกใน MVP |
|---|---|
| Microservices แยก Backend เป็น NestJS/Go ตั้งแต่ต้น | เกินความจำเป็นสำหรับทีม 1-2 คนและ traffic ระดับ MVP เพิ่ม overhead การ deploy/maintain โดยไม่ได้ประโยชน์ทันที |
| Self-hosted Postgres บน VPS/Docker | ต้องมีคนดูแล backup/patch/scaling เอง ไม่คุ้มกับทีมขนาดนี้ ย้ายออกจาก Supabase ทำได้ทุกเมื่อเพราะเป็น Postgres มาตรฐาน |
| Firebase/NoSQL | ข้อมูล CRM เป็นเชิงสัมพันธ์สูง (Company-Deal-Activity-Contact) การ query/report เชิงธุรกิจ (Dashboard, Forecast) ทำได้ยากกว่าบน NoSQL |
| Heavy Agent Framework (LangChain/AutoGPT-style) | เพิ่มความซับซ้อนและจุดที่ debug ยากโดยไม่จำเป็น — งานจริงคือ 3 workflow ที่ชัดเจน (ดู AI Agent Architecture) เขียนตรงด้วย function เรียก LLM API ควบคุมง่ายกว่า |
| ตัวรวมข้อมูล (Enrichment) ต่างประเทศ เช่น ZoomInfo/Clearbit | ราคาสูงเกินงบ และไม่ครอบคลุมฐาน SME ไทย/DBD ซึ่งเป็นแหล่งข้อมูลสำคัญที่สุดของตลาดนี้ |

## 3. ประมาณการต้นทุนต่อเดือน (MVP, หลังเพิ่ม 5 Agents)

*ปรับจากประมาณการเดิม (v1.0) เนื่องจากตอนนี้ระบบมี 5 AI Agents (Prospecting, Scoring, Brief, Market Intelligence, Sales Learning) และฟีเจอร์ Export/Competitor Dashboard/Country Intelligence เพิ่มเข้ามา — เรียก LLM/API มากขึ้นกว่าประมาณการรอบแรก*

| รายการ | ประมาณการ (บาท/เดือน) |
|---|---|
| Vercel (Hobby → Pro เมื่อจำเป็น) | 0 - 700 |
| Supabase (Free → Pro tier) | 0 - 900 |
| Claude API (Scoring + Brief + Market Intelligence + Competitor Intelligence + Sales Learning) | 1,000 - 4,500 |
| Google Search API / Maps API / DBD | 300 - 1,200 |
| Domain + เบ็ดเตล็ด | ~50 |
| **รวมโดยประมาณ** | **~1,350 - 7,350 บาท/เดือน** (ยังอยู่ในงบ 3,000-10,000 ที่ตั้งไว้ แต่เหลือช่องว่างน้อยลงกว่าประมาณการแรก) |

*ตัวเลขจริงขึ้นกับปริมาณ Search Job ต่อเดือน และจำนวนครั้งที่ Refresh Brief/Competitor Intelligence — มี usage log + Free Trial Quota (FR-1.7) และ Admin Usage Dashboard เพื่อติดตามและปรับ cap ได้ทันทีตามที่เกิดขึ้นจริง ไม่ใช่แค่ประมาณการ*

## 3B. Timeline & Total Project Cost Summary

### Timeline

| ช่วงงาน | ระยะเวลา | สถานะ |
|---|---|---|
| **Design (เอกสารทั้งหมด 14 ฉบับ)** | — | ✅ เสร็จแล้ว (ผ่าน session ออกแบบนี้ รวม 4 รอบ feedback) |
| Phase 1A: MVP Core (dev) | 6-7 สัปดาห์ | ยังไม่เริ่ม |
| Phase 1B: MVP+ Fast-follow (dev) | 5-6 สัปดาห์ | ยังไม่เริ่ม |
| **รวมช่วง Dev ทั้งหมด** | **11-13 สัปดาห์ (~2.5-3 เดือน)** | ทีม 1-2 คน |
| Phase 2: Baseline & Calibration | 4 สัปดาห์ | ใช้งานจริง + เก็บข้อมูลเทียบผล ไม่ใช่ dev เพิ่ม |
| **รวมตั้งแต่เริ่ม Dev ถึงพร้อมประเมิน ROI** | **~15-17 สัปดาห์ (~3.5-4 เดือน)** | |

### ต้นทุนรวม — 2 สถานการณ์ (เนื่องจากยังไม่ยืนยันว่าทีมพัฒนาเป็นพนักงานประจำหรือจ้างเพิ่ม)

**สถานการณ์ A: ใช้พนักงานประจำที่มีอยู่แล้ว (ไม่มีต้นทุนค่าแรงงานเพิ่ม)**

| รายการ | ประมาณการ |
|---|---|
| ค่าแรงงาน | ฿0 (ไม่นับ opportunity cost ของเวลาพนักงาน) |
| Infra/API ช่วง Dev (~3 เดือน) | ~4,000 - 22,000 บาท (1,350-7,350 × 3) |
| Infra/API หลัง Launch (ต่อเดือน) | ~1,350 - 7,350 บาท/เดือน |
| **รวมเงินสดจริงช่วง Build** | **~4,000 - 22,000 บาท** |

**สถานการณ์ B: จ้าง Freelance/Contractor เพิ่ม**

*สมมติฐาน (ต้อง verify กับใบเสนอราคาจริงอีกครั้ง): Freelance full-stack developer ระดับ mid-senior ที่ทำงานกับ AI integration ได้ ในตลาดไทยปัจจุบันอยู่ที่ประมาณ 60,000-100,000 บาท/เดือน/คน*

| จำนวนคน | ระยะเวลา | ค่าแรงงานโดยประมาณ |
|---|---|---|
| 1 คน (ทำทั้ง Core+MVP+ คนเดียว ใช้เวลาเต็ม 11-13 สัปดาห์) | ~2.5-3 เดือน | 150,000 - 300,000 บาท |
| 2 คน (แบ่งงานคู่ขนาน อาจเสร็จเร็วขึ้นเล็กน้อย) | ~2.5-3 เดือน | 300,000 - 600,000 บาท |

| รายการ | ประมาณการ |
|---|---|
| ค่าแรงงาน (1-2 คน) | 150,000 - 600,000 บาท |
| Infra/API ช่วง Dev (~3 เดือน) | ~4,000 - 22,000 บาท |
| **รวมโดยประมาณช่วง Build** | **~154,000 - 622,000 บาท** |
| Infra/API หลัง Launch (ต่อเดือน) | ~1,350 - 7,350 บาท/เดือน (เท่าสถานการณ์ A) |

**คำแนะนำ:** ตัวเลขค่าแรงงานในสถานการณ์ B เป็น**สมมติฐานอิงตลาด ไม่ใช่ใบเสนอราคาจริง** — แนะนำให้ขอใบเสนอราคาจาก freelance/agency 2-3 รายก่อนตัดสินใจจริง เพื่อแทนที่ตัวเลขสมมติฐานนี้ด้วยตัวเลขจริง ส่วนต้นทุน Infra/API (~1,350-7,350 บาท/เดือน) เป็นตัวเลขที่มั่นใจได้มากกว่าเพราะอ้างอิงราคา public ของแต่ละบริการโดยตรง

## 4. Repository Structure (แนะนำ)

```
b2b-ai/
├── apps/
│   └── web/                 # Next.js app (frontend + API routes)
├── packages/
│   ├── db/                  # Schema, migrations (Prisma หรือ Drizzle ORM)
│   ├── ai-agents/           # Prospecting / Scoring / Brief agents + adapters
│   └── shared-types/        # Type ร่วมระหว่าง frontend/backend
└── docs/                    # เอกสารชุดนี้ทั้งหมด
```

โครงสร้าง monorepo เบาๆ นี้ทำให้แยก `ai-agents` ออกเป็น service อิสระในอนาคต (เมื่อ volume สูงขึ้นจนต้องมี dedicated worker) โดยไม่ต้อง refactor โค้ดใหม่ทั้งหมด
