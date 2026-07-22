-- Allows deleting a company from the CRM without first manually deleting every related
-- deal/activity/task/quotation/document. Child records that only make sense in the context
-- of their company are cascaded away; candidate_leads.duplicate_of is set to null instead
-- (the original found-lead record should survive even if the company it became gets deleted).

alter table deals drop constraint if exists deals_company_id_fkey;
alter table deals add constraint deals_company_id_fkey
  foreign key (company_id) references companies(id) on delete cascade;

alter table activities drop constraint if exists activities_company_id_fkey;
alter table activities add constraint activities_company_id_fkey
  foreign key (company_id) references companies(id) on delete cascade;

alter table tasks drop constraint if exists tasks_company_id_fkey;
alter table tasks add constraint tasks_company_id_fkey
  foreign key (company_id) references companies(id) on delete cascade;

alter table quotations drop constraint if exists quotations_company_id_fkey;
alter table quotations add constraint quotations_company_id_fkey
  foreign key (company_id) references companies(id) on delete cascade;

alter table documents drop constraint if exists documents_company_id_fkey;
alter table documents add constraint documents_company_id_fkey
  foreign key (company_id) references companies(id) on delete cascade;

alter table candidate_leads drop constraint if exists candidate_leads_duplicate_of_fkey;
alter table candidate_leads add constraint candidate_leads_duplicate_of_fkey
  foreign key (duplicate_of) references companies(id) on delete set null;
