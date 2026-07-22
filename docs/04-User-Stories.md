# User Stories
**เวอร์ชัน:** 1.2 — Format: `As a [role], I want [goal], so that [benefit]` พร้อม Acceptance Criteria

---

## Epic A: AI Sales Intelligence (Prospecting)

### US-A1
**As a** Sales Rep, **I want** to select target market, business type, and service before searching, **so that** AI finds companies relevant to what I'm actually trying to sell.

**Acceptance Criteria:**
- [ ] เลือกได้อย่างน้อย 1 ตลาด, 1 ประเภทธุรกิจ, 1 บริการ ก่อนกด "AI Find Customers"
- [ ] ปุ่มค้นหา disabled จนกว่าจะเลือกครบตามเงื่อนไขขั้นต่ำ
- [ ] แสดงประมาณการเวลา/ต้นทุนก่อนยืนยัน

### US-A2
**As a** Sales Rep, **I want** to see AI Find Customers running in the background, **so that** I don't have to wait on the screen and can keep working.

**Acceptance Criteria:**
- [ ] กดค้นหาแล้วสามารถออกจากหน้าได้ทันที
- [ ] มีการแจ้งเตือนในระบบเมื่อ Search Job เสร็จสิ้น
- [ ] เห็นสถานะ Job (Queued/Running/Completed/Failed) ได้ตลอดเวลา

### US-A3
**As a** Sales Rep, **I want** every discovered company to come with clear scores and reasoning, **so that** I know which leads are worth my time without guessing.

**Acceptance Criteria:**
- [ ] ทุกบริษัทมีคะแนนครบ 8 ตัว พร้อม **evidence checklist** (เช่น ✔ Export ไป USA ✔ มี Warehouse) ไม่ใช่แค่ย่อหน้าอธิบาย
- [ ] ไม่มีคะแนนใดแสดงโดยไม่มีคำอธิบายกำกับ
- [ ] แสดง badge แหล่งข้อมูลที่ใช้จริง (Google/Website/DBD/Maps) ต่อรายการ
- [ ] เรียงลำดับตาม Opportunity Score ได้เป็นค่าเริ่มต้น

### US-A4
**As a** Sales Rep or Manager, **I want** the system to warn me when a discovered company already exists in the CRM, **so that** I never create duplicate records.

**Acceptance Criteria:**
- [ ] รายการที่ตรงกับ company เดิมแสดง badge "⚠ Already Exists" พร้อมลิงก์ไป record เดิม
- [ ] ปุ่ม Approve ถูกปิดใช้งานสำหรับรายการที่ซ้ำ

### US-A5
**As a** Sales Rep, **I want** to save a search configuration I use often and revisit my search history, **so that** I don't have to re-enter the same filters every day.

**Acceptance Criteria:**
- [ ] บันทึก Saved Search พร้อมตั้งชื่อ และเรียกใช้ซ้ำได้ด้วยคลิกเดียว
- [ ] ดูประวัติการค้นหาที่ผ่านมาทั้งหมด พร้อม Refresh/Continue ต่อรายการ

### US-A6
**As a** Sales Manager, **I want** to review and approve/reject AI-discovered companies from the Lead Result page before they enter the CRM, **so that** our pipeline stays clean and only has quality leads.

**Acceptance Criteria:**
- [ ] เห็นรายการ Lead Result ทั้งหมดพร้อมคะแนน/evidence checklist
- [ ] ปุ่ม Approve แสดงเฉพาะ role Sales Manager/Admin — Sales Rep เห็นปุ่ม Save แทน
- [ ] Approve แล้วสร้าง Company + Deal ใน CRM ทันที
- [ ] Reject/Skip ต้องระบุเหตุผล และรายการยังอยู่ใน archive ค้นหาย้อนหลังได้

### US-A7
**As a** Sales Manager, **I want** to assign a discovered lead or deal to a specific sales rep, **so that** everyone knows who is responsible for following up.

**Acceptance Criteria:**
- [ ] เลือกผู้รับผิดชอบจาก dropdown รายชื่อพนักงานได้ทั้งจาก Lead Result และ Deal
- [ ] Sales Rep เห็นรายการที่ยังไม่ถูก assign และ self-claim ได้เอง
- [ ] การ assign ไม่จำกัดสิทธิ์การเข้าถึงข้อมูลของคนอื่น (ทุกคนยังเห็นข้อมูลได้ตาม RBAC เดิม)

---

## Epic B: CRM Core

### US-B1
**As a** Sales Rep, **I want** to see a full timeline (Customer 360) of everything that happened with a customer in one page, **so that** I never lose context even if someone else talked to them before.

**Acceptance Criteria:**
- [ ] หน้าเดียวรวม Timeline, Quotation, Email, LINE, Call, Meeting, Invoice, Shipment reference เรียงตามเวลา
- [ ] กรองตามประเภทเหตุการณ์ได้

### US-B4
**As a** Sales Rep, **I want** to see a company's key facts (Golden Record) the instant I open it, **so that** I don't have to hunt for revenue, factory status, export markets, or contact channels.

**Acceptance Criteria:**
- [ ] เปิดหน้าบริษัทแล้วเห็น Revenue, Employees, Factory, Export Market, HS Code, Country, Website, Facebook, LinkedIn, Email, Phone, Google Maps ทันทีโดยไม่ต้องคลิกเพิ่ม

### US-B5
**As a** Sales Rep, **I want** each contact to have a standard B2B role (Owner, Export Manager, Sales Manager, Procurement, Logistics), **so that** I know exactly who to talk to about what.

**Acceptance Criteria:**
- [ ] เพิ่มผู้ติดต่อพร้อมเลือก role_type จาก dropdown มาตรฐาน (เพิ่มเองได้ถ้าไม่ตรง)
- [ ] หน้ารายชื่อผู้ติดต่อแสดง role เป็น badge ให้เห็นชัดเจน

### US-B2
**As a** Sales Manager, **I want** customer data to remain fully intact when an employee resigns, **so that** the company never loses a relationship or deal history.

**Acceptance Criteria:**
- [ ] ปิดการใช้งาน (deactivate) user ไม่ลบข้อมูลที่ user เคยสร้าง/ดูแล
- [ ] Deal/Company ที่เคยดูแลโดย user ที่ลาออก reassign ไปยัง user อื่นได้โดยไม่เสียประวัติ
- [ ] Field "ผู้ดูแล" เป็นเพียง reference ไม่ใช่ ownership ที่ผูก permission การเข้าถึงข้อมูล

### US-B3
**As a** Sales Rep, **I want** to search across every record in the system from one search box, **so that** I can find a customer even if I only remember partial info.

**Acceptance Criteria:**
- [ ] ค้นด้วยชื่อบริษัท, ชื่อผู้ติดต่อ, เบอร์โทร, เนื้อหาบันทึกกิจกรรม แล้วเจอผลลัพธ์ที่ถูกต้อง
- [ ] ผลลัพธ์แสดง context เพียงพอให้คลิกเข้าไปหน้าที่ถูกต้องได้ทันที

---

## Epic C: AI Company Brief

### US-C1
**As a** Sales Rep, **I want** an instant AI summary when I open a company, **so that** I feel like I have a senior sales manager sitting next to me before every call.

**Acceptance Criteria:**
- [ ] เปิดหน้าบริษัท → เห็น Brief ครบทุกหัวข้อตาม FR-6.1 ภายใน SLA ที่ยอมรับได้ (จาก cache ถ้ามี, หรือ generate ใหม่)
- [ ] มีปุ่ม "Refresh Brief" แยกจากการโหลดหน้าอัตโนมัติ
- [ ] Brief อ้างอิงข้อมูลล่าสุดใน CRM (ไม่ใช่แค่ข้อมูลตอน prospecting เดิม)

### US-C2
**As a** Sales Rep, **I want** AI to tell me exactly what to do next with a time frame (today/tomorrow/next week), **so that** I always know my next move instead of just seeing a history log.

**Acceptance Criteria:**
- [ ] Brief แสดงรายการ Next Action พร้อมกรอบเวลาเจาะจง ไม่ใช่คำแนะนำลอยๆ
- [ ] กด "รับคำแนะนำ" แล้วสร้าง Task จริงในระบบ พร้อมแก้ไขก่อนรับได้

### US-C3
**As a** Sales Rep, **I want** to see companies similar to ones RNP has already won, **so that** I can borrow a strategy that's proven to work.

**Acceptance Criteria:**
- [ ] แสดงบริษัทที่คล้ายกัน (เน้นที่เคย Won) พร้อมเหตุผลความคล้าย
- [ ] ฟีเจอร์นี้แสดงผลมีความหมายก็ต่อเมื่อมีข้อมูล Won สะสมเพียงพอ (Phase 1.5 ตาม MVP Scope)

---

## Epic D: Executive Dashboard

### US-D1
**As an** Executive, **I want** to see all key numbers the moment I log in, **so that** I don't have to ask my sales team for status updates.

**Acceptance Criteria:**
- [ ] หน้าแรกหลัง login คือ Dashboard ไม่ใช่หน้าอื่น
- [ ] ครบทุกตัวชี้วัดตาม FR-10.1 โดยไม่ต้องคลิกเพิ่ม
- [ ] ตัวเลขตรงกับข้อมูลจริงใน CRM ณ เวลานั้น (คลาดเคลื่อนได้ไม่เกินไม่กี่วินาที)

### US-D2
**As an** Executive, **I want** to see which deals are at risk of falling through, **so that** I can step in or ask the right sales rep before it's too late.

**Acceptance Criteria:**
- [ ] Deal ที่ไม่มีความเคลื่อนไหวเกินเกณฑ์ที่กำหนดถูก flag เป็น "At-risk" อัตโนมัติ
- [ ] คลิกจาก Dashboard ไปหน้า Deal นั้นได้ทันที

---

## Epic E: Data Import

### US-E1
**As an** Admin, **I want** to import existing customer data from Excel/Google Sheets, **so that** we don't lose the customer relationships the company already built.

**Acceptance Criteria:**
- [ ] อัพโหลดไฟล์ → mapping column → preview → confirm import
- [ ] ระบบแจ้งรายการซ้ำก่อน import จริง พร้อมตัวเลือก merge/skip/create new
- [ ] Import ซ้ำได้ (re-sync) โดยไม่สร้างข้อมูลซ้ำซ้อน

---

## Epic F: Market Intelligence ⭐

### US-F1
**As an** Executive or Sales Manager, **I want** to see a market-level overview (total companies, industry breakdown, competition level) before committing to a full search, **so that** I can decide where to focus the team's effort.

**Acceptance Criteria:**
- [ ] เลือกประเทศเดียว → เห็นจำนวนบริษัทรวม, breakdown ตาม industry, จำนวน lead ใหม่, ระดับการแข่งขัน
- [ ] ผลลัพธ์แสดงภายในเวลาสั้นกว่า Full Prospecting อย่างชัดเจน (เพราะเป็น count-only ไม่ enrich รายบริษัท)
- [ ] กดต่อยอดเป็น AI Search Wizard พร้อม preset พารามิเตอร์จากตลาด/อุตสาหกรรมที่เลือกได้ทันที

---

## Epic G: Competitor Intelligence

### US-G1
**As a** Sales Rep, **I want** AI to predict which logistics provider a target company is likely using now, with clear evidence and confidence, **so that** I can position RNP/PUKA against a specific competitor instead of pitching blindly.

**Acceptance Criteria:**
- [ ] เปิดหน้าบริษัทแล้วเห็นคู่แข่งที่คาดว่าใช้อยู่ พร้อม confidence score/level, evidence, จุดแข็ง-จุดอ่อน, กลยุทธ์แนะนำ, บริการที่ควรเสนอก่อน
- [ ] เมื่อหลักฐานไม่พอ ระบบแสดง "ข้อมูลไม่เพียงพอ" แทนการเดาชื่อคู่แข่ง (ไม่มีค่า default ที่ทำให้เข้าใจผิดว่าแน่ใจ)
- [ ] มีปุ่ม Refresh แยกจากการโหลดหน้าอัตโนมัติ

---

## Epic H: CRM Aging Intelligence & Sales Learning

### US-H1
**As an** Executive, **I want** to see how long deals sit in each stage and which ones are aging abnormally, **so that** I can catch stalled deals before they die silently.

**Acceptance Criteria:**
- [ ] Dashboard แสดง Average Days per Stage, Deals at Risk, Longest Negotiation, Follow-up Overdue
- [ ] Company Detail แสดง Deal Age, Stage Age, Last Activity, Next Follow-up, Risk Level ต่อ Deal
- [ ] AI ระบุเหตุผลที่ดีลถูกจัดว่าค้างนานผิดปกติ (เทียบกับค่าเฉลี่ยของ Stage/segment เดียวกัน)

### US-H2
**As a** Sales Manager, **I want** to be notified automatically when a deal should be escalated, **so that** I can step in before the deal is lost.

**Acceptance Criteria:**
- [ ] ดีลที่ AI ประเมินว่าควร escalate ส่ง notification ให้ Sales Manager พร้อมเหตุผล

### US-H3
**As a** Sales Rep, **I want** to record why a deal was won or lost using a standard list, **so that** the company builds a real memory of what works instead of losing that knowledge when I forget or leave.

**Acceptance Criteria:**
- [ ] ปิด Deal (Won/Lost) บังคับเลือกเหตุผลจาก dropdown มาตรฐานเสมอ ไม่ปล่อยว่าง
- [ ] กรณี Lost ที่ทราบคู่แข่ง ให้เลือกจาก list คู่แข่งเดียวกับ Competitor Intelligence

### US-H4
**As a** Sales Rep prospecting a new market, **I want** AI to warn me about patterns learned from past deals in the same segment, **so that** I don't repeat mistakes the team already learned from.

**Acceptance Criteria:**
- [ ] เมื่อ segment มีข้อมูลเพียงพอ (≥5 ดีลปิดแล้ว) ระบบแสดง insight เช่น "ลูกค้ากลุ่มนี้มักแพ้ DHL เพราะความเร็ว" พร้อมจำนวนดีลที่ใช้วิเคราะห์
- [ ] Segment ที่ข้อมูลไม่พอไม่แสดง insight ใดๆ แทนการเดา
