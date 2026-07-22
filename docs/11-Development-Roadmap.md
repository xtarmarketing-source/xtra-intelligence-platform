# Development Roadmap
**เวอร์ชัน:** 1.3 — ทีม 1-2 คน, เป้าหมาย MVP ใช้งานจริงเร็วที่สุด (ปรับปรุงตามการเพิ่ม scope 3 รอบล่าสุด — ดู [12-MVP-Scope.md](12-MVP-Scope.md) §1/§1B/§1C)

---

## Phase 1A: MVP Core (เป้าหมาย 6-7 สัปดาห์)

| สัปดาห์ | งานหลัก |
|---|---|
| 1 | Setup infra (Vercel/Supabase), Schema + RLS, Auth + Role, โครง CRM (Company/Contact/Deal พร้อม Golden Record fields + role_type + deal_stage_history), **Competitor Master CRUD** |
| 2 | AI Agent: Google Search/Maps/Website/DBD Adapters + Orchestrator, Scoring Engine (rule-based formula + evidence checklist + source tracking) |
| 3 | Lead Result UI (View/Skip/Save/Approve, Duplicate Detection badge, Team Assignment), AI Search Wizard พื้นฐาน, Search Job async flow + แจ้งเตือน |
| 4 | CRM UI เต็มรูปแบบ (Customer 360: Timeline, Task, Quotation, Call Log, Document), Company Brief Agent |
| 5 | Executive Dashboard (real-time KPI/Pipeline/Forecast) รวม Aging display พื้นฐาน, Excel/CSV/Google Sheets Import (4 duplicate strategy) |
| 6 | Win/Loss Reason Capture (dropdown + บังคับกรอกตอนปิด Deal, อ้างอิง Competitor Master), Import ข้อมูลจริงของ RNP/PUKA |
| 7 | ทดสอบกับผู้ใช้จริง, แก้ bug |

## Phase 1B: MVP+ Fast-follow (เป้าหมาย 5-6 สัปดาห์ถัดไป สัปดาห์ 8-13)

| สัปดาห์ | งานหลัก |
|---|---|
| 8 | AI Search History + Saved Search, AI Next Action (Brief Agent extension) |
| 9 | AI Recommendation Service Sequencing, AI Search Wizard ตัวกรองขั้นสูง |
| 10 | Market Intelligence Agent + UI ⭐, Country Intelligence Dashboard (metrics พื้นฐาน + card/table view) |
| 11 | Competitor Intelligence (Brief Agent extension), AI Aging Analysis (ต้องมีข้อมูล stage history สะสม ≥2-3 สัปดาห์แล้วจาก Phase 1A) |
| 12 | Export (Excel/CSV/Google Sheets + filter), Competitor Dashboard (Top/by Country/by Industry/Win-Loss) |
| 13 | Market Share ภายใน CRM + What-if Projection, ทดสอบรวม, เริ่มช่วง Baseline |

*หากต้องการยุบ Phase 1A+1B ให้เสร็จพร้อมกันตั้งแต่ launch แรก timeline รวมจะอยู่ที่ประมาณ 11-12 สัปดาห์แทน 6-7 สัปดาห์ — เป็น trade-off ที่ควรตัดสินใจร่วมกันก่อนเริ่มพัฒนาจริง*

## Phase 2: Baseline & Calibration (สัปดาห์ 14-17)

- เก็บข้อมูลการใช้งานจริง เทียบ KPI ก่อน/หลังตาม BRD
- ปรับ weight สูตรคะแนนจากผลจริง (ดู AI Agent Architecture §3.2)
- เก็บ feedback ฝ่ายขาย ปรับ UX จุดที่ใช้งานไม่คล่อง
- เมื่อเริ่มมี Deal ที่ Won สะสม → เปิดใช้ AI Similar Company (Phase 1.5 ตาม MVP Scope §1C)
- เมื่อมีดีลปิดแล้ว ≥5 ดีลต่อ segment → เปิดใช้ Sales Learning Agent pattern insights (Phase 1.5)
- เมื่อมี snapshot สะสมหลายเดือน → เปิดใช้ Competitor Trend และ Country Intelligence AI Insight/Heat Map (Phase 1.5)
- เริ่มประเมิน ROI เพื่อตัดสินใจ Phase ถัดไป

## Phase 3: Expansion (หลังพิสูจน์ผลสำเร็จ)

| ลำดับความสำคัญ | เพิ่มเติม |
|---|---|
| สูง | LINE OA / Email integration (รับ-ส่งสองทาง), AI แนะนำข้อความ follow-up |
| กลาง | LinkedIn/Alibaba/ImportYeti adapters (ประเมิน ToS/ต้นทุนอีกครั้งตามเวลานั้น) |
| กลาง | Auto-run scheduled prospecting (เปิดเป็น option ไม่บังคับ) |
| ต่ำ (รอสัญญาณธุรกิจ) | Multi-tenant SaaS, Billing, Public API สำหรับลูกค้าภายนอก |

## หลักการจัดลำดับงาน

1. ทำส่วนที่ "พิสูจน์คุณค่าหลัก" ก่อนเสมอ (AI หาลูกค้า + วิเคราะห์ + Dashboard) ก่อนฟีเจอร์เสริม
2. ทุกอย่างที่เลื่อนไป Phase 2/3 ต้องมี "ช่องเสียบ" ใน architecture ไว้แล้ว (ดู System Architecture §4) เพื่อไม่ต้อง rewrite
3. อย่าขยาย scope ระหว่าง Phase 1 แม้จะมีไอเดียเพิ่ม — บันทึกไว้ใน backlog สำหรับ Phase 2/3 แทน
