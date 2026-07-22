import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { signOutAction } from "@/lib/actions/auth";
import { Sidebar } from "./sidebar";
import type { Locale } from "@/lib/locale";

const NAV_LINKS = [
  { href: "/prospecting/new", label: "AI Find Customers", icon: "search" },
  { href: "/leads", label: "Lead Result", icon: "check" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/companies", label: "CRM", icon: "building" },
  { href: "/executive", label: "Executive Dashboard", icon: "chart" },
  { href: "/competitors", label: "Competitors", icon: "flag" },
  { href: "/marketing", label: "Marketing List", icon: "mail" },
  { href: "/insights", label: "Sales Learning", icon: "bulb" },
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const currentLocale = (cookieStore.get("locale")?.value as Locale | undefined) ?? "th";

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const canApprove = profile?.role === "admin" || profile?.role === "sales_manager";
  const today = new Date().toISOString().slice(0, 10);

  const [{ count: pendingLeadCount }, { count: dueTaskCount }, { count: unreadMessageCount }] =
    await Promise.all([
      canApprove
        ? supabase
            .from("candidate_leads")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending_review")
        : Promise.resolve({ count: 0 }),
      canApprove
        ? supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("status", "open")
            .lte("due_date", today)
        : Promise.resolve({ count: 0 }),
      supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null),
    ]);

  const navBadgeCount: Record<string, number> = {
    "/leads": pendingLeadCount ?? 0,
    "/companies": dueTaskCount ?? 0,
    "/chat": unreadMessageCount ?? 0,
  };

  const navLinks =
    profile?.role === "admin"
      ? [...NAV_LINKS, { href: "/team", label: "Team", icon: "team" }]
      : NAV_LINKS;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar
        navLinks={navLinks}
        navBadgeCount={navBadgeCount}
        currentLocale={currentLocale}
        signOutAction={signOutAction}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
