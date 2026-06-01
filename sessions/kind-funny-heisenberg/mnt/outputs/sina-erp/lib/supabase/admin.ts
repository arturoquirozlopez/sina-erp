import { createClient } from '@supabase/supabase-js';

/** Cliente con service role para operaciones administrativas (NUNCA exponer al browser). */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
