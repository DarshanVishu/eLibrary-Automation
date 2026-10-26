import { getSupabaseConfig } from '@/lib/supabase/config';
import { createClient } from '@supabase/supabase-js';

// We do NOT pass a Database generic here so that arbitrary table names work
// without TypeScript complaining. Runtime safety is enforced by RLS policies.

export const supabase = createClient<any>(
  getSupabaseConfig().url,
  getSupabaseConfig().publishableKey,
);
