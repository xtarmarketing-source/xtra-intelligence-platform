import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { importCompaniesCsv } from "@/lib/actions/import";

export default async function ImportCompaniesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8 max-w-xl flex flex-col gap-6">
      <h1 className="text-brand text-xl font-extrabold">นำเข้าบริษัทจาก CSV</h1>
      <p className="text-ink-soft text-sm">
        ไฟล์ CSV ต้องมีแถวแรกเป็นหัวตาราง อย่างน้อยต้องมีคอลัมน์{" "}
        <code className="bg-brand-tint px-1 rounded">name</code> — คอลัมน์ที่รองรับเพิ่มเติม: country,
        business_type, website, email, phone
      </p>

      <form action={importCompaniesCsv} className="flex flex-col gap-3">
        <input
          name="file"
          type="file"
          accept=".csv"
          required
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-5 py-2.5 text-sm"
        >
          นำเข้าข้อมูล
        </button>
      </form>

      <a href="/companies" className="text-brand text-sm font-semibold">
        ← กลับไปหน้ารายชื่อบริษัท
      </a>
    </div>
  );
}
