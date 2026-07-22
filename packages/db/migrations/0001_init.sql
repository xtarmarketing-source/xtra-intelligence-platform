-- Xtar initial schema — matches docs/07-Database-Design.md
create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  free_quota_companies_per_month int not null default 100,
  monthly_budget_cap numeric,
  created_at timestamptz not null default now()
);

create table business_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  name text not null,
  services jsonb not null default '[]'
);

create table users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'sales_manager', 'sales_rep', 'executive')),
  status text not null default 'active' check (status in ('active', 'deactivated')),
  created_at timestamptz not null default now()
);

create table competitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  is_active boolean not null default true,
  logo_url text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table search_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  requested_by uuid not null references users(id),
  trade_direction text not null check (trade_direction in ('export', 'import')),
  target_countries jsonb not null default '[]',
  business_types jsonb not null default '[]',
  services jsonb not null default '[]',
  business_units jsonb not null default '[]',
  wizard_filters jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  result_count int not null default 0,
  estimated_cost numeric,
  actual_cost numeric,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  created_from_candidate_id uuid,
  name text not null,
  business_type text,
  website text,
  facebook_url text,
  linkedin_url text,
  google_maps_url text,
  email text,
  phone text,
  country text,
  province_state text,
  employee_count_est int,
  revenue_est numeric,
  export_markets jsonb not null default '[]',
  main_products jsonb not null default '[]',
  hs_codes jsonb not null default '[]',
  has_factory boolean,
  logo_image_url text,
  sources jsonb not null default '[]',
  source text not null default 'manual' check (source in ('ai_prospecting', 'import', 'manual')),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table candidate_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  search_job_id uuid not null references search_jobs(id),
  name text not null,
  business_type text,
  website text,
  facebook_url text,
  email text,
  phone text,
  country text,
  province_state text,
  employee_count_est int,
  revenue_est numeric,
  export_markets jsonb not null default '[]',
  main_products jsonb not null default '[]',
  logo_image_url text,
  raw_source_data jsonb not null default '{}',
  sources jsonb not null default '[]',
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  is_saved boolean not null default false,
  assigned_to uuid references users(id),
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  duplicate_of uuid references companies(id),
  created_at timestamptz not null default now()
);

alter table companies
  add constraint companies_created_from_candidate_fk
  foreign key (created_from_candidate_id) references candidate_leads(id);

create table lead_scores (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('candidate_lead', 'company')),
  subject_id uuid not null,
  opportunity_score int,
  lead_score int,
  difficulty_score int,
  revenue_potential int,
  competition_level int,
  shipping_potential int,
  export_potential int,
  import_potential int,
  evidence jsonb not null default '[]',
  reasoning jsonb not null default '{}',
  model_version text,
  computed_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  position text,
  role_type text check (role_type in ('owner', 'export_manager', 'sales_manager', 'procurement', 'logistics', 'other')),
  email text,
  phone text,
  line_id text,
  is_primary boolean not null default false,
  email_marketing_consent text not null default 'not_asked' check (email_marketing_consent in ('subscribed', 'unsubscribed', 'not_asked')),
  consent_updated_at timestamptz
);

create table deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  company_id uuid not null references companies(id),
  business_unit_id uuid not null references business_units(id),
  service_type text not null,
  stage text not null default 'new' check (stage in ('new', 'contacted', 'qualified', 'quoted', 'negotiation', 'won', 'lost')),
  value_estimate numeric,
  currency text not null default 'THB',
  probability int,
  current_owner_user_id uuid references users(id),
  expected_close_date date,
  last_activity_at timestamptz,
  outcome_reason_category text check (outcome_reason_category in ('price', 'competitor_incumbent', 'transit_time', 'service_mismatch', 'relationship', 'other')),
  lost_to_competitor_id uuid references competitors(id),
  outcome_reason_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  deal_id uuid not null references deals(id) on delete cascade,
  stage text not null,
  entered_at timestamptz not null default now(),
  exited_at timestamptz
);

create table competitor_intelligence (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  predicted_competitor_id uuid references competitors(id),
  confidence_score int,
  confidence_level text check (confidence_level in ('low', 'medium', 'high')),
  evidence jsonb not null default '[]',
  why_this_prediction text,
  competitor_strengths jsonb not null default '[]',
  competitor_weaknesses jsonb not null default '[]',
  recommended_strategy text,
  recommended_service_first text,
  model_version text,
  generated_at timestamptz not null default now(),
  is_stale boolean not null default false
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  company_id uuid not null references companies(id),
  deal_id uuid references deals(id),
  contact_id uuid references contacts(id),
  type text not null check (type in ('call', 'meeting', 'email', 'line_message', 'note', 'task_completed', 'quotation', 'document', 'invoice', 'shipment_update', 'system')),
  subject text,
  body text,
  occurred_at timestamptz not null default now(),
  created_by uuid references users(id),
  metadata jsonb not null default '{}'
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  company_id uuid not null references companies(id),
  deal_id uuid references deals(id),
  title text not null,
  due_date date,
  assigned_to uuid references users(id),
  status text not null default 'open' check (status in ('open', 'done')),
  source text not null default 'manual' check (source in ('manual', 'ai_suggested')),
  reminder_at timestamptz
);

create table quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  company_id uuid not null references companies(id),
  deal_id uuid references deals(id),
  quote_number text,
  service_type text,
  amount numeric,
  currency text not null default 'THB',
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  issued_at timestamptz,
  file_url text
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  company_id uuid not null references companies(id),
  deal_id uuid references deals(id),
  file_name text not null,
  file_url text not null,
  uploaded_by uuid references users(id),
  uploaded_at timestamptz not null default now()
);

create table ai_briefs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  content jsonb not null default '{}',
  model_version text,
  generated_at timestamptz not null default now(),
  is_stale boolean not null default false
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  actor_user_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  source_type text not null check (source_type in ('excel', 'csv', 'google_sheets')),
  uploaded_by uuid references users(id),
  file_name text,
  column_mapping jsonb not null default '{}',
  default_duplicate_strategy text not null default 'create_new' check (default_duplicate_strategy in ('create_new', 'skip', 'merge', 'update_existing')),
  status text not null default 'queued',
  row_count int,
  duplicate_count int,
  created_at timestamptz not null default now()
);

create table export_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  requested_by uuid references users(id),
  format text not null check (format in ('xlsx', 'csv', 'google_sheets')),
  export_type text not null default 'companies' check (export_type in ('companies', 'marketing_list')),
  filters jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  row_count int,
  file_url text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  created_by uuid references users(id),
  name text not null,
  params jsonb not null default '{}',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table market_intelligence_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  requested_by uuid references users(id),
  country text not null,
  industry_breakdown jsonb not null default '{}',
  total_companies int,
  new_leads_count int,
  competition_level text check (competition_level in ('low', 'medium', 'high')),
  generated_at timestamptz not null default now()
);

create table sales_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  scope_type text not null,
  scope_key jsonb not null default '{}',
  insight_type text not null check (insight_type in ('win_pattern', 'loss_pattern', 'market_response')),
  insight_text text not null,
  supporting_deal_count int not null,
  confidence_score int,
  generated_at timestamptz not null default now()
);

-- Row-Level Security: tables with a direct organization_id column
alter table business_units enable row level security;
alter table users enable row level security;
alter table competitors enable row level security;
alter table search_jobs enable row level security;
alter table companies enable row level security;
alter table candidate_leads enable row level security;
alter table deals enable row level security;
alter table deal_stage_history enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table quotations enable row level security;
alter table documents enable row level security;
alter table audit_logs enable row level security;
alter table import_jobs enable row level security;
alter table export_jobs enable row level security;
alter table saved_searches enable row level security;
alter table market_intelligence_snapshots enable row level security;
alter table sales_insights enable row level security;

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
    execute format(
      'create policy org_isolation_%1$s on %1$s using (organization_id = current_setting(''app.current_org'', true)::uuid)',
      t
    );
  end loop;
end $$;

-- Tables without a direct organization_id column: scope via parent company_id
alter table contacts enable row level security;
create policy org_isolation_contacts on contacts using (
  company_id in (select id from companies where organization_id = current_setting('app.current_org', true)::uuid)
);

alter table competitor_intelligence enable row level security;
create policy org_isolation_competitor_intelligence on competitor_intelligence using (
  company_id in (select id from companies where organization_id = current_setting('app.current_org', true)::uuid)
);

alter table ai_briefs enable row level security;
create policy org_isolation_ai_briefs on ai_briefs using (
  company_id in (select id from companies where organization_id = current_setting('app.current_org', true)::uuid)
);

-- lead_scores is polymorphic (candidate_lead or company) — scope via either parent
alter table lead_scores enable row level security;
create policy org_isolation_lead_scores on lead_scores using (
  (subject_type = 'company' and subject_id in (
    select id from companies where organization_id = current_setting('app.current_org', true)::uuid
  ))
  or
  (subject_type = 'candidate_lead' and subject_id in (
    select id from candidate_leads where organization_id = current_setting('app.current_org', true)::uuid
  ))
);
