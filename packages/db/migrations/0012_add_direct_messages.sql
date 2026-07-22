-- 1:1 real-time chat between users in the same org (an internal LINE replacement).
-- RLS here is deliberately NOT the org-wide "org_isolation_*" pattern used elsewhere —
-- a DM must only be visible to its two participants, not the whole organization.
create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  sender_id uuid not null references users(id),
  recipient_id uuid not null references users(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table direct_messages enable row level security;

create policy direct_messages_participants on direct_messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy direct_messages_send on direct_messages
  for insert with check (sender_id = auth.uid());

create policy direct_messages_mark_read on direct_messages
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- Enable Realtime so messages appear instantly without a page refresh.
alter publication supabase_realtime add table direct_messages;
