-- Fix: the "private" schema (holding current_org_id()) was never granted
-- USAGE to the roles PostgREST actually queries as, so every RLS check
-- silently failed permission and returned zero rows instead of erroring.

grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.current_org_id() to anon, authenticated, service_role;
