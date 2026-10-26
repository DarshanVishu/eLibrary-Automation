'use server';

import { requireAuth } from '@/lib/auth';
import { GET_PLATFORM_NAME_CACHE_TAG } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function adminPromoteStudents(): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth('admin');
    const supabase = await createClient();

    const { error } = await supabase.rpc('admin_promote_students');

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to promote students', error);
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function adminDemoteStudents(
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth('admin');
    if (!user || !user.email) {
      return { success: false, error: 'User email not found.' };
    }

    const supabase = await createClient();

    // Verify Password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      return { success: false, error: 'Incorrect password.' };
    }

    const { error } = await supabase.rpc('admin_demote_students');

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to demote students', error);
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function updatePlatformName(
  newName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth('admin');
    const supabase = await createClient();
    const trimmedName = newName.trim();

    if (!trimmedName) {
      return { success: false, error: 'Platform name cannot be empty' };
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('app_settings')
      .update({ platform_name: trimmedName })
      .eq('id', 1)
      .select('id')
      .maybeSingle();

    if (updateError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to update platform name', updateError);
      }
      return { success: false, error: updateError.message };
    }

    if (!updatedRow) {
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert({ id: 1, platform_name: trimmedName });

      if (insertError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to initialize platform name row', insertError);
        }
        return { success: false, error: insertError.message };
      }
    }

    // @ts-expect-error Next.js 15+ canary types incorrectly require a second profile argument for revalidateTag
    revalidateTag(GET_PLATFORM_NAME_CACHE_TAG);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function updateSchoolName(
  newName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth('admin');
    const supabase = await createClient();

    const { error } = await supabase
      .from('app_settings')
      .update({ school_name: newName.trim() || null })
      .eq('id', 1);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function updateGradeAccessBypass(
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth('admin');
    const supabase = await createClient();

    const { data: updatedRow, error: updateError } = await supabase
      .from('app_settings')
      .update({ allow_all_grades_access: enabled })
      .eq('id', 1)
      .select('id')
      .maybeSingle();

    if (updateError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to update access policy', updateError);
      }
      return { success: false, error: updateError.message };
    }

    if (!updatedRow) {
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert({ id: 1, allow_all_grades_access: enabled });

      if (insertError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to initialize app settings row', insertError);
        }
        return { success: false, error: insertError.message };
      }
    }

    // Invalidate caches for all student pages
    revalidatePath('/student', 'layout');
    revalidatePath('/student/library');
    revalidatePath('/student/bookmarks');
    revalidatePath('/student/recent');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update access policy.' };
  }
}

export async function getAdminSettingsData(): Promise<{
  platformName: string;
  schoolName: string;
  allowAllGradesAccess: boolean;
  error?: string;
}> {
  try {
    await requireAuth('admin');
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('platform_name, allow_all_grades_access, school_name')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      return {
        platformName: '',
        schoolName: '',
        allowAllGradesAccess: false,
        error: error.message,
      };
    }

    return {
      platformName: data?.platform_name || '',
      schoolName: (data as any)?.school_name || '',
      allowAllGradesAccess: !!data?.allow_all_grades_access,
    };
  } catch (err: any) {
    return {
      platformName: '',
      schoolName: '',
      allowAllGradesAccess: false,
      error: err.message || 'Failed to load settings',
    };
  }
}

