import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function MarketingListPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email, position, companies(name, country)")
    .eq("email_marketing_consent", "subscribed")
    .not("email", "is", null)
    .order("name");

  return (
    <div className="p-8 max-w-3xl flex flex-col gap-4">
      <h1 className="text-brand text-xl font-extrabold">Email Marketing List</h1>
      <p className="text-ink-soft text-sm">
        รายชื่อผู้ติดต่อที่ "สมัครรับข่าวสาร" เท่านั้น — ระบบตัดผู้ที่ยกเลิกรับข่าวสารออกให้อัตโนมัติตามข้อกำหนด PDPA
        ({contacts?.length ?? 0} รายชื่อ)
      </p>

      <div className="border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-tint text-left">
            <tr>
              <th className="px-4 py-2 font-bold">ชื่อ</th>
              <th className="px-4 py-2 font-bold">อีเมล</th>
              <th className="px-4 py-2 font-bold">บริษัท</th>
              <th className="px-4 py-2 font-bold">ประเทศ</th>
            </tr>
          </thead>
          <tbody>
            {(contacts ?? []).map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.email}</td>
                <td className="px-4 py-2">
                  {(c.companies as unknown as { name: string } | null)?.name ?? "-"}
                </td>
                <td className="px-4 py-2">
                  {(c.companies as unknown as { country: string } | null)?.country ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(contacts ?? []).length === 0 && (
          <p className="text-sm text-ink-soft p-4">
            ยังไม่มีผู้ติดต่อที่สมัครรับข่าวสาร — ไปตั้งค่าที่หน้ารายละเอียดบริษัทแต่ละแห่ง
          </p>
        )}
      </div>
    </div>
  );
}
