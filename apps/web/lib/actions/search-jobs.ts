"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createSearchJob(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ — ติดต่อ Admin");
  }

  const tradeDirection = formData.get("trade_direction") as string;
  const productCategories = formData.getAll("product_categories") as string[];
  const businessTypes = formData.getAll("business_types") as string[];

  // Each service checkbox value is encoded as "<business_unit_id>::<service name>"
  const serviceEntries = (formData.getAll("services") as string[]).map((v) => {
    const [businessUnitId, serviceName] = v.split("::");
    return { businessUnitId, serviceName };
  });

  if (
    !tradeDirection ||
    productCategories.length === 0 ||
    businessTypes.length === 0 ||
    serviceEntries.length === 0
  ) {
    throw new Error("กรุณาเลือกให้ครบทุกขั้นตอนที่บังคับ");
  }

  const { data: job, error } = await supabase
    .from("search_jobs")
    .insert({
      organization_id: profile.organization_id,
      requested_by: user.id,
      trade_direction: tradeDirection,
      business_types: businessTypes,
      services: serviceEntries.map((s) => s.serviceName),
      business_units: [...new Set(serviceEntries.map((s) => s.businessUnitId))],
      wizard_filters: { product_categories: productCategories },
      status: "queued",
    })
    .select("id")
    .single();

  if (error || !job) {
    throw new Error(`สร้าง Search Job ไม่สำเร็จ: ${error?.message}`);
  }

  redirect(`/prospecting/${job.id}`);
}
