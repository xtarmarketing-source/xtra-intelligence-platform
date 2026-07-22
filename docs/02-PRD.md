# Product Requirement Document (PRD)
**Product Name: Xtar** (เดิมเรียก "RNP Sales Intelligence" ในเอกสารรุ่นก่อน — ใช้ชื่อ Xtar ตั้งแต่นี้ไป)
**เวอร์ชัน:** 1.4

---

## 1. Product Vision

> "ไม่ได้สร้าง CRM แต่สร้างพนักงานขาย AI ที่ไม่มีวันลาออก"

ระบบที่ทำหน้าที่แทนงานที่ฝ่ายขายไม่อยากทำและทำได้ไม่ดี (หาลูกค้า, วิเคราะห์, จำข้อมูล) เพื่อให้มนุษย์ทำงานที่ AI ทำแทนไม่ได้ (สร้างความสัมพันธ์, เจรจา, ปิดการขาย) CRM เป็นเพียง "หน่วยความจำถาวรของบริษัท" ที่ AI ใช้อ่าน/เขียนร่วมกับฝ่ายขาย ไม่ใช่จุดหมายปลายทางของ product

## 2. Problem → Product Mapping

| ปัญหาจาก BRD | ฟีเจอร์ที่ตอบโจทย์ |
|---|---|
| ฝ่ายขายหาลูกค้าเอง เสียเวลา | AI Sales Intelligence (on-demand prospecting + scoring) |
| ข้อมูลกระจัดกระจาย/หายเมื่อคนลาออก | CRM กลาง + Data Ownership model |
| ผู้บริหารไม่เห็น pipeline จริง | Executive Dashboard แบบ real-time |
| ฝ่ายขายไม่รู้จะเริ่มคุยอะไรกับลูกค้าใหม่ | AI Company Brief แบบ on-demand |
| ไม่มี AI ช่วยงานขายเลย | ทั้งระบบคือ AI-augmented workflow |

## 3. Personas

### 3.1 คุณเอ — Sales Rep
เซลล์สนาม 3-5 คนที่ดูแลลูกค้าโลจิสติกส์ ต้องหาลูกค้าใหม่และดูแลลูกค้าเก่าไปพร้อมกัน ไม่ถนัดงานเอกสาร/วิเคราะห์ ต้องการเครื่องมือที่ "บอกเลยว่าต้องทำอะไรต่อ" ไม่ใช่ dashboard ที่ต้องตีความเอง

**ความต้องการหลัก:** เปิดแอป → เห็นว่าวันนี้ต้องติดต่อใคร → เปิดบริษัทนั้น → มี AI สรุปให้พร้อมคำแนะนำ → โทร/นัด → บันทึกผลไว ที่สุด

### 3.2 คุณบี — Sales Manager / ผู้บริหาร
ดูแลทีมขาย 3-5 คน ต้องอนุมัติ Lead ที่ AI หามา ต้องการเห็นภาพรวมทีมและ pipeline โดยไม่ต้องขอรายงานจากเซลล์

**ความต้องการหลัก:** เห็นตัวเลขสำคัญทันทีที่เปิดระบบ, รู้ว่า Lead ไหนกำลังจะหลุด, อนุมัติ/ปฏิเสธ Lead ที่ AI เสนอได้เร็ว

### 3.3 คุณซี — Admin
ดูแลระบบ ผู้ใช้ และการนำเข้าข้อมูล อาจเป็นคนเดียวกับผู้บริหารในช่วง MVP

## 4. Feature List (MVP v1)

**หมายเหตุ:** เดิม PRD 1.0 มี F1-F17, รอบ 2 เพิ่ม F18-F27, รอบ 3 เพิ่ม F29-F34 (Competitor Intelligence, CRM Aging Intelligence, Win/Loss Capture, Sales Learning Agent), รอบ 4 (ล่าสุด) เพิ่ม F35-F40 (Import/Export, Competitor Master, Competitor Dashboard, Country Intelligence Dashboard) — บางฟีเจอร์ implement ได้ในต้นทุนต่ำ (แค่ปรับ UI/format ของสิ่งที่ออกแบบไว้แล้ว หรือแค่เริ่ม "เก็บข้อมูล" ตั้งแต่วันแรกโดยยังไม่ต้องมี AI วิเคราะห์) จึงอยู่ใน MVP Core ทันที ส่วนที่เพิ่ม effort อย่างมีนัยสำคัญ หรือติดปัญหา **cold-start** (ต้องมีข้อมูลสะสมก่อนถึงมีประโยชน์จริง) แยกเป็น MVP+/Phase 1.5 — ดูเหตุผลการแบ่งใน [11-Development-Roadmap.md](11-Development-Roadmap.md) และ [12-MVP-Scope.md](12-MVP-Scope.md)

| ID | Feature | Persona | Priority |
|---|---|---|---|
| F1 | AI Search Wizard (ตลาด/อุตสาหกรรม/บริการ + ตัวกรองเสริม) | Sales Rep | Must |
| F2 | AI Find Customers (on-demand prospecting) | Sales Rep | Must |
| F3 | AI Company Analysis + 8 Scores + Evidence Checklist + Source Badge | Sales Rep/Manager | Must |
| F4 | Lead Result screen + View/Skip/Save/Approve + Duplicate Detection Badge | Sales Manager | Must |
| F5 | CRM Core (Company/Contact/Deal/Timeline) | Sales Rep | Must |
| F6 | AI Company Brief (on-demand) | Sales Rep | Must |
| F7 | Task/Reminder/Next Action | Sales Rep | Must |
| F8 | Quotation record (บันทึก ไม่ generate เอกสารใน MVP) | Sales Rep | Must |
| F9 | Call Log / Meeting Log | Sales Rep | Must |
| F10 | Executive Dashboard (real-time KPI/Pipeline/Forecast) | Executive | Must |
| F11 | Excel/Google Sheets Import | Admin | Must |
| F12 | Global Search (ค้นทุกอย่างในระบบ) | ทุกคน | Should |
| F13 | User & Role Management | Admin | Must |
| F14 | Audit Log | Admin | Should |
| F18 | Company Golden Record (Revenue/Employees/Factory/HS Code/Export Market ฯลฯ) | Sales Rep | Must |
| F19 | Contact People แบบมีบทบาทมาตรฐาน (Owner/Export Mgr/Sales Mgr/Procurement/Logistics) | Sales Rep | Must |
| F20 | Customer 360 (Timeline+Quotation+Email+LINE+Call+Meeting+Invoice+Shipment หน้าเดียว) | Sales Rep | Must |
| F21 | Team Assignment (มอบหมาย/self-claim Lead หรือ Deal) | Sales Manager | Must |
| F22 | AI Search History (Refresh/Continue) | Sales Rep | Should (MVP+) |
| F23 | Saved Search | Sales Rep | Should (MVP+) |
| F24 | AI Next Action (คำแนะนำพร้อมกรอบเวลา) | Sales Rep | Should (MVP+) |
| F25 | AI Recommendation — Service Sequencing | Sales Rep | Should (MVP+) |
| F26 | AI Search Wizard — ตัวกรองขั้นสูง (Employee/Revenue/Export Country/Language/Incoterm/Shipment Frequency) | Sales Rep | Should (MVP+) |
| F27 | Market Intelligence Snapshot ⭐ | Executive/Sales Manager | Should (MVP+, ประเมินหลัง Core ใช้งานจริง) |
| F28 | AI Similar Company | Sales Rep | Could (Phase 1.5 — ต้องมีข้อมูล Won deal สะสมก่อนถึงมีประโยชน์จริง) |
| F29 | Deal Stage History + Aging Data Capture (วันที่เข้า/ออก Stage, Last Activity) | ระบบ | **Must — เริ่มเก็บวันแรก** (ย้อนหลังไม่ได้ถ้าไม่เก็บตั้งแต่ต้น) |
| F30 | CRM Aging Intelligence — Dashboard/Company Detail display (Deal Age, Stage Age, At-risk, Overdue) | Executive/Sales Rep | Must |
| F31 | AI Aging Analysis (ดีลค้างผิดปกติ/ควร Escalate/มีโอกาสหลุด) | Sales Manager | Should (MVP+) |
| F32 | Win/Loss Reason Capture (dropdown มาตรฐานตอนปิดดีล) | Sales Rep | **Must — เริ่มเก็บวันแรก** |
| F33 | Competitor Intelligence (ทำนายคู่แข่งปัจจุบัน + confidence + evidence + strategy) | Sales Rep | Should (MVP+) |
| F34 | Sales Learning Agent (pattern mining จาก Win/Loss ข้าม segment) | ทุกคน | Could (Phase 1.5 — ต้องมีดีลปิดสะสม ≥5 ดีล/segment ตาม FR-18.3) |
| F35 | CSV Import + Merge/Skip/Update Existing/Create New duplicate strategies | Admin | Must |
| F36 | Competitor Master Data (CRUD + activate/deactivate, ไม่ hardcode) | Admin | **Must — unblocks F33/F32** |
| F37 | Export (Excel/CSV/Google Sheets) พร้อม filter หลายมิติ | Sales Manager/Admin | Should (MVP+) |
| F38 | Competitor Dashboard (Top/by Country/by Industry/Trend/Win-Loss) | Executive | Should (MVP+, Trend ต้องรอสะสมข้อมูลหลายเดือน) |
| F39 | Market Share ภายใน CRM + What-if Projection | Executive | Should (MVP+) |
| F40 | Country Intelligence Dashboard (metrics + drill-down + card/table/chart/heatmap) | Executive | Should (MVP+, AI Insight text ต้องรอข้อมูลพอสมควร) |
| F41 | Manual Company/Contact Entry (เพิ่มลูกค้าด้วยตนเอง + Enrich with AI) | Sales Rep | Must |
| F42 | Email Marketing List (export ระดับ Contact + consent tracking ตาม PDPA) | Sales Manager/Admin | Must |
| F15 | LINE/Facebook/Email 2-way integration | ทุกคน | Later (Phase 2) |
| F16 | LinkedIn/Alibaba/ImportYeti sources | Sales Rep | Later (Phase 2) |
| F17 | Auto-run scheduled prospecting | Sales Manager | Later (Phase 3) |

## 5. Non-Functional Requirements

| ด้าน | ข้อกำหนด |
|---|---|
| Performance | Dashboard โหลด < 2 วินาที, AI Find Customers ต่อ batch (~20-30 บริษัท) เสร็จภายใน 3-5 นาที (async, ไม่ block UI) |
| Availability | ใช้งานในเวลาทำการ 99% (Managed hosting เพียงพอ ไม่ต้องการ HA ระดับ enterprise ใน MVP) |
| Data Ownership | ข้อมูลทั้งหมดผูกกับ Organization ไม่ผูกกับ user คนใดคนหนึ่ง |
| Security | RBAC, encryption at rest/in transit, audit log การเข้าถึงข้อมูลลูกค้า |
| Localization | UI ภาษาไทยเป็นหลัก, รองรับข้อมูลภาษาอังกฤษในฟิลด์ลูกค้า (import/export) |
| Cost Control | AI/API ทำงานเฉพาะเมื่อถูกสั่ง (on-demand) มี usage log และ cap ต่อ job |
| Explainability | ทุกคะแนนที่ AI ให้ต้องมีเหตุผลกำกับเสมอ ห้ามแสดงตัวเลขลอยๆ |
| Scalability | Schema/Architecture ต้องขยายเป็น multi-tenant SaaS ได้โดยไม่ rewrite core |

## 6. Out of Scope (MVP v1)

- การส่งข้อความหาลูกค้าอัตโนมัติ (AI ไม่ auto-send email/LINE ใน MVP — แค่ "แนะนำ" ให้เซลล์ส่งเอง)
- การสร้างใบเสนอราคา/เอกสาร PDF อัตโนมัติ (บันทึกข้อมูล quotation ไว้ แต่ไม่ generate เอกสาร)
- Mobile app แยก (ใช้ responsive web ก่อน)
- ระบบ Billing/Subscription สำหรับ SaaS
