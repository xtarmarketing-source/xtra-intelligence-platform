import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { WizardForm } from "./wizard-form";

export default async function NewSearchJobPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: businessUnits } = await supabase
    .from("business_units")
    .select("id, name, services")
    .order("code");

  return (
    <div className="min-h-screen bg-line-soft/60">
      <div className="p-8 max-w-3xl">
        <h1 className="text-ink text-2xl font-extrabold">AI Search Wizard</h1>
        <p className="text-ink-soft text-sm mt-1 mb-6">
          ให้ AI ช่วยค้นหาลูกค้า B2B ใหม่ที่ตรงเป้าหมายให้อัตโนมัติ
        </p>
        <WizardForm businessUnits={businessUnits ?? []} />
      </div>
    </div>
  );
}
