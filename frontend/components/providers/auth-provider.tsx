'use client';

import { getAuthenticatedProfile } from '@/app/actions';
import { AuthContext } from '@/lib/context/auth-context';
import type { User } from '@/lib/context/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { useState, useEffect, type ReactNode } from 'react';

const supabase = createClient();

/** Keys written to localStorage that must be wiped on sign-out. */
const AUTH_CACHE_KEYS = ['studyStreak', 'lastLoginDate'] as const;

function clearAuthCache() {
  if (typeof window === 'undefined') return;
  AUTH_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
}

function getCurrentPathname() {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

function isProtectedPortalPath(pathname: string) {
  return (
    pathname === '/student' ||
    pathname.startsWith('/student/') ||
    pathname === '/teacher' ||
    pathname.startsWith('/teacher/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  );
}

function computeStreak(lastLoginStr: string | null): { streak: number; today: string } {
  const today = new Date().toISOString().split('T')[0];
  const stored = parseInt(
    typeof window !== 'undefined' ? (localStorage.getItem('studyStreak') ?? '0') : '0',
    10,
  );
  if (!lastLoginStr) return { streak: 1, today };
  const diff = Math.floor(
    (new Date(today).getTime() - new Date(lastLoginStr).getTime()) / 86_400_000,
  );
  const streak = diff === 1 ? stored + 1 : diff > 1 ? 1 : stored;
  return { streak, today };
}

/**
 * Load the user profile via the server-side action.
 * Runs entirely on the server (cookie-based Supabase client) — no browser
 * navigator.locks involved, so it can never hang due to lock contention.
 */
async function fetchProfile(): Promise<User | null> {
  try {
    const profile = await getAuthenticatedProfile();
    if (!profile) return null;

    const lastLogin = typeof window !== 'undefined' ? localStorage.getItem('lastLoginDate') : null;
    const { streak, today } = computeStreak(lastLogin);

    if (typeof window !== 'undefined') {
      localStorage.setItem('lastLoginDate', today);
      localStorage.setItem('studyStreak', streak.toString());
    }

    return {
      id: profile.id,
      name: profile.fullName ?? profile.email.split('@')[0] ?? 'User',
      role: profile.role,
      grade: profile.grade ?? undefined,
      email: profile.email,
      studyStreak: streak,
      lastLoginDate: today,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, eventSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        clearAuthCache();
        supabase.removeAllChannels();
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // Silent token rotation — update the stored session token but skip
        // the profile DB round-trip since nothing about the user changed.
        if (eventSession) setSession(eventSession);
        return;
      }

      if (event === 'INITIAL_SESSION') {
        if (!eventSession) {
          // Check server-side cookies via fetchProfile before assuming logged out
          const profile = await fetchProfile();
          if (profile) {
            if (isMounted) {
              setUser(profile);
              setLoading(false);
            }
            return;
          }

          if (isProtectedPortalPath(getCurrentPathname())) {
            await supabase.auth.signOut();
          }
          if (isMounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
          }
          return;
        }

        setSession(eventSession);
        const profile = await fetchProfile();
        if (isMounted) {
          setUser(profile);
          setLoading(false);
        }
        return;
      }

      // SIGNED_IN / USER_UPDATED — refresh both session and profile.
      if (eventSession || event === 'SIGNED_IN') {
        if (eventSession) setSession(eventSession);
        const profile = await fetchProfile();
        if (isMounted) {
          setUser(profile);
          setLoading(false);
        }
      }
    });

    // Refresh the session when the tab comes back into view. Critical for
    // mobile browsers that suspend background tabs and may expire the token.
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      supabase.auth.getSession().then(async ({ data }) => {
        if (!isMounted) return;
        if (data.session) {
          setSession(data.session);
        } else if (isProtectedPortalPath(getCurrentPathname())) {
          const profile = await fetchProfile();
          if (profile) {
            setUser(profile);
          } else {
            setUser(null);
            setSession(null);
            clearAuthCache();
          }
        }
      });
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Global route guard
  useEffect(() => {
    if (!loading && !user && isProtectedPortalPath(getCurrentPathname())) {
      window.location.replace('/');
    }
  }, [loading, user]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    // Clear eagerly before signOut so caches are gone even if the
    // SIGNED_OUT event is delayed.
    clearAuthCache();
    supabase.removeAllChannels();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}
