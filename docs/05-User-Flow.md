# User Flow
**เวอร์ชัน:** 1.2

---

## Flow 1: AI Find Customers → AI วิเคราะห์ → Lead Result → Approve → CRM

**อัพเดต:** เดิม flow ข้าม "Lead Result" ไปตรง Waiting Review ทำให้ไม่เห็นขั้นตอนที่ฝ่ายขายดูผลลัพธ์และคัดกรองก่อน แก้ไขให้เห็นขั้นตอนครบและระบุ role ที่ทำ action ได้ในแต่ละจุด

```mermaid
flowchart TD
    A[Sales Rep Login] --> B[AI Search Wizard:\nตลาด / อุตสาหกรรม / ขนาด / Export Market /\nภาษา / Incoterm / ความถี่การส่ง / บริการ]
    B --> B2{บันทึกเป็น Saved Search?}
    B2 -- ใช่ --> B3[ตั้งชื่อ + Save\nเรียกซ้ำได้ครั้งเดียวคลิก]
    B2 -- ไม่ --> C
    B3 --> C{ยืนยันประมาณการต้นทุน?}
    C -- ยกเลิก --> B
    C -- กด AI Find Customers --> D[สร้าง Search Job\nสถานะ Queued — บันทึกใน Search History]
    D --> E[Prospecting Agent ค้นหาจาก\nGoogle / Maps / Website / DBD]
    E --> F[Scoring Agent วิเคราะห์:\n8 คะแนน + Evidence Checklist + Source Badge]
    F --> F2{ซ้ำกับ Company เดิมใน CRM?}
    F2 -- ซ้ำ --> F3["⚠ Already Exists" — ปิดปุ่ม Approve\nลิงก์ไป record เดิม]
    F2 -- ไม่ซ้ำ --> G["หน้า Lead Result"\nแสดง ⭐ คะแนน % + evidence]
    G --> H{ผู้ใช้เลือก action}
    H -- View --> G
    H -- "Skip (ทุก role)" --> J[บันทึกเหตุผล → Archive\nกู้คืนได้]
    H -- "Save (Sales Rep)" --> K[is_saved = true\nยังรอ Manager พิจารณา]
    H -- "Approve (Sales Manager/Admin เท่านั้น)" --> I[สร้าง Company + Deal ใน CRM\nพร้อม Assign ผู้รับผิดชอบ]
    K --> H
    I --> L[Sales Rep เริ่มทำงานใน CRM]
```

**หมายเหตุ:** ปุ่ม Approve แสดงเฉพาะ Sales Manager/Admin (คงหลัก human-in-the-loop) ส่วน Sales Rep ใช้ Save เพื่อเสนอให้พิจารณา — Deal ที่ approve แล้วเท่านั้นที่นับรวมใน Dashboard/Pipeline

---

## Flow 1B: Market Intelligence Snapshot (ก่อนตัดสินใจ Full Search)

```mermaid
flowchart TD
    A[เลือกประเทศเดียว เช่น Australia] --> B[Market Intelligence Agent\nนับจำนวนบริษัทตาม Industry แบบ aggregate]
    B --> C[แสดงภาพรวม:\nจำนวนรวม / breakdown ตาม Industry /\nLead ใหม่ / ระดับการแข่งขัน]
    C --> D{สนใจ Industry ไหนเป็นพิเศษ?}
    D -- เลือกแล้ว --> E[กด "ค้นหาแบบเจาะจง"\nส่งพารามิเตอร์ต่อให้ Flow 1 อัตโนมัติ]
    E --> F[เข้า AI Search Wizard\nพร้อมตัวกรองที่ preset ไว้แล้ว]
```

---

## Flow 2: เปิดบริษัท → AI Company Brief → ลงมือขาย

```mermaid
flowchart TD
    A[Sales Rep เปิดหน้า Company] --> B{มี Brief cache\nที่ยัง fresh อยู่?}
    B -- มี --> C[แสดง Brief ทันที\nพร้อม timestamp]
    B -- ไม่มี/เก่าเกินไป --> D[Generate Brief ใหม่\nรวมข้อมูล research เดิม + CRM history]
    D --> C
    C --> E[Sales Rep อ่าน:\nPain Point / กลยุทธ์ / Service Sequencing /\nคำถามที่ควรถาม / Objection Handling / Similar Company ที่เคย Won]
    E --> E1[ดู Competitor Intelligence:\nคู่แข่งที่คาดว่าใช้อยู่ + confidence + จุดแข็ง-จุดอ่อน + กลยุทธ์แทรกตัว]
    E1 --> E2[ดู AI Next Action\nวันนี้ / พรุ่งนี้ / สัปดาห์หน้า]
    E2 --> E3{รับคำแนะนำ?}
    E3 -- ใช่ --> E4[สร้าง Task จริง\nsource = ai_suggested]
    E3 -- ปรับก่อน --> E4
    E4 --> F[ลงมือติดต่อลูกค้า\nโทร/นัด/LINE ด้วยตนเอง]
    F --> G[บันทึกผลลัพธ์กลับเข้า Timeline\nCall Log / Task / Next Action]
    G --> H[AI Brief ครั้งถัดไปฉลาดขึ้น\nเพราะมีข้อมูลจริงเพิ่ม]
```

---

## Flow 3: Executive Dashboard Review

```mermaid
flowchart TD
    A[ผู้บริหาร Login] --> B[Dashboard แสดงทันที:\nLead ทั้งหมด / วันนี้ / Pipeline / Forecast]
    B --> C{สนใจจุดไหน?}
    C -- Deal เสี่ยงหลุด --> D[คลิกดูรายละเอียด Deal\nมอบหมาย/ทวงถามเซลล์]
    C -- ผลงานทีม --> E[ดู breakdown รายบุคคล]
    C -- Lead รอ Review --> F[ไปหน้า Lead Result\nApprove/Reject]
```

---

## Flow 4: Import ข้อมูลเดิมจาก Excel/Sheets

```mermaid
flowchart TD
    A[Admin อัพโหลดไฟล์ Excel/Sheets] --> B[ระบบอ่านคอลัมน์]
    B --> C[Admin จับคู่คอลัมน์กับ field ระบบ]
    C --> D[ระบบตรวจจับรายการซ้ำ\nชื่อ/เบอร์โทร/อีเมล]
    D --> E{พบข้อมูลซ้ำ?}
    E -- ใช่ --> F[เลือก Merge / Skip / Create New รายตัว]
    E -- ไม่ --> G[Preview รายการนำเข้าทั้งหมด]
    F --> G
    G --> H[ยืนยัน Import]
    H --> I[ข้อมูลเข้า CRM พร้อม flag source = Import]
```

---

## Flow 5: ปิด Deal → Win/Loss Capture → Sales Learning Agent

```mermaid
flowchart TD
    A[Sales Rep กด Won หรือ Lost] --> B[บังคับเลือก outcome_reason_category\nจาก dropdown มาตรฐาน]
    B --> C{Lost และทราบคู่แข่ง?}
    C -- ใช่ --> D[เลือก lost_to_competitor\nจาก list คู่แข่งที่กำหนดไว้]
    C -- ไม่ทราบ --> E[บันทึก Deal ปิด]
    D --> E
    E --> F{ดีลใหม่สะสมครบ\nตาม threshold?}
    F -- ยัง --> G[รอสะสมต่อ]
    F -- ครบ --> H[Sales Learning Agent วิเคราะห์ pattern\nแยกตาม segment]
    H --> I{segment มีดีลปิดแล้ว >= 5?}
    I -- ไม่ถึง --> J[ข้าม ไม่สร้าง insight]
    I -- ถึง --> K[บันทึก sales_insights\nพร้อม supporting_deal_count]
    K --> L[Insight ถูกใช้ใน Scoring Agent /\nCompany Brief / Market Intelligence ครั้งถัดไป]
```

---

## Flow 6: Deal Aging & Escalation

```mermaid
flowchart TD
    A[ระบบตรวจ deal_stage_history + last_activity_at\nทุกครั้งที่โหลด Dashboard/Company Detail] --> B{ไม่มี Activity\nเกิน X วัน?}
    B -- ใช่ --> C[Flag เป็น At-risk\nแสดงใน Dashboard + Company Detail]
    B -- ไม่ --> D[แสดงสถานะปกติ]
    C --> E{ค้างนานผิดปกติเทียบ\nค่าเฉลี่ย Stage/segment เดียวกัน?}
    E -- ใช่ --> F[AI แนะนำ Escalate ให้ Sales Manager\nพร้อมเหตุผล]
    E -- ไม่ --> G[AI แนะนำ Follow-up action ระดับ Sales Rep]
    F --> H[แจ้งเตือน Sales Manager ในระบบ]
```
