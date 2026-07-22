"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createDeal(companyId: string, formData: FormData) {
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

  const businessUnitId = formData.get("business_unit_id") as string;
  const serviceType = formData.get("service_type") as string;
  const valueEstimate = formData.get("value_estimate") as string;
  const weightKg = formData.get("weight_kg") as string;

  if (!businessUnitId || !serviceType) {
    throw new Error("กรุณาเลือก Business Unit และระบุบริการ");
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      organization_id: profile.organization_id,
      company_id: companyId,
      business_unit_id: businessUnitId,
      service_type: serviceType,
      value_estimate: valueEstimate ? Number(valueEstimate) : null,
      weight_kg: weightKg ? Number(weightKg) : null,
      current_owner_user_id: user.id,
    })
    .select("id")
    .single();

  if (error || !deal) throw new Error(`สร้างดีลไม่สำเร็จ: ${error?.message}`);

  await supabase.from("deal_stage_history").insert({
    organization_id: profile.organization_id,
    deal_id: deal.id,
    stage: "new",
  });

  revalidatePath(`/companies/${companyId}`);
}

export async function updateDealStage(dealId: string, companyId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const newStage = formData.get("stage") as string;
  if (!newStage) throw new Error("กรุณาเลือก Stage");

  const { data: profile } = await supabase
    .from("deals")
    .select("organization_id, stage")
    .eq("id", dealId)
    .single();
  if (!profile) throw new Error("ไม่พบดีล");

  if (profile.stage === newStage) {
    revalidatePath(`/companies/${companyId}`);
    return;
  }

  const updates: Record<string, unknown> = { stage: newStage, updated_at: new Date().toISOString() };

  if (newStage === "won" || newStage === "lost") {
    const outcomeReasonCategory = formData.get("outcome_reason_category") as string;
    const outcomeReasonDetail = formData.get("outcome_reason_detail") as string;
    const lostToCompetitorId = formData.get("lost_to_competitor_id") as string;

    if (outcomeReasonCategory) updates.outcome_reason_category = outcomeReasonCategory;
    if (outcomeReasonDetail) updates.outcome_reason_detail = outcomeReasonDetail;
    if (newStage === "lost" && lostToCompetitorId) {
      updates.lost_to_competitor_id = lostToCompetitorId;
    }
  }

  const { error } = await supabase.from("deals").update(updates).eq("id", dealId);

  if (error) throw new Error(`อัปเดต Stage ไม่สำเร็จ: ${error.message}`);

  const now = new Date().toISOString();

  await supabase
    .from("deal_stage_history")
    .update({ exited_at: now })
    .eq("deal_id", dealId)
    .is("exited_at", null);

  await supabase.from("deal_stage_history").insert({
    organization_id: profile.organization_id,
    deal_id: dealId,
    stage: newStage,
    entered_at: now,
  });

  revalidatePath(`/companies/${companyId}`);
}
