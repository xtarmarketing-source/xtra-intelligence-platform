-- Consolidated fix: 0003_seed.sql was apparently never run, so 0004's
-- "insert admin user" matched zero organization rows and silently inserted
-- nothing. This re-runs everything needed and proves it with a final SELECT.

insert into organizations (name)
select 'RNP Group'
where not exists (select 1 from organizations where name = 'RNP Group');

insert into business_units (organization_id, code, name, services)
select o.id, 'RNP_EXPRESS', 'RNP Express', '["International Express", "Fulfillment"]'::jsonb
from organizations o
where o.name = 'RNP Group'
  and not exists (
    select 1 from business_units where organization_id = o.id and code = 'RNP_EXPRESS'
  );

insert into business_units (organization_id, code, name, services)
select o.id, 'PUKA_LOGISTIC', 'PUKA Logistic', '["Air Cargo", "Sea Freight", "Customs Clearance"]'::jsonb
from organizations o
where o.name = 'RNP Group'
  and not exists (
    select 1 from business_units where organization_id = o.id and code = 'PUKA_LOGISTIC'
  );

insert into competitors (organization_id, name)
select o.id, c.name
from organizations o
cross join (
  values
    ('DHL'), ('FedEx'), ('UPS'), ('Maersk'), ('DB Schenker'),
    ('Kuehne+Nagel'), ('Dimerco'), ('Nippon Express'), ('Yusen'),
    ('SCGJWD'), ('Kerry Logistics'), ('Local Forwarder')
) as c(name)
where o.name = 'RNP Group'
  and not exists (
    select 1 from competitors where organization_id = o.id and competitors.name = c.name
  );

insert into users (id, organization_id, name, email, role, status)
select
  '64803a6e-43d2-442b-9480-ba02cb8756ab'::uuid,
  o.id,
  'Kewalin Wangjai',
  'xtarmarketing@gmail.com',
  'admin',
  'active'
from organizations o
where o.name = 'RNP Group'
on conflict (id) do update set
  organization_id = excluded.organization_id,
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  status = excluded.status;

-- Proof: this MUST show exactly 1 row with Kewalin's info
select id, name, email, role, organization_id from users;
