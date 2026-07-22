# Security & Permission Model
**เวอร์ชัน:** 1.1

---

## 1. หลักการ: ข้อมูลเป็นของ Organization ไม่ใช่ของ User

ทุก record ผูกกับ `organization_id` ไม่มี concept "user เป็นเจ้าของข้อมูล" ที่กระทบสิทธิ์การเข้าถึง — field เช่น `current_owner_user_id` ใน `deals` เป็นเพียง label การมอบหมายงาน ไม่ใช่กลไกความปลอดภัย การเข้าถึงข้อมูลทั้งหมดควบคุมด้วย RBAC ที่ระดับ Role เท่านั้น

**ผลลัพธ์โดยตรง:** เมื่อพนักงานลาออก → Admin กด deactivate user → ข้อมูลทั้งหมดที่เคยดูแลยังอยู่ครบ 100% → reassign ไปยังพนักงานใหม่ได้ทันทีโดยไม่เสีย history

---

## 2. Perimeter / Network Access Control (ป้องกันไม่ให้บุคคลภายนอกเห็นระบบเลย)

RBAC (§3) ควบคุม "ใครทำอะไรได้บ้าง**หลังจาก**เข้าระบบแล้ว" ส่วนหัวข้อนี้ควบคุม "ใครเข้าถึงหน้า Login ได้ตั้งแต่แรก" — ทั้งสองชั้นทำงานร่วมกันแบบ defense-in-depth ไม่ใช่แทนที่กัน

### 2.1 ด่านที่ 1: Perimeter Gate (HTTP Basic Auth ที่ระดับ Middleware)

ก่อนถึงหน้า Login จริงของระบบ ผู้ใช้ต้องผ่าน **HTTP Basic Auth** ที่ทำงานใน Next.js Middleware ก่อนเสมอ:
- Browser จะเด้ง prompt ของระบบปฏิบัติการ/เบราว์เซอร์เอง (ไม่ใช่หน้าเว็บของเรา) ให้ใส่ username/password ที่เป็น**ความลับร่วมของทีม RNP/PUKA** (คนละชุดกับ user account จริง)
- ถ้าใส่ไม่ถูก → ไม่เห็นแม้แต่หน้า Login ของระบบ (เห็นแค่ 401 Unauthorized เปล่าๆ)
- Credential นี้เก็บเป็น environment variable (`PERIMETER_AUTH_USER`, `PERIMETER_AUTH_PASSWORD`) ไม่ผูกกับ user ใน database — Admin เป็นผู้ถือและแจกจ่ายให้พนักงานเท่านั้น เปลี่ยนได้ทุกเมื่อโดยไม่กระทบ user account จริง
- เลือกใช้วิธีนี้แทน Vercel Password Protection (ฟีเจอร์ของ Vercel Pro) เพราะทำงานได้ฟรีบน Vercel Hobby tier ไม่ต้องอัพเกรดแผนเพื่อเรื่องนี้อย่างเดียว — ถ้าภายหลังอัพเป็น Pro plan ด้วยเหตุผลอื่นอยู่แล้ว สามารถสลับไปใช้ Vercel Password Protection แทนได้ (ลดโค้ดที่ต้องดูแลเอง)

### 2.2 ด่านที่ 2: Login จริง (Supabase Auth)

ผ่านด่านที่ 1 แล้วจึงเจอหน้า Login จริงที่ต้องใช้ email/password ของ user จริงตาม RBAC (§3) — สองด่านนี้แยกอิสระจากกันโดยตั้งใจ: รู้รหัสด่านที่ 1 อย่างเดียวไม่สามารถเข้าดูข้อมูลอะไรได้ ต้องมี account จริงด้วย

### 2.3 มาตรการเสริมพื้นฐาน (ทำควบคู่กันเสมอ ไม่มีต้นทุนเพิ่ม)

| มาตรการ | รายละเอียด |
|---|---|
| ปิด Public Sign-up | ไม่มีหน้าสมัครสมาชิกสาธารณะ — Admin เป็นผู้สร้าง user เท่านั้น (ตรงตาม FR-13) แม้มีคนผ่านด่านที่ 1 มาได้ ก็สร้าง account เองไม่ได้ |
| `robots.txt` + `noindex` meta tag | กัน Google/search engine อื่น index หน้าเว็บนี้ ไม่ให้ค้นเจอผ่าน search ได้ |
| ไม่มีหน้า Marketing/Landing สาธารณะ | root path (`/`) redirect ตรงไปหน้า Login (หลัง Perimeter Gate) ไม่มีเนื้อหาอะไรให้เห็นก่อน login |

### 2.4 ทางเลือกที่แข็งแกร่งกว่า (ยังไม่ทำใน MVP แต่ทำเพิ่มได้ภายหลัง)

| ทางเลือก | เมื่อไหร่ควรพิจารณา |
|---|---|
| VPN ของบริษัท (เช่น Tailscale) — เข้าระบบได้เฉพาะเครื่องที่ต่อ VPN | ถ้าต้องการความปลอดภัยสูงขึ้นและทีมยอมรับการติดตั้ง client เพิ่ม — เหมาะเมื่อระบบเริ่มมีข้อมูลลูกค้าจำนวนมาก/sensitive มากขึ้น |
| IP Allowlist | ถ้า RNP/PUKA มี IP สำนักงานคงที่ (static IP) — จำกัดเฉพาะ IP นั้น + IP ของพนักงานที่ทำงานนอกสถานที่ (ต้องจัดการ IP list เอง) |

---

## 3. Role-Based Access Control (RBAC)

| Role | ขอบเขตสิทธิ์ |
|---|---|
| **Admin** | ทุกสิทธิ์: จัดการ user/role, ตั้งค่าระบบ (max results, budget cap), นำเข้าข้อมูล, อนุมัติ/ปฏิเสธ Waiting Review, ดู Audit Log, จัดการ **Competitor Master** (เพิ่ม/แก้ไข/ลบ/เปิดปิด) |
| **Sales Manager** | ดู Dashboard ทีม, อนุมัติ/ปฏิเสธ Waiting Review, มอบหมาย/reassign Deal, ดูข้อมูลลูกค้าทั้งหมดในองค์กร (ไม่จำกัดเฉพาะที่ตนดูแล) |
| **Sales Rep** | ใช้ AI Find Customers, ทำงานใน CRM (สร้าง/แก้ไข activity, task, quotation, contact), ดูข้อมูลลูกค้าทั้งหมดในองค์กร (ทีมขายเห็นข้อมูลร่วมกัน ไม่ silo ตาม sales แต่ละคน ตามเจตนา "ข้อมูลเป็นของบริษัท") |
| **Executive** | ดู Dashboard, Pipeline, Forecast, รายละเอียด Deal/Company (read-only เป็นหลัก) — อาจได้รับสิทธิ์ approve เพิ่มถ้าต้องการ (กำหนดได้ที่ Admin) |

**หมายเหตุการออกแบบ:** ตั้งใจ**ไม่ทำ** record-level ownership (เช่น "Sales A เห็นเฉพาะลูกค้าของตัวเอง") เพราะขัดกับเป้าหมายหลักของ BRD ที่ต้องการให้ข้อมูลเป็นของบริษัทและทุกคนเข้าถึงได้เพื่อ cover งานแทนกันได้ หากในอนาคตต้องการจำกัดสิทธิ์ตาม territory/segment สามารถเพิ่ม policy layer ได้โดยไม่กระทบ schema (RLS policy เพิ่มเงื่อนไขได้โดยไม่แก้ตาราง)

---

## 4. Row-Level Security (RLS) — กลไกทางเทคนิค

- เปิด RLS บนทุกตารางหลักใน PostgreSQL ตั้งแต่ MVP: `organization_id = current_setting('app.current_org')::uuid`
- เพิ่ม policy รายบทบาทเฉพาะจุดที่จำเป็น เช่น เฉพาะ Admin/Sales Manager เท่านั้นที่ `UPDATE candidate_leads SET status = 'approved'`
- Policy เดียวกันนี้คือกลไกที่ทำให้ multi-tenant SaaS ในอนาคตทำงานได้ทันทีเมื่อมีหลาย organization (แค่เปลี่ยนค่า `current_org` ตาม session)

---

## 5. Audit Trail

- `audit_logs` บันทึกทุกการแก้ไขข้อมูลสำคัญ (Company, Deal, Contact, Quotation, การ approve/reject candidate) พร้อม before/after state
- Sales Manager/Admin ดูประวัติการแก้ไขของ record ใดๆ ย้อนหลังได้จากหน้า Company/Deal โดยตรง (ไม่ต้องเข้าเมนู Admin แยก)
- Log การเข้าถึง (view) ข้อมูลลูกค้าที่ sensitive (เช่น export ข้อมูลจำนวนมาก) แยกจาก log การแก้ไข

---

## 6. Data Protection

| ประเด็น | มาตรการ |
|---|---|
| Encryption at rest | Supabase/Postgres จัดการให้ (managed) |
| Encryption in transit | HTTPS/TLS บังคับทุก endpoint |
| Secrets management | Environment variables ผ่าน Vercel/Supabase secret store ห้าม hardcode ในโค้ด |
| Backup | Point-in-time recovery ของ Supabase (managed daily backup) |
| Offboarding | Deactivate ไม่ delete user — ข้อมูลที่สร้างไว้คงอยู่ตาม §1 |
| Rate limiting | จำกัดจำนวน Search Job ต่อผู้ใช้ต่อวัน ป้องกันการใช้งานเกินควบคุม/ต้นทุนบานปลาย |
| Export control | จำกัดสิทธิ์ bulk export ข้อมูลลูกค้าเฉพาะ Admin/Sales Manager พร้อม log ทุกครั้ง |

---

## 7. Future SaaS Considerations (ไม่ต้องทำตอนนี้ แต่ออกแบบรองรับ)

- แยก authentication ต่อ tenant (custom domain/subdomain ต่อองค์กรลูกค้า)
- เพิ่ม API key/scope สำหรับลูกค้า SaaS ที่ต้องการเชื่อมต่อระบบภายนอกของตนเอง
- เพิ่ม data residency options หากลูกค้าต่างประเทศต้องการ (Supabase รองรับเลือก region ได้)
