"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createCompanyManual(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ");

  const name = formData.get("name") as string;
  const country = formData.get("country") as string;
  const businessType = formData.get("business_type") as string;
  const website = formData.get("website") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name) throw new Error("กรุณากรอกชื่อบริษัท");

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      organization_id: profile.organization_id,
      name,
      country: country || null,
      business_type: businessType || null,
      website: website || null,
      email: email || null,
      phone: phone || null,
      source: "manual",
    })
    .select("id")
    .single();

  if (error || !company) throw new Error(`เพิ่มบริษัทไม่สำเร็จ: ${error?.message}`);

  redirect(`/companies/${company.id}`);
}

export async function deleteCompany(companyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const canDelete = profile?.role === "admin" || profile?.role === "sales_manager";
  if (!canDelete) throw new Error("คุณไม่มีสิทธิ์ลบบริษัท — ต้องเป็น Admin หรือ Sales Manager");

  // Deals/contacts/activities/tasks/quotations/documents cascade away with the company
  // (see packages/db/migrations/0008_cascade_company_delete.sql).
  const { error } = await supabase.from("companies").delete().eq("id", companyId);
  if (error) throw new Error(`ลบบริษัทไม่สำเร็จ: ${error.message}`);

  redirect("/companies");
}
