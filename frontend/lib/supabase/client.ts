import { getSupabaseConfig } from '@/lib/supabase/config';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

type LockAcquire = <T>(name: string, acquireTimeout: number, fn: () => Promise<T>) => Promise<T>;

const bypassedLock = Symbol('supabase-auth-lock-bypassed');

const nonBlockingAuthLock: LockAcquire = async <T>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>,
) => {
  if (typeof navigator === 'undefined' || !navigator.locks?.request) {
    return fn();
  }

  try {
    const result = await navigator.locks.request(
      name,
      { mode: 'exclusive', ifAvailable: true },
      async (lock) => {
        if (!lock) return bypassedLock;
        return fn();
      },
    );

    if (result === bypassedLock) {
      // Avoid deadlocks on mobile/cross-tab contention: continue without waiting.
      return fn();
    }

    return result as T;
  } catch {
    return fn();
  }
};

export function createClient() {
  if (client) return client;
  const { url, publishableKey } = getSupabaseConfig();

  // Read persistence preference, default to 'session' (off)
  const isPersistent =
    typeof window !== 'undefined'
      ? localStorage.getItem('auth_persistence') === 'persistent'
      : false;

  // Keep browser + server auth in sync via cookies (required for middleware + server actions).
  client = createBrowserClient(url, publishableKey, {
    auth: {
      lock: nonBlockingAuthLock,
    },
    cookieOptions: {
      // If persistent, set 1 year. If session, don't pass maxAge to create a session cookie.
      maxAge: isPersistent ? 31536000 : undefined,
    },
  });

  return client;
}
