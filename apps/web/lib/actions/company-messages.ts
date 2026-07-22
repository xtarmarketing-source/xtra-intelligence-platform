"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createCompanyMessage(companyId: string, formData: FormData) {
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

  const body = (formData.get("body") as string)?.trim();
  if (!body) return;

  const { error } = await supabase.from("company_messages").insert({
    organization_id: profile.organization_id,
    company_id: companyId,
    sender_id: user.id,
    body,
  });

  if (error) throw new Error(`ส่งข้อความไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}
