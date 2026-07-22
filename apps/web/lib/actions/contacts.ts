"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createContact(companyId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const name = formData.get("name") as string;
  const position = formData.get("position") as string;
  const roleType = formData.get("role_type") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name) throw new Error("กรุณากรอกชื่อผู้ติดต่อ");

  const { error } = await supabase.from("contacts").insert({
    company_id: companyId,
    name,
    position: position || null,
    role_type: roleType || null,
    email: email || null,
    phone: phone || null,
  });

  if (error) throw new Error(`เพิ่มผู้ติดต่อไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}

export async function updateContactConsent(
  contactId: string,
  companyId: string,
  formData: FormData
) {
  const supabase = await createSupabaseServerClient();

  const consent = formData.get("email_marketing_consent") as string;
  if (!["subscribed", "unsubscribed", "not_asked"].includes(consent)) {
    throw new Error("สถานะ consent ไม่ถูกต้อง");
  }

  const { error } = await supabase
    .from("contacts")
    .update({ email_marketing_consent: consent, consent_updated_at: new Date().toISOString() })
    .eq("id", contactId);

  if (error) throw new Error(`อัปเดตสถานะ consent ไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/marketing");
}
