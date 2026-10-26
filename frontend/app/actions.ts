'use server';

import { createClient } from '@/lib/supabase/server';
import { getFriendlyError } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface AuthenticatedProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'teacher' | 'student';
  grade: number | null;
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const rememberMe = formData.get('rememberMe') === 'true';
  const loginStartedAt = Date.now();

  if (!email || !password) {
    return { error: 'Please enter both your email and password.' };
  }

  let supabase;
  let result;
  try {
    supabase = await createClient(rememberMe);
    const { error: checkError } = await supabase.auth
      .getUser()
      .catch((err) => ({ data: { user: null }, error: err }));
    if (
      checkError &&
      (checkError.message?.includes('Refresh Token') ||
        checkError.code === 'refresh_token_not_found' ||
        checkError.status === 400)
    ) {
      await supabase.auth.signOut().catch(() => {});
    }
    result = await supabase.auth.signInWithPassword({ email, password });
  } catch (err: any) {
    const friendly = getFriendlyError(err?.message ?? 'fetch failed');
    return { error: friendly };
  }

  if (result.error) {
    const friendly = getFriendlyError(result.error.message, result.error.status);
    return { error: friendly };
  }

  // Fetch role to redirect to the correct dashboard.
  // The supabase client already has the session from signInWithPassword above,
  // so the authenticated user can read their own profile row via RLS.
  const uid = result.data.user?.id;
  let destination = '/';
  if (uid) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single();

    if (profileError) {
      console.error('[login] profile query error:', profileError.message);
    }

    const roleMap: Record<string, string> = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
    };
    destination = roleMap[profile?.role ?? ''] ?? '/';
  }

  return { success: true, destination };
}

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser().catch((err) => ({ data: { user: null }, error: err }));

  if (userError) {
    if (
      userError.message?.includes('Refresh Token') ||
      userError.code === 'refresh_token_not_found' ||
      userError.status === 400
    ) {
      await supabase.auth.signOut().catch(() => {});
    }
    return null;
  }

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, grade, email')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: user.id,
    email: profile.email ?? user.email ?? '',
    fullName: profile.full_name ?? null,
    role: profile.role,
    grade: profile.grade ?? null,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export type ChangePasswordResult = { success: true } | { success: false; error: string };

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  if (!currentPassword || !newPassword) {
    return { success: false, error: 'Please fill in all fields.' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters.' };
  }

  if (currentPassword === newPassword) {
    return { success: false, error: 'New password must be different from the current password.' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: 'You must be logged in to change your password.' };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

  if (updateError) {
    return { success: false, error: 'Failed to update password. Please try again.' };
  }

  return { success: true };
}
