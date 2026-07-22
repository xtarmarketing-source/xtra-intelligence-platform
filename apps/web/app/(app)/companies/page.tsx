import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DeleteCompanyButton } from "./delete-company-button";

export default async function CompaniesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const canDelete = profile?.role === "admin" || profile?.role === "sales_manager";

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, country, business_type, website")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-3xl flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-brand text-xl font-extrabold">บริษัทลูกค้า (CRM)</h1>
        <div className="flex gap-2">
          <a
            href="/api/companies/export"
            className="border border-brand text-brand hover:bg-brand-tint font-bold rounded-lg px-4 py-2 text-sm"
          >
            ส่งออก CSV
          </a>
          <a
            href="/companies/import"
            className="border border-brand text-brand hover:bg-brand-tint font-bold rounded-lg px-4 py-2 text-sm"
          >
            นำเข้า CSV
          </a>
          <a
            href="/companies/new"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            + เพิ่มบริษัทเอง
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {(companies ?? []).map((c) => (
          <div
            key={c.id}
            className="border border-line rounded-xl p-4 text-sm hover:border-brand transition-colors flex items-center justify-between gap-3"
          >
            <a href={`/companies/${c.id}`} className="flex-1 min-w-0">
              <div className="font-bold">{c.name}</div>
              <div className="text-ink-soft text-xs mt-1">
                {c.country ?? "-"} · {c.business_type ?? "-"}
              </div>
            </a>
            {canDelete && (
              <DeleteCompanyButton
                companyId={c.id}
                companyName={c.name}
                className="flex-none border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-xs font-semibold"
              />
            )}
          </div>
        ))}
        {(companies ?? []).length === 0 && (
          <p className="text-sm text-ink-soft">
            ยังไม่มีบริษัทในระบบ — ไปที่ Lead Result เพื่ออนุมัติ Lead เข้า CRM
          </p>
        )}
      </div>
    </div>
  );
}
