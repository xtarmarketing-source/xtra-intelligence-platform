import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createCompanyManual } from "@/lib/actions/companies";
import { BUSINESS_TYPES } from "@/lib/constants";

export default async function NewCompanyPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8 max-w-xl flex flex-col gap-6">
      <h1 className="text-brand text-xl font-extrabold">เพิ่มบริษัทเอง (Manual Entry)</h1>

      <form action={createCompanyManual} className="flex flex-col gap-3">
        <input
          name="name"
          placeholder="ชื่อบริษัท *"
          required
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="country"
          placeholder="ประเทศ"
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <select name="business_type" className="border border-line rounded-lg px-3 py-2 text-sm">
          <option value="">-- ประเภทธุรกิจ --</option>
          {BUSINESS_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          name="website"
          placeholder="เว็บไซต์"
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="อีเมล"
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="phone"
          placeholder="เบอร์โทร"
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-5 py-2.5 text-sm"
        >
          บันทึกบริษัท
        </button>
      </form>

      <a href="/companies" className="text-brand text-sm font-semibold">
        ← กลับไปหน้ารายชื่อบริษัท
      </a>
    </div>
  );
}
