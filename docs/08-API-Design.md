# API Design
**เวอร์ชัน:** 1.6 — REST-style ผ่าน Next.js API Routes/Server Actions, JSON, Auth ผ่าน Bearer session token (Supabase Auth)
ทุก endpoint บังคับ `organization_id` จาก session เสมอ (ไม่รับจาก client เพื่อป้องกัน cross-org access)

---

## 1. Auth & Users

| Method | Endpoint | คำอธิบาย | Role |
|---|---|---|---|
| POST | `/api/auth/login` | เข้าสู่ระบบ | Public |
| POST | `/api/auth/logout` | ออกจากระบบ | ทุก role |
| GET | `/api/users` | รายชื่อผู้ใช้ในองค์กร | Admin |
| POST | `/api/users` | เพิ่มผู้ใช้ใหม่ | Admin |
| PATCH | `/api/users/:id` | แก้ไข role/สถานะ | Admin |
| POST | `/api/users/:id/deactivate` | ปิดการใช้งาน (ไม่ลบข้อมูลที่เคยสร้าง) | Admin |

## 2. Prospecting (AI Sales Intelligence)

| Method | Endpoint | คำอธิบาย | Role |
|---|---|---|---|
| POST | `/api/search-jobs` | สร้าง Search Job ใหม่ (`trade_direction`: export/import — บังคับ, target_countries, business_types, services, business_units, wizard filters ตาม FR-1.5) → คืน job id + `estimated_result_count`/`estimated_duration` (ไม่คืน `estimated_cost` ให้ role ต่ำกว่า Admin — ตาม FR-1.4/1.6) | Sales Rep+ |
| GET | `/api/search-jobs` | **Search History** — รายการ Search Job ทั้งหมด + สถานะ + ผู้สั่งงาน | Sales Rep+ |
| GET | `/api/search-jobs/:id` | รายละเอียด Job + ผลลัพธ์ candidate leads ที่พบ (หน้า Lead Result) | Sales Rep+ |
| POST | `/api/search-jobs/:id/cancel` | ยกเลิก Job ที่ยังไม่เสร็จ | Sales Rep+ |
| POST | `/api/search-jobs/:id/rerun` | **Refresh** — ค้นซ้ำด้วยพารามิเตอร์เดิม ข้อมูลใหม่ | Sales Rep+ |
| GET | `/api/saved-searches` | รายการ Saved Search ของผู้ใช้/องค์กร | Sales Rep+ |
| POST | `/api/saved-searches` | บันทึกชุดพารามิเตอร์การค้นหาเป็น Saved Search | Sales Rep+ |
| POST | `/api/saved-searches/:id/run` | สร้าง Search Job ใหม่จาก Saved Search ทันที | Sales Rep+ |
| DELETE | `/api/saved-searches/:id` | ลบ Saved Search | เจ้าของ/Admin |
| GET | `/api/market-intelligence?country=` | Market Intelligence Snapshot ของตลาดที่เลือก (FR-15) | ทุก role |
| POST | `/api/market-intelligence/refresh` | สั่งคำนวณ snapshot ใหม่ | Sales Manager/Admin |

## 3. Lead Result (Candidate Leads)

| Method | Endpoint | คำอธิบาย | Role |
|---|---|---|---|
| GET | `/api/candidate-leads?status=pending_review` | หน้า **Lead Result** — เรียงตาม opportunity_score, filter ตาม saved/skipped/assigned | ทุก role (read) |
| GET | `/api/candidate-leads/:id` | รายละเอียด candidate + คะแนน + evidence checklist + source badges | ทุก role (read) |
| POST | `/api/candidate-leads/:id/save` | **Save** — ทำเครื่องหมายสนใจ (`is_saved=true`) ไม่เปลี่ยน status | ทุก role |
| POST | `/api/candidate-leads/:id/skip` | **Skip** พร้อม `reason` (ไม่บังคับ) | ทุก role |
| POST | `/api/candidate-leads/:id/assign` | **Team Assignment** — มอบหมาย/self-claim ให้ user คนใดคนหนึ่ง | ทุก role (self-claim) / Sales Manager+Admin (assign ผู้อื่น) |
| POST | `/api/candidate-leads/:id/approve` | **Approve** → สร้าง Company + Deal (ปิดกั้นถ้า `duplicate_of` ไม่ว่าง) | **Sales Manager/Admin เท่านั้น** |
| POST | `/api/candidate-leads/:id/reject` | ปฏิเสธ พร้อม `reason` | **Sales Manager/Admin เท่านั้น** |

## 4. Companies (CRM Core)

| Method | Endpoint | คำอธิบาย | Role |
|---|---|---|---|
| GET | `/api/companies` | รายการบริษัท (filter: business_unit, stage, owner, search) | ทุก role |
| POST | `/api/companies` | **เพิ่มบริษัทใหม่ด้วยตนเอง** (`source=manual`) — ตรวจ duplicate ก่อนบันทึกจริง (FR-22) | Sales Rep+ |
| POST | `/api/companies/:id/enrich` | สั่งให้ Brief/Scoring Agent วิเคราะห์บริษัทที่เพิ่มเอง (Enrich with AI, FR-22.5) | Sales Rep+ |
| GET | `/api/companies/:id` | **Golden Record** — รายละเอียดบริษัทครบ (Revenue, Employees, Factory, Export Market, HS Code, Website, Facebook, LinkedIn, Email, Phone, Google Maps ฯลฯ) | ทุก role |
| PATCH | `/api/companies/:id` | แก้ไขข้อมูลบริษัท | Sales Rep+ |
| GET | `/api/companies/:id/brief` | ดึง AI Brief ล่าสุด (จาก cache) รวม Next Action + Similar Company | ทุก role |
| POST | `/api/companies/:id/brief/refresh` | สั่งสร้าง AI Brief ใหม่ | Sales Rep+ |
| GET | `/api/companies/:id/timeline` | **Customer 360** — Timeline รวมทุก activity (Call/Meeting/Quotation/Email/LINE/Invoice/Shipment) | ทุก role |
| GET | `/api/companies/:id/similar` | รายชื่อบริษัทที่คล้ายกัน (เน้นที่เคย Won) พร้อมเหตุผล | ทุก role |
| GET | `/api/companies/:id/competitor-intelligence` | ผลทำนายคู่แข่งปัจจุบัน + confidence + evidence (จาก cache) | ทุก role |
| POST | `/api/companies/:id/competitor-intelligence/refresh` | สั่งวิเคราะห์ Competitor Intelligence ใหม่ | Sales Rep+ |
| GET | `/api/companies/search?q=` | Global search ข้าม entity | ทุก role |

## 5. Contacts

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/companies/:id/contacts` | รายชื่อผู้ติดต่อของบริษัท (พร้อม `role_type`: Owner/Export Manager/Sales Manager/Procurement/Logistics) |
| POST | `/api/companies/:id/contacts` | เพิ่มผู้ติดต่อ พร้อมระบุ `role_type` |
| PATCH | `/api/contacts/:id` | แก้ไขผู้ติดต่อ |
| PATCH | `/api/contacts/:id/consent` | อัพเดต `email_marketing_consent` (subscribed/unsubscribed) — บันทึก Audit Log อัตโนมัติ (FR-23.4) |

## 6. Deals (Pipeline)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/deals` | รายการ Deal (filter: stage, business_unit, owner, at_risk) |
| POST | `/api/companies/:id/deals` | สร้าง Deal ใหม่ให้บริษัท |
| PATCH | `/api/deals/:id` | แก้ไข stage/value/owner/next_action |
| POST | `/api/deals/:id/assign` | **Team Assignment** — มอบหมาย Deal ให้ Sales Rep | Sales Manager/Admin |
| GET | `/api/deals/:id/aging` | Deal Age, Stage Age, Last Activity, Risk Level (FR-17.3) | ทุก role |
| POST | `/api/deals/:id/won` | ปิดการขายสำเร็จ พร้อม `outcome_reason_category` (บังคับ) + `outcome_reason_detail` (ไม่บังคับ) |
| POST | `/api/deals/:id/lost` | ปิดดีลไม่สำเร็จ พร้อม `outcome_reason_category` (บังคับ) + `lost_to_competitor` (ถ้าทราบ) + `outcome_reason_detail` |

## 7. Activities / Tasks / Quotations / Documents

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| POST | `/api/companies/:id/activities` | บันทึก call log/meeting/note/email/line_message/invoice/shipment_update (Customer 360) |
| POST | `/api/companies/:id/tasks` | สร้าง task/reminder |
| PATCH | `/api/tasks/:id` | อัพเดตสถานะ task |
| POST | `/api/companies/:id/next-actions/:actionId/accept` | รับคำแนะนำ AI Next Action → สร้าง Task จริง (`source=ai_suggested`) |
| POST | `/api/companies/:id/quotations` | บันทึกใบเสนอราคา |
| POST | `/api/companies/:id/documents` | อัพโหลดเอกสาร |

## 8. Dashboard

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/dashboard/summary` | ตัวเลขสรุปทั้งหมดตาม FR-10.1 (คำนวณ real-time) |
| GET | `/api/dashboard/pipeline` | ข้อมูล pipeline แยกตาม stage/business_unit |
| GET | `/api/dashboard/forecast` | ยอดขายคาดการณ์ |
| GET | `/api/dashboard/team-performance` | ผลงานรายบุคคล |
| GET | `/api/dashboard/at-risk` | รายการ Deal เสี่ยงหลุด |
| GET | `/api/dashboard/aging` | **Aging Intelligence** — Average Days per Stage, Deals at Risk, Longest Negotiation, Follow-up Overdue, AI Recommendations (FR-17.2) |
| GET | `/api/dashboard/competitors` | **Competitor Dashboard** — Top Competitor, by Country, by Industry, Trend, Win/Loss vs Competitor, Market Share ภายใน CRM (FR-20) |
| GET | `/api/dashboard/competitors/what-if?competitor_id=&additional_wins=` | **What-if Projection** — ประมาณการยอดขายเพิ่มถ้าปิดดีลลูกค้าคู่แข่งนี้ได้เพิ่ม N ราย (FR-20.3) |
| GET | `/api/dashboard/countries` | **Country Intelligence** — สรุปทุกประเทศ: Lead/Qualified/Won/Lost/Pipeline/Win Rate/Conversion/Revenue/Avg Deal Size/Top Industry/Top Competitor (FR-21.1) |
| GET | `/api/dashboard/countries/:country` | Drill-down รายละเอียดประเทศเดียว พร้อม AI Insight (FR-21.2/21.3) |

## 8A2. Admin — Usage & Cost (FR-1.6/1.7)

| Method | Endpoint | คำอธิบาย | Role |
|---|---|---|---|
| GET | `/api/admin/usage` | โควตาฟรีที่ตั้งไว้, จำนวนบริษัทที่ค้นไปแล้วเดือนนี้, ต้นทุนจริงสะสมเดือนนี้ (`SUM(search_jobs.actual_cost)`), breakdown ต่อ Search Job/ผู้ใช้ | **Admin เท่านั้น** |
| PATCH | `/api/admin/usage/quota` | ปรับค่า `free_quota_companies_per_month` / `monthly_budget_cap` | Admin |

## 8B. Sales Insights (Sales Learning Agent)

| Method | Endpoint | คำอธิบาย | Role |
|---|---|---|---|
| GET | `/api/insights?segment=` | รายการ insight ที่ผ่านเกณฑ์ `supporting_deal_count` ตาม segment ที่ระบุ (ว่างได้ถ้ายังไม่ถึงเกณฑ์) | ทุก role |
| POST | `/api/insights/recompute` | สั่งให้ Sales Learning Agent วิเคราะห์ pattern ใหม่จากข้อมูล Win/Loss ล่าสุด | Admin |

## 8C. Competitor Master

| Method | Endpoint | คำอธิบาย | Role |
|---|---|---|---|
| GET | `/api/competitors` | รายชื่อคู่แข่งทั้งหมด (filter `?active=true` สำหรับ dropdown ที่ใช้งานจริง) | ทุก role (read) |
| POST | `/api/competitors` | เพิ่มคู่แข่งใหม่ | Admin |
| PATCH | `/api/competitors/:id` | แก้ไขชื่อ/logo | Admin |
| POST | `/api/competitors/:id/activate` | เปิดใช้งาน | Admin |
| POST | `/api/competitors/:id/deactivate` | ปิดใช้งาน (ไม่ลบ — ข้อมูลเก่าที่อ้างอิงยังคงอยู่) | Admin |
| DELETE | `/api/competitors/:id` | ลบถาวร — อนุญาตเฉพาะเมื่อไม่มีการอ้างอิงจาก `deals`/`competitor_intelligence` ใดๆ | Admin |

## 9. Import / Export

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| POST | `/api/import-jobs` | อัพโหลดไฟล์ .xlsx/.csv / เชื่อม Google Sheets |
| POST | `/api/import-jobs/:id/preview` | แสดง preview + duplicate detection พร้อมตัวเลือก create_new/skip/merge/update_existing ต่อแถว |
| POST | `/api/import-jobs/:id/confirm` | ยืนยันนำเข้าจริง |
| POST | `/api/export-jobs` | สร้าง Export Job ใหม่ (`format`: xlsx/csv/google_sheets, `filters`: country/industry/service/sales_owner/deal_stage/competitor_id/date_range) |
| GET | `/api/export-jobs/:id` | สถานะ + ลิงก์ดาวน์โหลด/ลิงก์ Google Sheets เมื่อเสร็จ |
| POST | `/api/export-jobs` (`type=marketing_list`) | **Email Marketing List** — export ระดับ Contact (1 แถว/คน: ชื่อ, อีเมล, บริษัท, role_type, ประเทศ, อุตสาหกรรม) กรอง `unsubscribed` ออกเสมอโดยอัตโนมัติ (FR-23) | Sales Manager/Admin |

## 10. Response Convention

```json
{
  "data": { },
  "error": null,
  "meta": { "request_id": "uuid" }
}
```

- Error response ใช้ HTTP status code มาตรฐาน (400/401/403/404/409/500) พร้อม `error.code` และ `error.message` ที่เป็นข้อความอ่านเข้าใจง่าย (ไม่ใช่ stack trace)
- ทุก list endpoint รองรับ `?page=&limit=` และ cursor-based pagination สำหรับ timeline/activities ที่อาจมีจำนวนมาก
