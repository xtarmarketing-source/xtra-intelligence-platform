import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, role, organization_id")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-5xl px-8 py-8">
      <h1 className="text-brand text-xl font-extrabold">ภาพรวม — RNP Express และ PUKA Logistic</h1>
      <p className="text-ink-soft text-sm mt-2">
        สวัสดี, {profile?.name ?? user.email} ({profile?.role ?? "ไม่พบ role"})
      </p>
      <a
        href="/prospecting/new"
        className="inline-block mt-6 bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-5 py-2.5 text-sm"
      >
        AI Find Customers
      </a>
    </div>
  );
}
