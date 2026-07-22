"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const VALID_ROLES = ["admin", "sales_manager", "sales_rep", "executive"];

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
  if (profile.role !== "admin") throw new Error("เฉพาะ Admin เท่านั้นที่จัดการทีมงานได้");

  return { supabase, organizationId: profile.organization_id, currentUserId: user.id };
}

export async function inviteTeamMember(formData: FormData) {
  const { supabase, organizationId } = await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !role || !password) throw new Error("กรุณากรอกข้อมูลให้ครบ");
  if (!VALID_ROLES.includes(role)) throw new Error("บทบาทไม่ถูกต้อง");
  if (password.length < 8) throw new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");

  const admin = createSupabaseAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    throw new Error(`สร้างบัญชีเข้าสู่ระบบไม่สำเร็จ: ${authError?.message ?? "ไม่ทราบสาเหตุ"}`);
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: authUser.user.id,
    organization_id: organizationId,
    name,
    email,
    role,
    status: "active",
  });

  if (insertError) {
    // Roll back the auth account so we don't leave an orphaned login with no profile row.
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`บันทึกข้อมูลผู้ใช้ไม่สำเร็จ: ${insertError.message}`);
  }

  revalidatePath("/team");
}

export async function setTeamMemberStatus(memberId: string, formData: FormData) {
  const { supabase, currentUserId } = await requireAdmin();

  if (memberId === currentUserId) {
    throw new Error("ไม่สามารถปิดใช้งานบัญชีของตัวเองได้");
  }

  const status = formData.get("status") as string;
  if (!["active", "deactivated"].includes(status)) throw new Error("สถานะไม่ถูกต้อง");

  const { error } = await supabase.from("users").update({ status }).eq("id", memberId);
  if (error) throw new Error(`อัปเดตสถานะไม่สำเร็จ: ${error.message}`);

  revalidatePath("/team");
}
