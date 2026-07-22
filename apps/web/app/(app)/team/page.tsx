import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { inviteTeamMember, setTeamMemberStatus } from "@/lib/actions/team";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_rep: "Sales Rep",
  executive: "Executive",
};

export default async function TeamPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return (
      <div className="p-8 max-w-3xl">
        <p className="text-sm text-ink-soft">หน้านี้เฉพาะ Admin เท่านั้น</p>
      </div>
    );
  }

  const { data: members } = await supabase
    .from("users")
    .select("id, name, email, role, status, created_at")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-4 sm:p-8 max-w-3xl flex flex-col gap-4">
      <h1 className="text-brand text-xl font-extrabold">จัดการทีม (Team)</h1>
      <p className="text-ink-soft text-sm">
        เพิ่ม/ปิดใช้งานพนักงานที่เข้าใช้งานระบบนี้ได้ ทั้งหมด {members?.length ?? 0} คน
      </p>

      <div className="flex flex-col gap-2">
        {(members ?? []).map((m) => (
          <div
            key={m.id}
            className="border border-line rounded-xl p-3 text-sm flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className={`font-bold ${m.status === "deactivated" ? "text-ink-soft line-through" : ""}`}>
                {m.name}
                {m.id === user.id && <span className="text-brand text-xs font-normal ml-1.5">(คุณ)</span>}
              </div>
              <div className="text-ink-soft text-xs break-words">
                {m.email} · {ROLE_LABEL[m.role] ?? m.role}
              </div>
            </div>
            {m.id !== user.id && (
              <form action={setTeamMemberStatus.bind(null, m.id)} className="flex-none">
                <input
                  type="hidden"
                  name="status"
                  value={m.status === "active" ? "deactivated" : "active"}
                />
                <button
                  type="submit"
                  className="border border-line rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-line-soft whitespace-nowrap"
                >
                  {m.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </form>
            )}
          </div>
        ))}
        {(members ?? []).length === 0 && <p className="text-sm text-ink-soft">ยังไม่มีพนักงานในระบบ</p>}
      </div>

      <form
        action={inviteTeamMember}
        className="border border-line rounded-xl p-4 flex flex-col gap-2 mt-2"
      >
        <span className="text-xs font-bold text-ink-soft">เพิ่มพนักงานใหม่</span>
        <input
          name="name"
          placeholder="ชื่อ-นามสกุล"
          required
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="อีเมล (ใช้ล็อกอิน)"
          required
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <select name="role" required className="border border-line rounded-lg px-3 py-2 text-sm">
          <option value="">-- เลือกบทบาท --</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="password"
          type="password"
          placeholder="รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัวอักษร)"
          required
          minLength={8}
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-ink-soft">
          บอกรหัสผ่านนี้ให้พนักงานใหม่โดยตรง — พนักงานสามารถเปลี่ยนรหัสผ่านเองภายหลังผ่านหน้า
          &ldquo;ลืมรหัสผ่าน?&rdquo; ที่หน้า Login ได้
        </p>
        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
        >
          เพิ่มพนักงาน
        </button>
      </form>
    </div>
  );
}
