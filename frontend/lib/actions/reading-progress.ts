'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Persists reading progress for a resource and busts the analytics cache
 * so the admin daily/monthly view chart reflects up-to-date activity.
 */
export async function saveReadingProgress({
  resourceId,
  lastPage,
  progressPct,
}: {
  resourceId: string;
  lastPage: number;
  progressPct: number;
}) {
  const supabase = await createClient();
  const lastViewedAt = new Date().toISOString();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('reading_progress').upsert(
    {
      user_id: user.id,
      resource_id: resourceId,
      last_page: lastPage,
      progress_pct: progressPct,
      last_viewed_at: lastViewedAt,
    },
    { onConflict: 'user_id,resource_id' },
  );

  // Keep analytics in sync even if the dedicated view event call is missed:
  // record at most one view per user/resource/day.
  const now = new Date();
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
  const dayEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  ).toISOString();

  const { data: existingViews } = await supabase
    .from('resource_views')
    .select('id')
    .eq('user_id', user.id)
    .eq('resource_id', resourceId)
    .gte('viewed_at', dayStart)
    .lt('viewed_at', dayEnd)
    .limit(1);

  if (!existingViews || existingViews.length === 0) {
    await supabase.from('resource_views').insert({
      user_id: user.id,
      resource_id: resourceId,
    });
  }

  // Bust the analytics cache so daily/monthly view counts stay current
  revalidatePath('/admin/analytics');
}
