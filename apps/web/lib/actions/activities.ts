"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const VALID_TYPES = ["call", "meeting", "email", "line_message", "note"];

export async function createActivity(companyId: string, formData: FormData) {
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

  const type = formData.get("type") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  if (!VALID_TYPES.includes(type)) throw new Error("ประเภทกิจกรรมไม่ถูกต้อง");

  const { error } = await supabase.from("activities").insert({
    organization_id: profile.organization_id,
    company_id: companyId,
    type,
    subject: subject || null,
    body: body || null,
    created_by: user.id,
  });

  if (error) throw new Error(`บันทึกกิจกรรมไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}
