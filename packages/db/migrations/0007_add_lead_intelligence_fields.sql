alter table candidate_leads
  add column if not exists lead_score int,
  add column if not exists export_evidence jsonb not null default '[]',
  add column if not exists marketplace_platforms jsonb not null default '[]',
  add column if not exists recommended_logistics_service text,
  add column if not exists lead_reason text;
