const REQUIRED_ENV_ERROR =
  'Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.';

function normalizeEnvValue(value: string | undefined) {
  return value?.trim() || '';
}

export function getSupabaseConfig() {
  let url = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);

  // Server-side (Node.js/SSR inside Docker) needs to connect via host.docker.internal or internal network URL,
  // while client-side (browser) connects directly via localhost/127.0.0.1.
  if (typeof window === 'undefined') {
    const internalUrl = normalizeEnvValue(process.env.INTERNAL_SUPABASE_URL);
    if (internalUrl) {
      url = internalUrl;
    }
    if (url.includes('localhost')) {
      // Node.js server-side fetch attempts IPv6 ::1 first when given 'localhost',
      // which causes connection reset errors when Supabase is bound to IPv4 127.0.0.1.
      url = url.replace('localhost', '127.0.0.1');
    }
  }

  const publishableKey = normalizeEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!url || !publishableKey) {
    throw new Error(REQUIRED_ENV_ERROR);
  }

  return { url, publishableKey };
}

export function getSupabaseServiceRoleConfig() {
  const { url } = getSupabaseConfig();
  const secretKey = normalizeEnvValue(process.env.SUPABASE_SECRET_KEY);

  if (!secretKey) {
    throw new Error('Missing Supabase Secret Key configuration.');
  }

  return { url, secretKey };
}
