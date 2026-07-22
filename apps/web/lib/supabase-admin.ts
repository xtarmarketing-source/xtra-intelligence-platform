import { createClient } from "@supabase/supabase-js";

// Server-only — uses the service role key to call Supabase Auth admin APIs (creating users).
// Never import this from a client component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createSupabaseAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
