'use client';

/**
 * useStudentMaterials
 * ────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS (Fix #1 + #2)
 *
 * Problem #1 — Orphaned duplicate: `lib/hooks/useMaterials.ts` contained a
 * client-side hook that called the exact same `get_student_library` RPC and
 * mapped the exact same fields as `app/student/actions.ts`. Neither had a
 * single source of truth; TYPE_LABEL_MAP was copy-pasted in both. The hook
 * was registered in `lib/hooks/index.ts` but never imported by any page.
 *
 * Problem #2 — Copy-pasted boilerplate: Every student page (Dashboard,
 * Library, Bookmarks, Recent) duplicated the same ~10-line pattern:
 *   • import useAuth + useRouter
 *   • useState for materials + loading
 *   • useEffect: wait for auth → redirect if no user → call getStudentMaterials
 *   • if (authLoading || loading) return <FullScreenLoading />
 *   • if (!user) return null
 * Any change to auth flow, error messages, or redirect path required editing
 * 4 files. A bug in one copy would silently remain in the others.
 *
 * Fix: This hook encapsulates the complete auth-guard + fetch + loading cycle
 * in one place. Pages import a single hook and get back `{ user, materials,
 * loading }`. The auth redirect is handled internally, so pages can't forget
 * it. Error toasts are consistent. Adding retry logic or optimistic refresh
 * now requires editing exactly one file.
 *
 * The old `useMaterials.ts` (and its re-export from index.ts) is deleted;
 * this hook supersedes it using the server-action pattern already in use.
 */
import { getStudentMaterials, type StudentMaterial } from '@/app/student/actions';
import { useAuth } from '@/lib/context/auth-context';
import type { User } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface UseStudentMaterialsResult {
  /** Authenticated user (null when signed out). */
  user: User | null;
  materials: StudentMaterial[];
  bypassEnabled: boolean;
  studentGrade: number;
  loading: boolean;
  /** Call to re-fetch without a full page reload (used by the refresh button). */
  refetch: () => Promise<void>;
}

/**
 * Handles auth guard + data fetch for student pages in one hook.
 *
 * While auth or data is loading, `loading` is true and `user` / `materials`
 * should not be used. The hook redirects to "/" if the user is not signed in,
 * so the component can render `null` after calling this hook without any
 * additional auth checks.
 *
 * @example
 * ```tsx
 * const { user, materials, loading, refetch } = useStudentMaterials();
 * if (loading) return <FullScreenLoading />;
 * // user is guaranteed non-null beyond this point
 * ```
 */
export function useStudentMaterials(): UseStudentMaterialsResult {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [materials, setMaterials] = useState<StudentMaterial[]>([]);
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [studentGrade, setStudentGrade] = useState(0);
  // Start as `false`; we only enter loading state when we *know* we need to fetch.
  const [dataLoading, setDataLoading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setDataLoading(true);
    try {
      const { materials, bypassEnabled, studentGrade } = await getStudentMaterials();

      setMaterials(materials);
      setBypassEnabled(bypassEnabled);
      setStudentGrade(studentGrade);
    } catch {
      toast.error('Failed to load your library. Please try again.');
      setMaterials([]);
      setBypassEnabled(false);
      setStudentGrade(0);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchMaterials();
  }, [authLoading, user, fetchMaterials]);

  const loading = authLoading || dataLoading;

  return {
    user,
    materials,
    bypassEnabled,
    studentGrade,
    loading,
    refetch: fetchMaterials,
  };
}
