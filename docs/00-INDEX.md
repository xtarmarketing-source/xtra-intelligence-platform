# Xtar — Design Documentation Index
*(ชื่อผลิตภัณฑ์: Xtar — เดิมเรียกงานนี้ว่า "RNP Sales Intelligence" ในช่วง draft แรก)*

โครงการ: AI Sales Intelligence Platform สำหรับ RNP Express + PUKA Logistic
แนวคิดหลัก: ไม่ใช่ CRM แต่คือ "AI Sales Employee" — หาลูกค้า วิเคราะห์ วางกลยุทธ์ ช่วยฝ่ายขายและผู้บริหาร

| # | เอกสาร | ไฟล์ |
|---|---|---|
| 1 | Business Requirement Document | [01-BRD.md](01-BRD.md) |
| 2 | Product Requirement Document | [02-PRD.md](02-PRD.md) |
| 3 | Functional Requirements | [03-Functional-Requirements.md](03-Functional-Requirements.md) |
| 4 | User Stories | [04-User-Stories.md](04-User-Stories.md) |
| 5 | User Flow | [05-User-Flow.md](05-User-Flow.md) |
| 6 | System Architecture | [06-System-Architecture.md](06-System-Architecture.md) |
| 7 | Database Design (ER Diagram) | [07-Database-Design.md](07-Database-Design.md) |
| 8 | API Design | [08-API-Design.md](08-API-Design.md) |
| 9 | AI Agent Architecture | [09-AI-Agent-Architecture.md](09-AI-Agent-Architecture.md) |
| 10 | Technology Stack | [10-Technology-Stack.md](10-Technology-Stack.md) |
| 11 | Development Roadmap | [11-Development-Roadmap.md](11-Development-Roadmap.md) |
| 12 | MVP Scope | [12-MVP-Scope.md](12-MVP-Scope.md) |
| 13 | UI Wireframe | Artifact: https://claude.ai/code/artifact/4a9b7c64-5658-4b4b-b9ee-8e695f479dbf |
| 14 | Security & Permission Model | [14-Security-Permission-Model.md](14-Security-Permission-Model.md) |
| 15 | **Setup Checklist** (ก่อนเริ่มเขียนโค้ด) | [15-Setup-Checklist.md](15-Setup-Checklist.md) |

## สถานะ
Draft ทั้งหมดครบ 14 เอกสารออกแบบ (v1.7) + Setup Checklist — รอคุณสมัครบัญชี/ส่ง credential ตาม [15-Setup-Checklist.md](15-Setup-Checklist.md) ก่อนเริ่มเขียนโค้ดจริง (ยังไม่มีการเขียนโค้ดใดๆ ในโครงการนี้) — มีพรีเซนเสนอโครงการใน Canva และ Visual Design Mockup (15 หน้าจอ) แล้วด้วย (ดูลิงก์ในแชท)

## Changelog v1.7 (รอบ feedback ล่าสุด)
- เพิ่ม **Manual Company/Contact Entry** (FR-22): เพิ่มลูกค้าใหม่เข้าระบบด้วยตนเองผ่านฟอร์ม ไม่ต้องผ่าน AI Prospecting/Import ตรวจ duplicate ก่อนบันทึกเสมอ พร้อมปุ่ม "Enrich with AI" เรียก Brief/Scoring Agent มาวิเคราะห์ย้อนหลังได้
- เพิ่ม **Email Marketing List** (FR-23): รวบรวมอีเมล Contact ทั่วทั้ง CRM export เป็นรายชื่อสำหรับทำ Email Marketing ต่อในเครื่องมือภายนอก (Mailchimp/Brevo ฯลฯ) — export ระดับ Contact (1 แถว/คน) ไม่ใช่ระดับบริษัท
- **ข้อควรระวังด้าน PDPA:** เพิ่ม `contacts.email_marketing_consent` (subscribed/unsubscribed/not_asked) — รายชื่อที่ export เพื่อการตลาดต้องกรอง `unsubscribed` ออกอัตโนมัติเสมอในระดับ query (ป้องกันลืม filter) เพราะอีเมลผู้ติดต่อถือเป็นข้อมูลส่วนบุคคลตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล แม้เป็นบริบท B2B ก็ตาม

## Changelog v1.6
- เพิ่ม **Trade Direction (Export/Import)** เป็น Step แรกที่บังคับเลือกใน AI Search Wizard ก่อน "ประเทศ" เสมอ (FR-1.0) — กำหนดว่า "ประเทศ" หมายถึงตลาดปลายทางส่งออก หรือตลาดต้นทางนำเข้า และปรับน้ำหนัก Export Potential/Import Potential ใน Scoring Agent ให้อัตโนมัติ
- **เรียงลำดับประเทศใหม่** ตามความสำคัญเชิงธุรกิจของ RNP/PUKA: ไต้หวัน, เกาหลีใต้, UAE, USA, ออสเตรเลีย, จีน, ญี่ปุ่น, ไทย, แล้วตามด้วยประเทศที่เหลือ (FR-1.1)

## Changelog v1.5
- เพิ่ม **Perimeter Access Control**: ด่าน HTTP Basic Auth (credential ร่วมของทีม) ก่อนถึงหน้า Login จริงเสมอ ทำให้คนนอกเห็นแม้แต่หน้า Login ไม่ได้ — ป้องกันระบบไม่ให้ "ขึ้นหน้าเว็บให้คนอื่นเห็น" ตามที่ขอ (ดู [14-Security-Permission-Model.md §2](14-Security-Permission-Model.md))
- เสริมด้วย: ปิด public sign-up, `robots.txt`/noindex, ไม่มีหน้า marketing สาธารณะ
- ทางเลือกที่แข็งแกร่งกว่า (ยังไม่ทำใน MVP): VPN บริษัท (Tailscale) หรือ IP Allowlist — บันทึกไว้เผื่อภายหลัง
- เพิ่มเอกสาร **Setup Checklist** ([15-Setup-Checklist.md](15-Setup-Checklist.md)) สรุปสิ่งที่ต้องเตรียมก่อนเริ่มเขียนโค้ดจริง (บัญชี/API key/ข้อมูลธุรกิจ/decision เล็กๆ)

## Changelog v1.4
- **เอาตัวเลขต้นทุน (บาท) ออกจากทุกหน้าจอที่ Sales Rep เข้าถึง** — เหลือแสดงแค่จำนวนบริษัท/เวลาโดยประมาณ (FR-1.4)
- เพิ่ม **Free Trial Quota**: องค์กรมีโควตาค้นหาฟรี/เดือน (ค่าเริ่มต้น 100 บริษัท) ต้นทุนจริงยังคำนวณเสมอเบื้องหลังแม้อยู่ในโควตาฟรี (FR-1.7)
- เพิ่มหน้า **Admin — Usage & Cost** ใหม่ (เห็นเฉพาะ Admin): แสดงโควตาที่ใช้ไป, ต้นทุนจริงสะสม, breakdown รายบุคคล, ตั้งค่าโควตา/Budget Cap (FR-1.6)
- เกินโควตาฟรีแล้วระบบไม่บล็อกการใช้งาน — ยอดเกินนับรวมกับ Budget Cap เดิมที่ Admin ตั้งไว้
- เพิ่ม **Timeline & Total Project Cost Summary** ใน [10-Technology-Stack.md §3B](10-Technology-Stack.md) — สรุปเวลา (Design เสร็จแล้ว + Dev ~11-13 สัปดาห์ + Baseline 4 สัปดาห์) และงบประมาณรวม 2 สถานการณ์ (พนักงานประจำ vs จ้าง Freelance)

## Changelog v1.3
- **เปลี่ยนชื่อผลิตภัณฑ์เป็น Xtar** (เดิมเรียก "RNP Sales Intelligence" ในช่วง draft)
- เพิ่ม **Import/Export**: CSV import, 4 duplicate strategy (Create New/Skip/Merge/Update Existing), Export เป็น Excel/CSV/Google Sheets พร้อม filter 7 มิติ (Country/Industry/Service/Sales Owner/Deal Stage/Competitor/Date Range)
- เพิ่ม **Competitor Master**: ตาราง Master Data ที่ Admin จัดการเอง (เพิ่ม/แก้ไข/ลบ/เปิดปิด) — แก้ปัญหาการ hardcode รายชื่อคู่แข่งที่เคยฝังไว้ใน FR/prompt ของ Competitor Intelligence และ Sales Learning Agent
- เพิ่ม **Competitor Dashboard**: Top Competitor, by Country, by Industry, Win/Loss vs Competitor, **Market Share ภายใน CRM** (ไม่ใช่ market share ระดับประเทศ) พร้อม **What-if Projection** ประมาณการยอดขายถ้าปิดดีลลูกค้าคู่แข่งเพิ่ม
- เพิ่ม **Country Intelligence Dashboard**: ยกระดับ Step 1 ของ Search Wizard จาก filter ธรรมดาเป็น dashboard เต็มรูปแบบ (Lead/Qualified/Won/Lost/Pipeline/Win Rate/Conversion/Revenue/Avg Deal Size/Top Industry/Top Competitor) พร้อม drill-down และ AI Insight — เมตริกที่ข้อมูลไม่พอแสดง "N/A" แทนตัวเลขที่ทำให้เข้าใจผิด
- **คำแนะนำจาก CTO:** ผ่านการเพิ่ม scope มาแล้ว 4 รอบ แนะนำให้ล็อก MVP Core ตอนนี้ก่อนเริ่มพัฒนาจริง — ดู [12-MVP-Scope.md](12-MVP-Scope.md)

## Changelog v1.2
- เพิ่ม **Competitor Intelligence**: ทำนายคู่แข่งปัจจุบัน (DHL/FedEx/UPS/Maersk/ฯลฯ) พร้อม confidence score, evidence, จุดแข็ง-จุดอ่อน, กลยุทธ์ — ห้ามเดาเมื่อหลักฐานไม่พอ (สร้างเป็นส่วนขยายของ Company Brief Agent)
- เพิ่ม **CRM Aging Intelligence**: บันทึก Deal Stage History ตั้งแต่วันแรก, Dashboard/Company Detail แสดง Deal Age/Stage Age/Risk Level, AI วิเคราะห์ดีลค้าง/ควร Escalate
- เพิ่ม **Win/Loss Reason Capture**: บังคับเลือกเหตุผลปิดดีล (dropdown มาตรฐาน + ระบุคู่แข่งถ้าทราบ)
- เพิ่ม **Sales Learning Agent** (Agent ที่ 5): ขุด pattern จากผล Win/Loss จริง ข้าม segment (ประเทศ/อุตสาหกรรม/บริการ) แล้วป้อนกลับเข้า Scoring/Brief/Market Intelligence Agent — นี่คือจุดขายหลักที่ทำให้ระบบ "ฉลาดขึ้นเรื่อยๆ" จากผลขายจริงของ RNP/PUKA เอง ไม่ใช่แค่วิเคราะห์ข้อมูลภายนอกแบบ static
- **ข้อควรระวัง:** Deal Stage History และ Win/Loss Capture ต้องอยู่ใน MVP Core ตั้งแต่วันแรก (เก็บข้อมูลก่อน แม้ AI ที่ใช้ข้อมูลนี้จะยังไม่เปิดจนกว่าจะมีข้อมูลสะสมพอ) — ดู [12-MVP-Scope.md](12-MVP-Scope.md), timeline ขยับเป็น 6-7 สัปดาห์ (Core) + 3-4 สัปดาห์ (MVP+)

## Changelog v1.1
- แก้ไข: Fulfillment ย้ายจาก PUKA Logistic → RNP Express
- เพิ่มขั้นตอน **Lead Result** ที่ชัดเจนใน flow (Find → AI วิเคราะห์ → Lead Result → Approve → CRM) พร้อม View/Skip/Save/Approve ที่ role-gated
- เพิ่ม Explainable AI แบบ evidence checklist + Source badge (Google/Website/DBD/Maps) ต่อทุกคะแนน
- เพิ่ม Duplicate Detection ที่มองเห็นได้ (⚠ Already Exists)
- เพิ่ม AI Search History, Saved Search, Team Assignment
- เพิ่ม Company Golden Record, Contact Roles มาตรฐาน, Customer 360
- เพิ่ม AI Next Action, AI Recommendation (Service Sequencing), AI Similar Company
- เพิ่ม Market Intelligence ⭐ (Agent ที่ 4 แยกจาก Prospecting Agent เพื่อคุมต้นทุน)
- ขยาย AI Search Wizard เป็น multi-step พร้อมตัวกรองเสริม
- **MVP Scope แบ่งเป็น Core / MVP+ / Phase 1.5** — ดู [12-MVP-Scope.md](12-MVP-Scope.md) เพื่อเข้าใจ trade-off ด้าน timeline (5-6 สัปดาห์ ถ้าแยก MVP+ ออก vs 8-9 สัปดาห์ถ้ารวมทุกอย่างตั้งแต่ launch)

## จุดตัดสินใจสำคัญที่ยึดไว้ตลอดทุกเอกสาร
1. หนึ่งฐานลูกค้ากลาง (RNP Express + PUKA Logistic ใช้ร่วมกัน) แยกมิติ "บริการ/บริษัทที่เสนอ" ที่ระดับ Deal
2. AI ค้นหาลูกค้าแบบ **on-demand** (ผู้ใช้เลือก market/business type/service แล้วสั่งเอง) ไม่มี auto-run ใน MVP
3. ทุกบริษัทที่ AI พบต้องผ่าน **Waiting Review** ให้ Sales Manager/Admin อนุมัติก่อนเข้า CRM จริง
4. ทุกคะแนน AI ต้องมีคำอธิบายเหตุผลกำกับเสมอ (ห้ามแสดงตัวเลขลอยๆ)
5. ข้อมูลผูกกับ Organization ไม่ผูกกับ user — พนักงานลาออกข้อมูลไม่หาย
6. Schema/Architecture ออกแบบให้ขยายเป็น multi-tenant SaaS ได้โดยไม่ rewrite core
