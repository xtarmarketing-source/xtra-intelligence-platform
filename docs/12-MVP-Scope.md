# MVP Scope
**เวอร์ชัน:** 1.4 — ขอบเขตชัดเจนสำหรับ MVP v1 (อ้างอิงจาก PRD Feature List) แบ่งเป็น **Core** (ต้องมีตอน launch), **MVP+** (fast-follow ทันทีหลัง Core ใช้งานได้จริง) และ **Phase 1.5** (รอข้อมูลสะสม)

**บันทึกจาก CTO:** ผ่านการเพิ่ม scope มาแล้ว 4 รอบ (15 ฟีเจอร์ย่อย → Competitor Intelligence/Aging/Learning → Import-Export/Competitor Master/Competitor Dashboard/Country Intelligence) ส่วนใหญ่มีคุณค่าจริงและบางส่วนราคาถูก จึงใส่ใน Core ได้โดยไม่กระทบ timeline มาก แต่มีบางรายการที่เพิ่ม effort จริงหรือติดปัญหา **cold-start** (ต้องมีข้อมูลสะสมก่อนถึงมีประโยชน์จริง) — แยกเป็น MVP+/Phase 1.5 ถ้าต้องการทุกอย่างพร้อมกันตั้งแต่ launch ต้องขยาย timeline จาก 6-7 สัปดาห์เป็นประมาณ 11-12 สัปดาห์ (ดู Roadmap) **แนะนำอย่างจริงจังให้ล็อก scope ของ MVP Core ตอนนี้** ก่อนเริ่มพัฒนาจริง เพราะทุกรอบเพิ่มมาจะดันวันเสร็จออกไปเรื่อยๆ

**ข้อควรรู้สำคัญ:** ส่วน **Deal Stage History** และ **Win/Loss Reason Capture** ต้องอยู่ใน Core ตั้งแต่วันแรก แม้ว่า AI ที่ใช้ข้อมูลนี้ (Aging Analysis, Sales Learning Agent) จะยังไม่เปิดใช้ทันที เพราะข้อมูลย้อนหลังสร้างทีหลังไม่ได้ — ถ้าไม่เริ่มเก็บตั้งแต่ต้น จะไม่มีทาง unlock ฟีเจอร์เหล่านี้ในอนาคตได้เลยจนกว่าจะรอสะสมข้อมูลใหม่อีกหลายเดือน

---

## 1. MVP Core (Must Have ตอน Launch)

| Module | รายละเอียด |
|---|---|
| AI Search Wizard | ตลาด/อุตสาหกรรม/บริการ (ตัวกรองพื้นฐาน) → AI Find Customers (Google Search, Google Maps, Website, DBD) |
| AI Scoring & Analysis | 8 คะแนน + Evidence Checklist + Source Badge ครบทุกคะแนน |
| Lead Result & Review | หน้า Lead Result (⭐/%) พร้อม View/Skip/Save/Approve, Duplicate Detection Badge, Team Assignment |
| CRM Core | Company (Golden Record), Contact (พร้อม role_type), Deal, Timeline, Task, Quotation (record), Call/Meeting Log, Document |
| Customer 360 | รวม Timeline/Quotation/Email/LINE(manual)/Call/Meeting/Invoice/Shipment(reference) หน้าเดียว |
| AI Company Brief | On-demand summary + กลยุทธ์การขาย เมื่อเปิดหน้าบริษัท |
| Executive Dashboard | Real-time KPI, Pipeline, Forecast, ผลงานทีม, At-risk deals |
| Import | Excel/CSV/Google Sheets (ครั้งแรก + re-sync) พร้อม 4 duplicate strategy (Create New/Skip/Merge/Update Existing) |
| **Competitor Master** | CRUD + activate/deactivate โดย Admin — **ต้องมาก่อน Competitor Intelligence (MVP+)** เพราะเป็น dependency โดยตรง |
| Global Search | ค้นข้าม entity ทั้งหมด |
| User/Role Management | Admin/Sales Manager/Sales Rep/Executive |
| Audit Log พื้นฐาน | บันทึกการเข้าถึง/แก้ไขข้อมูลสำคัญ |
| **Deal Stage History Capture** | บันทึกวันที่เข้า/ออกแต่ละ Stage ตั้งแต่วันแรก — ไม่มี AI วิเคราะห์ยัง แต่ต้องเริ่มเก็บทันที |
| **Win/Loss Reason Capture** | Dropdown มาตรฐานบังคับกรอกเมื่อปิด Deal — ไม่มี AI วิเคราะห์ยัง แต่ต้องเริ่มเก็บทันที |
| CRM Aging Display | Deal Age/Stage Age/Last Activity/Next Follow-up/Risk Level บน Dashboard + Company Detail (คำนวณตรงไปตรงมา ไม่ใช้ LLM) |
| **Manual Company/Contact Entry** | เพิ่มบริษัทลูกค้าด้วยตนเอง + Enrich with AI แบบ on-demand — ไม่ผ่าน Waiting Review |
| **Email Marketing List** | Export ระดับ Contact พร้อม `email_marketing_consent` — filter `unsubscribed` ออกอัตโนมัติเสมอ (PDPA) |

## 1B. MVP+ (Fast-follow ทันทีหลัง Core — ก่อนเข้า Baseline เต็มรูปแบบ)

| Module | รายละเอียด | เหตุผลที่แยกจาก Core |
|---|---|---|
| AI Search History | Refresh/Continue การค้นหาเดิม | ใช้ข้อมูล search_jobs ที่มีอยู่แล้ว แต่ต้องทำ UI แยกต่างหาก ไม่ใช่ blocker ของการพิสูจน์คุณค่าหลัก |
| Saved Search | บันทึกชุดค้นหาที่ใช้บ่อย | ฟีเจอร์ความสะดวก ไม่ใช่ core value |
| AI Next Action | คำแนะนำพร้อมกรอบเวลา (วันนี้/พรุ่งนี้/สัปดาห์หน้า) | ต้องขยาย Brief Agent prompt + UI ใหม่ |
| AI Recommendation — Service Sequencing | ลำดับบริการที่ควรเสนอก่อน-หลัง | ขยายจาก Scoring Agent เดิม แต่ต้อง validate คุณภาพคำแนะนำก่อนเปิดใช้เต็มรูปแบบ |
| AI Search Wizard ขั้นสูง | Employee/Revenue/Export Country/Language/Incoterm/Shipment Frequency | เพิ่มความซับซ้อน UI (multi-step) และข้อมูลเหล่านี้หาได้ไม่ครบจากแหล่งข้อมูลสาธารณะเสมอไป |
| Market Intelligence Snapshot ⭐ | ภาพรวมตลาดระดับประเทศ/อุตสาหกรรม | ต้องสร้าง Agent ใหม่ + ตารางใหม่ + หน้าจอใหม่ — effort จริงประมาณ 3-5 วัน |
| Competitor Intelligence | ทำนายคู่แข่งปัจจุบัน + confidence + evidence + strategy | Brief Agent extension ใหม่ + ตาราง `competitor_intelligence` — effort ปานกลาง (~3-4 วัน) ควรทดสอบคุณภาพ confidence ก่อนเปิดใช้เต็มรูปแบบ |
| AI Aging Analysis | ดีลค้างผิดปกติ/ควร Escalate/มีโอกาสหลุด พร้อมเหตุผล | ต้องมีข้อมูล `deal_stage_history` สะสมอย่างน้อย 2-3 สัปดาห์ก่อนค่าเฉลี่ยต่อ Stage จะมีความหมาย |
| Export (Excel/CSV/Google Sheets) พร้อม filter | ตัวกรอง 7 มิติ + async job ใหม่ | ไม่ blocker ต่อการพิสูจน์คุณค่าหลัก (การหา/วิเคราะห์/ปิดการขาย) เป็น operational convenience |
| Competitor Dashboard (Top/by Country/by Industry/Win-Loss) | อาศัยข้อมูลจาก Competitor Intelligence + Win/Loss ที่ต้องมีก่อน | ต้องรอ Competitor Intelligence ทำงานสักระยะให้มีข้อมูลพอวิเคราะห์ |
| Market Share ภายใน CRM + What-if Projection | คำนวณจาก `competitor_intelligence` ที่มีอยู่แล้ว | UI/query ใหม่ ไม่ซับซ้อนมาก แต่ต้องมี Competitor Intelligence ทำงานแล้วระยะหนึ่ง |
| Country Intelligence Dashboard (metrics พื้นฐาน + drill-down) | Card/Table/Chart view จาก query อ้างอิง deals จริง | Live query ไม่ยาก แต่ต้องรอมีข้อมูล deal ในหลายประเทศพอสมควรถึงจะมีประโยชน์ |

## 1C. Phase 1.5 (รอข้อมูลสะสมก่อนถึงมีประโยชน์จริง)

| Module | เหตุผลที่รอ |
|---|---|
| AI Similar Company | ต้องมี Deal ที่ "Won" สะสมพอสมควรก่อนการเทียบเคียงจะมีความหมาย — เปิดใช้หลัง Baseline period เริ่มมีดีลปิดสำเร็จจริง |
| Sales Learning Agent (Pattern Insights) | ต้องมีดีลปิดแล้ว ≥5 ดีลต่อ segment ตาม FR-18.3 — เป็น cold-start ปัญหาเดียวกับ Similar Company เปิดใช้เมื่อมีข้อมูล Win/Loss สะสมเพียงพอหลัง Baseline |
| Competitor Trend (เดือนต่อเดือน) | ต้องมี snapshot สะสมหลายเดือนถึงจะเห็นแนวโน้มได้จริง |
| Country Intelligence AI Insight text + Heat Map | ต้องมีข้อมูลหลายประเทศที่มีนัยสำคัญทางสถิติก่อน (ดู FR-21.4 — เมตริกที่ข้อมูลน้อยเกินไปแสดง N/A แทน) |

## 2. นอกขอบเขต MVP v1 (Architecture รองรับไว้ล่วงหน้า)

| รายการ | เหตุผลที่เลื่อน | ผูกกับ |
|---|---|---|
| LINE OA / Facebook / Email 2-way integration | ต้นทุน+ความซับซ้อนสูง, ยังพิสูจน์คุณค่าหลักไม่ได้จากส่วนนี้ก่อน | Adapter pattern ใน AI Agent Architecture §2.3 |
| LinkedIn / Alibaba / ImportYeti / งานแสดงสินค้า / สมาคม | ความเสี่ยง ToS และ/หรือต้นทุนสูง ต้องประเมินเพิ่ม | เดียวกัน |
| AI Auto-run ตามรอบเวลา | ผู้ใช้ต้องการควบคุมต้นทุนและคุณภาพด้วยตนเองก่อน | Search Job design รองรับเพิ่ม schedule trigger ภายหลัง |
| AI auto-send message ถึงลูกค้า | ต้องมีคนตรวจสอบก่อนสื่อสารกับลูกค้าจริงในช่วงพิสูจน์ผล | Company Brief "แนะนำ" ข้อความ ให้คนกดส่งเอง |
| Generate ใบเสนอราคา/เอกสาร PDF อัตโนมัติ | ไม่ใช่ปัญหาเร่งด่วนที่สุดตาม BRD | Quotation table เก็บข้อมูลพร้อมขยายภายหลัง |
| Multi-tenant SaaS (ลูกค้าภายนอก) + Billing | เป้าหมาย MVP คือพิสูจน์ผลภายในก่อน | Schema มี `organization_id` รองรับแล้วตั้งแต่ต้น |
| Mobile App แยก | Responsive web เพียงพอสำหรับช่วงพิสูจน์ผล | - |

## 3. Definition of Done ของ MVP v1

MVP ถือว่า "เสร็จพร้อมพิสูจน์ผล" เมื่อ:
1. Sales Rep ทั้ง 3-5 คน ใช้ AI Find Customers แทนการหาลูกค้าด้วยตนเองได้จริง
2. ข้อมูลลูกค้าเดิมจาก Excel ถูก import เข้าระบบครบ ไม่มีข้อมูลตกหล่น
3. ผู้บริหารเปิด Dashboard แล้วเห็นตัวเลข Pipeline/Forecast ที่ตรงกับความเป็นจริง โดยไม่ต้องถามเซลล์
4. ทุก Deal มี Next Action เสมอ ไม่มี Lead ที่ "หายไปเงียบๆ"
5. เก็บ Baseline ได้ 2-4 สัปดาห์ตามที่ระบุใน BRD เพื่อใช้เปรียบเทียบผลหลังใช้ AI เต็มรูปแบบ
6. ทุก Deal บันทึก Stage History และทุกการปิด Deal (Won/Lost) มี outcome_reason_category ครบ 100% ตั้งแต่วันแรก — เป็นฐานข้อมูลที่ Aging Intelligence และ Sales Learning Agent จะใช้ต่อในอนาคต
