'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Records a view when a student accesses a resource.
 * Called as a fire-and-forget Server Action from useMaterialData.
 */
export async function trackResourceView(resourceId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      return { error: 'Unauthorized' };
    }

    // Check if user can access this resource
    const { data: accessCheck } = await supabase.rpc('can_access_resource', {
      resource_id: resourceId,
    });

    if (!accessCheck) {
      return { error: 'Access denied' };
    }

    // Insert view record (unique constraint handles duplicates)
    const { error: insertError } = await supabase.from('resource_views').insert({
      user_id: user.id,
      resource_id: resourceId,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        // Already viewed — still a valid visit, no revalidation needed
        return { success: true, alreadyViewed: true };
      }
      return { error: insertError.message };
    }

    // Bust the analytics cache so the daily views chart reflects new activity
    revalidatePath('/admin/analytics');

    return { success: true };
  } catch {
    return { error: 'Failed to track view' };
  }
}
