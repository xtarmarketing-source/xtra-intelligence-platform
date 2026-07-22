"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createQuotation(companyId: string, formData: FormData) {
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

  const dealId = formData.get("deal_id") as string;
  const quoteNumber = formData.get("quote_number") as string;
  const serviceType = formData.get("service_type") as string;
  const amount = formData.get("amount") as string;

  if (!dealId || !serviceType) throw new Error("กรุณาเลือกดีลและระบุบริการ");

  const { error } = await supabase.from("quotations").insert({
    organization_id: profile.organization_id,
    company_id: companyId,
    deal_id: dealId,
    quote_number: quoteNumber || null,
    service_type: serviceType,
    amount: amount ? Number(amount) : null,
    status: "draft",
  });

  if (error) throw new Error(`สร้างใบเสนอราคาไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}

export async function updateQuotationStatus(
  quotationId: string,
  companyId: string,
  formData: FormData
) {
  const supabase = await createSupabaseServerClient();

  const newStatus = formData.get("status") as string;
  if (!["draft", "sent", "accepted", "rejected"].includes(newStatus)) {
    throw new Error("สถานะไม่ถูกต้อง");
  }

  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "sent") updates.issued_at = new Date().toISOString();

  const { error } = await supabase.from("quotations").update(updates).eq("id", quotationId);
  if (error) throw new Error(`อัปเดตสถานะใบเสนอราคาไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}

export async function requestQuotationApproval(quotationId: string, companyId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const { error } = await supabase
    .from("quotations")
    .update({ approval_status: "pending", requested_by: user.id, approved_by: null, approved_at: null })
    .eq("id", quotationId);
  if (error) throw new Error(`ส่งขออนุมัติไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}

export async function decideQuotationApproval(
  quotationId: string,
  companyId: string,
  formData: FormData
) {
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
  if (!profile || (profile.role !== "admin" && profile.role !== "sales_manager")) {
    throw new Error("เฉพาะ Sales Manager หรือ Admin เท่านั้นที่อนุมัติได้");
  }

  const decision = formData.get("decision") as string;
  if (!["approved", "rejected"].includes(decision)) throw new Error("คำตัดสินไม่ถูกต้อง");

  const { error } = await supabase
    .from("quotations")
    .update({ approval_status: decision, approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", quotationId);
  if (error) throw new Error(`บันทึกผลอนุมัติไม่สำเร็จ: ${error.message}`);

  revalidatePath(`/companies/${companyId}`);
}
