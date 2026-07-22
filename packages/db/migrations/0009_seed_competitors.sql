-- Seed starting competitor list per FR-19.2 — a starting point, not a fixed list.
-- Admin can add/deactivate more via the Competitors page; nothing here is hardcoded elsewhere.
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
    select 1 from competitors existing
    where existing.organization_id = o.id and existing.name = c.name
  );
