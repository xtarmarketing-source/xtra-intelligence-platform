"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createDocument(companyId: string, formData: FormData) {
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

  const file = formData.get("file") as File | null;
  const fileNameInput = (formData.get("file_name") as string)?.trim();
  const fileUrlInput = (formData.get("file_url") as string)?.trim();

  let fileName: string;
  let fileUrl: string;
  let storagePath: string | null = null;

  if (file && file.size > 0) {
    storagePath = `${profile.organization_id}/${companyId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file);
    if (uploadError) throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ: ${uploadError.message}`);

    fileName = fileNameInput || file.name;
    fileUrl = storagePath; // resolved to a signed URL when the page renders
  } else if (fileUrlInput) {
    fileName = fileNameInput || fileUrlInput;
    fileUrl = fileUrlInput;
  } else {
    throw new Error("กรุณาเลือกไฟล์ที่จะอัปโหลด หรือวางลิงก์ไฟล์");
  }

  const { error } = await supabase.from("documents").insert({
    organization_id: profile.organization_id,
    company_id: companyId,
    file_name: fileName,
    file_url: fileUrl,
    storage_path: storagePath,
    uploaded_by: user.id,
  });

  if (error) throw new Error(`เพิ่มเอกสารไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}
