"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type Colleague = { id: string; name: string };

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export function ChatClient({
  currentUserId,
  currentUserName,
  organizationId,
  colleagues,
}: {
  currentUserId: string;
  currentUserName: string;
  organizationId: string;
  colleagues: Colleague[];
}) {
  const supabase = useRef(createSupabaseBrowserClient()).current;
  const [selected, setSelected] = useState<Colleague | null>(colleagues[0] ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial unread counts, so colleagues with a pending message show a badge before opened.
  useEffect(() => {
    supabase
      .from("direct_messages")
      .select("sender_id")
      .eq("recipient_id", currentUserId)
      .is("read_at", null)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const row of data ?? []) {
          counts[row.sender_id] = (counts[row.sender_id] ?? 0) + 1;
        }
        setUnreadByUser(counts);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime subscription — delivers only messages this user sends or receives (RLS-enforced).
  useEffect(() => {
    const channel = supabase
      .channel("direct_messages_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === currentUserId) return; // already shown optimistically when sent

          const openWith = selectedRef.current;
          if (openWith && msg.sender_id === openWith.id) {
            setMessages((prev) => [...prev, msg]);
            supabase.from("direct_messages").update({ read_at: new Date().toISOString() }).eq("id", msg.id).then();
          } else {
            setUnreadByUser((prev) => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] ?? 0) + 1 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load history + mark unread as read whenever the open conversation changes.
  useEffect(() => {
    if (!selected) return;

    supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${selected.id}),and(sender_id.eq.${selected.id},recipient_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
      });

    supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", selected.id)
      .eq("recipient_id", currentUserId)
      .is("read_at", null)
      .then(() => {
        setUnreadByUser((prev) => ({ ...prev, [selected.id]: 0 }));
      });
  }, [selected, currentUserId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !selected) return;

    setDraft("");
    setSendError(null);
    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        organization_id: organizationId,
        sender_id: currentUserId,
        recipient_id: selected.id,
        body,
      })
      .select()
      .single();

    if (error) {
      setSendError("ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setDraft(body);
      return;
    }

    setMessages((prev) => [...prev, data as Message]);
  }

  return (
    <div className="flex-1 flex border border-line rounded-2xl overflow-hidden bg-white shadow-sm min-h-0">
      <div className="w-56 flex-none border-r border-line overflow-y-auto">
        {colleagues.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c)}
            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
              selected?.id === c.id ? "bg-brand-tint text-brand font-bold" : "hover:bg-line-soft"
            }`}
          >
            <span>{c.name}</span>
            {!!unreadByUser[c.id] && (
              <span className="bg-brand text-white text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                {unreadByUser[c.id]}
              </span>
            )}
          </button>
        ))}
        {colleagues.length === 0 && (
          <p className="text-xs text-ink-soft p-4">ยังไม่มีเพื่อนร่วมงานคนอื่นในระบบ</p>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {selected ? (
          <>
            <div className="border-b border-line px-4 py-3">
              <span className="font-bold text-sm">{selected.name}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {messages.map((m) => {
                const isMine = m.sender_id === currentUserId;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        isMine ? "bg-brand text-white" : "bg-line-soft text-ink"
                      }`}
                    >
                      <div>{m.body}</div>
                      <div className={`text-[10px] mt-0.5 ${isMine ? "text-white/70" : "text-ink-soft"}`}>
                        {new Date(m.created_at).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="text-sm text-ink-soft text-center mt-6">
                  เริ่มคุยกับ {selected.name} ได้เลย
                </p>
              )}
              <div ref={bottomRef} />
            </div>
            {sendError && (
              <p className="text-xs text-brand px-3 pt-2">{sendError}</p>
            )}
            <form onSubmit={handleSend} className="border-t border-line p-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`พิมพ์ข้อความถึง ${selected.name}...`}
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-4 py-2 text-sm"
              >
                ส่ง
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-soft">
            เลือกเพื่อนร่วมงานทางซ้ายเพื่อเริ่มแชท ({currentUserName})
          </div>
        )}
      </div>
    </div>
  );
}
