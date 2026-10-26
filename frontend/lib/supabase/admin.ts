import { getSupabaseServiceRoleConfig } from '@/lib/supabase/config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function getServiceRoleClient() {
  const { url, secretKey } = getSupabaseServiceRoleConfig();

  return createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
