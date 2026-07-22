-- Team chat scoped to a company (comment thread) — replaces ad-hoc LINE chats about a customer.
create table company_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  company_id uuid not null references companies(id) on delete cascade,
  sender_id uuid not null references users(id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table company_messages enable row level security;
create policy org_isolation_company_messages on company_messages using (
  organization_id = private.current_org_id()
);

-- Internal approval workflow for quotations, separate from the customer-facing status
-- (draft/sent/accepted/rejected). A Sales Rep requests approval; a Sales Manager/Admin approves.
alter table quotations
  add column if not exists approval_status text not null default 'not_requested'
    check (approval_status in ('not_requested', 'pending', 'approved', 'rejected')),
  add column if not exists requested_by uuid references users(id),
  add column if not exists approved_by uuid references users(id),
  add column if not exists approved_at timestamptz;
