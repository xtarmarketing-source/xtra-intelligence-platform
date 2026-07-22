"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function skipLead(leadId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  await supabase
    .from("candidate_leads")
    .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath("/leads");
}

export async function saveLead(leadId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  await supabase
    .from("candidate_leads")
    .update({ is_saved: true, assigned_to: user.id })
    .eq("id", leadId);

  revalidatePath("/leads");
}

export async function approveLead(leadId: string) {
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
    throw new Error("ไม่มีสิทธิ์อนุมัติ Lead — เฉพาะ Sales Manager หรือ Admin เท่านั้น");
  }

  const { data: lead } = await supabase
    .from("candidate_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) throw new Error("ไม่พบ Lead");

  const { error: companyError } = await supabase.from("companies").insert({
    organization_id: lead.organization_id,
    created_from_candidate_id: lead.id,
    name: lead.name,
    business_type: lead.business_type,
    website: lead.website,
    facebook_url: lead.facebook_url,
    email: lead.email,
    phone: lead.phone,
    country: lead.country,
    province_state: lead.province_state,
    employee_count_est: lead.employee_count_est,
    revenue_est: lead.revenue_est,
    export_markets: lead.export_markets,
    main_products: lead.main_products,
    logo_image_url: lead.logo_image_url,
    sources: lead.sources,
    source: "ai_prospecting",
  });

  if (companyError) throw new Error(`สร้างบริษัทไม่สำเร็จ: ${companyError.message}`);

  await supabase
    .from("candidate_leads")
    .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath("/leads");
}
