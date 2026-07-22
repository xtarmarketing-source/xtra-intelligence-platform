# Xtar — AI Sales Intelligence Platform

โปรเจกต์สำหรับ RNP Express และ PUKA Logistic — เอกสารออกแบบทั้งหมดอยู่ที่ [docs/00-INDEX.md](docs/00-INDEX.md)

## โครงสร้างโปรเจกต์

```
apps/web/         Next.js app (frontend + API routes)
packages/db/      Database migrations (SQL, รันบน Supabase)
packages/shared-types/   TypeScript types ที่ใช้ร่วมกัน
docs/             เอกสารออกแบบทั้งหมด (BRD, PRD, FR, ER Diagram ฯลฯ)
```

## เริ่มต้นใช้งาน (Quick Start)

### 1. เตรียม credential

ดูรายละเอียดเต็มที่ [docs/15-Setup-Checklist.md](docs/15-Setup-Checklist.md) — สรุปสิ่งที่ต้องมีก่อนรันได้จริง:

1. สร้างบัญชี [Supabase](https://supabase.com) → สร้าง Project ใหม่
2. สร้างบัญชี [Vercel](https://vercel.com) (สำหรับ deploy — ยังไม่จำเป็นตอนพัฒนาในเครื่อง)
3. ขอ API key จาก [Anthropic Console](https://console.anthropic.com)
4. เปิดใช้ Google Custom Search API ที่ [Google Cloud Console](https://console.cloud.google.com)
5. คิด username/password สำหรับ Perimeter Gate (ด่านก่อนหน้า Login)

### 2. ติดตั้ง dependencies

```bash
npm install
```

### 3. ตั้งค่า environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

แล้วกรอกค่าให้ครบตามที่ได้จาก Supabase/Anthropic/Google Cloud

### 4. รัน database migration

เปิด Supabase Dashboard → SQL Editor → รันไฟล์ทั้งหมดใน `packages/db/migrations/` **ตามลำดับเลขไฟล์**:
1. `0001_init.sql` — สร้างตารางทั้งหมด
2. `0002_auth_integration.sql` — ผูก RLS เข้ากับ Supabase Auth
3. `0006_fix_seed_and_admin.sql` — seed องค์กร/business unit/คู่แข่ง + สร้าง admin คนแรก (แทนที่ 0003-0005 ซึ่งรวมไว้ในไฟล์นี้แล้ว)

(ต้องสร้าง user ใน Supabase Auth Dashboard → Authentication → Users ก่อน แล้วเอา User UID มาแก้ในไฟล์ 0006 ตรงบรรทัด insert into users)

### 5. รันโปรเจกต์

```bash
npm run dev
```

เปิด http://localhost:3000 (ระบบจะ redirect ไปหน้า `/login` อัตโนมัติ)

หมายเหตุ: ถ้าตั้งค่า `PERIMETER_AUTH_USER`/`PERIMETER_AUTH_PASSWORD` ไว้ใน `.env.local` เบราว์เซอร์จะเด้งหน้าต่างขอ username/password ก่อนเห็นหน้า Login จริง (ตามที่ออกแบบไว้ใน [14-Security-Permission-Model.md](docs/14-Security-Permission-Model.md))

## สถานะปัจจุบัน

- [x] เอกสารออกแบบครบ 14 ฉบับ + Setup Checklist
- [x] Scaffold โปรเจกต์ (Next.js + Tailwind + brand tokens)
- [x] Perimeter Gate middleware
- [x] Database schema + RLS ครบทุกตาราง
- [x] Seed ข้อมูล (RNP Group, Business Units, Competitor Master, Admin user แรก)
- [x] Login เชื่อม Supabase Auth จริง — ทดสอบ end-to-end สำเร็จ (Kewalin Wangjai / admin)
- [ ] AI Search Wizard + Prospecting Agent
- [ ] CRM Core (Company/Contact/Deal)
- [ ] Executive Dashboard (ตัวจริง)

ดู [11-Development-Roadmap.md](docs/11-Development-Roadmap.md) สำหรับแผนงานเต็ม
