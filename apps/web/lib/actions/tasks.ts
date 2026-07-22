"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createTask(companyId: string, formData: FormData) {
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

  const title = formData.get("title") as string;
  const dueDate = formData.get("due_date") as string;

  if (!title) throw new Error("กรุณากรอกชื่องาน");

  const { error } = await supabase.from("tasks").insert({
    organization_id: profile.organization_id,
    company_id: companyId,
    title,
    due_date: dueDate || null,
    assigned_to: user.id,
  });

  if (error) throw new Error(`สร้างงานไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}

export async function setTaskStatus(taskId: string, companyId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const newStatus = formData.get("status") as string;

  const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  if (error) throw new Error(`อัปเดตสถานะงานไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}

export async function reassignTask(taskId: string, companyId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const assignedTo = formData.get("assigned_to") as string;
  if (!assignedTo) throw new Error("กรุณาเลือกผู้รับผิดชอบ");

  const { error } = await supabase.from("tasks").update({ assigned_to: assignedTo }).eq("id", taskId);
  if (error) throw new Error(`ส่งต่องานไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}
