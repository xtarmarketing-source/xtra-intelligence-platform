-- Fix: RLS must key off the logged-in Supabase Auth user (auth.uid()),
-- not a session variable that PostgREST never sets per-request.

create schema if not exists private;

create or replace function private.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from users where id = auth.uid()
$$;

-- users.id must equal the Supabase Auth user id so auth.uid() lookups work
alter table users alter column id drop default;
alter table users
  add constraint users_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- organizations had no RLS at all — fix that
alter table organizations enable row level security;
create policy org_isolation_organizations on organizations using (
  id = private.current_org_id()
);

-- Replace every org_isolation_* policy that used current_setting('app.current_org')
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'business_units','users','competitors','search_jobs','companies','candidate_leads',
    'deals','deal_stage_history','activities','tasks','quotations','documents',
    'audit_logs','import_jobs','export_jobs','saved_searches','market_intelligence_snapshots','sales_insights'
  ])
  loop
    execute format('drop policy if exists org_isolation_%1$s on %1$s', t);
    execute format(
      'create policy org_isolation_%1$s on %1$s using (organization_id = private.current_org_id())',
      t
    );
  end loop;
end $$;

-- Tables scoped via parent company_id
drop policy if exists org_isolation_contacts on contacts;
create policy org_isolation_contacts on contacts using (
  company_id in (select id from companies where organization_id = private.current_org_id())
);

drop policy if exists org_isolation_competitor_intelligence on competitor_intelligence;
create policy org_isolation_competitor_intelligence on competitor_intelligence using (
  company_id in (select id from companies where organization_id = private.current_org_id())
);

drop policy if exists org_isolation_ai_briefs on ai_briefs;
create policy org_isolation_ai_briefs on ai_briefs using (
  company_id in (select id from companies where organization_id = private.current_org_id())
);

-- lead_scores is polymorphic (candidate_lead or company)
drop policy if exists org_isolation_lead_scores on lead_scores;
create policy org_isolation_lead_scores on lead_scores using (
  (subject_type = 'company' and subject_id in (
    select id from companies where organization_id = private.current_org_id()
  ))
  or
  (subject_type = 'candidate_lead' and subject_id in (
    select id from candidate_leads where organization_id = private.current_org_id()
  ))
);
