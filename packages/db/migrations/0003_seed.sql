-- Seed: initial organization, business units, and competitor master data
-- Safe to re-run (guards against duplicate rows on repeated execution)

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
