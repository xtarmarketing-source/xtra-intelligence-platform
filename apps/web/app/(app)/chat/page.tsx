import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ChatClient } from "./chat-client";

export default async function ChatPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ");
  }

  const { data: colleagues } = await supabase
    .from("users")
    .select("id, name")
    .eq("organization_id", profile.organization_id)
    .eq("status", "active")
    .neq("id", user.id)
    .order("name");

  return (
    <div className="max-w-5xl px-8 py-8 flex flex-col gap-4 h-screen">
      <h1 className="text-brand text-xl font-extrabold">แชท — คุยกับทีมแบบทันที</h1>
      <ChatClient currentUserId={user.id} currentUserName={profile.name} colleagues={colleagues ?? []} />
    </div>
  );
}
