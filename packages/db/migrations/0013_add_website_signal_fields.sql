-- New fields for the website-behavior-based scoring rewrite of the Prospecting Agent.
-- lead_score (existing, from 0007) is reused as "Opportunity Score" — no need for a duplicate column.
alter table candidate_leads
  add column if not exists linkedin_url text,
  add column if not exists has_factory boolean,
  add column if not exists export_score int,
  add column if not exists logistics_score int;
