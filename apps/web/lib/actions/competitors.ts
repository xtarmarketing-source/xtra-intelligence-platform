"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ");
  if (profile.role !== "admin") throw new Error("เฉพาะ Admin เท่านั้นที่จัดการคู่แข่งได้");

  return { supabase, organizationId: profile.organization_id };
}

export async function createCompetitor(formData: FormData) {
  const { supabase, organizationId } = await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("กรุณากรอกชื่อคู่แข่ง");

  const { error } = await supabase
    .from("competitors")
    .insert({ organization_id: organizationId, name });
  if (error) throw new Error(`เพิ่มคู่แข่งไม่สำเร็จ: ${error.message}`);

  revalidatePath("/competitors");
}

export async function setCompetitorActive(competitorId: string, isActive: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("competitors")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", competitorId);
  if (error) throw new Error(`อัปเดตสถานะคู่แข่งไม่สำเร็จ: ${error.message}`);

  revalidatePath("/competitors");
}
