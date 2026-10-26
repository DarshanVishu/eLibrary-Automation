import { getSupabaseConfig } from '@/lib/supabase/config';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const { url, publishableKey } = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/';

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Step 1: apply cookies to the request so subsequent getAll() calls see them
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Step 2: create a fresh response forwarding the updated request
        supabaseResponse = NextResponse.next({ request });
        // Step 3: write the cookies into the response so the browser receives them
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser().catch((err) => ({ data: { user: null }, error: err }));

    if (error) {
      if (
        error.message?.includes('Refresh Token') ||
        error.code === 'refresh_token_not_found' ||
        error.status === 400
      ) {
        await supabase.auth.signOut().catch(() => {});
      }
    }

    // If an authenticated user hits the login page, redirect them to their portal
    if (user && isLoginPage) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const url = request.nextUrl.clone();
      if (profile?.role === 'admin') {
        url.pathname = '/admin';
      } else if (profile?.role === 'teacher') {
        url.pathname = '/teacher';
      } else {
        url.pathname = '/student';
      }
      return NextResponse.redirect(url);
    }

    // For role portals (/student, /admin, /teacher): do NOT redirect here even
    // if user is null. The session cookie may not be readable by the server
    // immediately after login due to cookie propagation timing. The client-side
    // AuthProvider is the reliable auth guard for these routes.
  } catch {
    // Supabase is unreachable - pass through and let the client handle auth
  }

  return supabaseResponse;
}
