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
