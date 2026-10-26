import { getSupabaseConfig } from '@/lib/supabase/config';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient(isPersistent: boolean = true) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const finalOptions = isPersistent ? options : { ...options, maxAge: undefined };
            cookieStore.set(name, value, finalOptions);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
