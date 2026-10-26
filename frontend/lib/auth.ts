'use server';

import { createClient } from '@/lib/supabase/server';
import type { AppRole } from '@/lib/types/database';
import { redirect } from 'next/navigation';

export async function requireAuth(expectedRole?: AppRole) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser().catch((err) => ({ data: { user: null }, error: err }));

  if (error || !user) {
    if (
      error &&
      (error.message?.includes('Refresh Token') ||
        error.code === 'refresh_token_not_found' ||
        error.status === 400)
    ) {
      await supabase.auth.signOut().catch(() => {});
    }
    redirect('/');
  }

  if (expectedRole) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== expectedRole) {
      redirect('/');
    }
  }

  return user;
}
