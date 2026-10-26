'use server';

import { requireAuth } from '@/lib/auth';
import { CHART_COLORS } from '@/lib/constants';
import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';
import {
  formatTypeLabel,
  formatMonthLabel,
  monthStart,
  addMonths,
  dayStart,
  formatDelta,
} from '@/lib/utils';

type ResourceRow = {
  id: string;
  title: string;
  material_type: string;
  published: boolean;
  created_at: string;
  subjects: any;
};

type ViewRow = {
  resource_id: string;
  user_id: string;
  viewed_at: string;
};

export async function getTeacherAnalyticsData() {
  const user = await requireAuth('teacher');
  const supabase = await createClient();

  const now = new Date();
  const currentMonthStart = monthStart(now);
  const lastMonthStart = addMonths(currentMonthStart, -1);
  const nextMonthStart = addMonths(currentMonthStart, 1);
  const weekStart = dayStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));

  const [resources, allViews, myResourceIdsData] = await Promise.all([
    fetchAllRows<ResourceRow>((from, to) =>
      supabase
        .from('resources')
        .select(
          `
          id,
          title,
          material_type,
          published,
          created_at,
          subjects(name)
        `,
        )
        .eq('created_by', user.id)
        .eq('is_active', true)
        .range(from, to),
    ),
    fetchAllRows<ViewRow>((from, to) =>
      supabase.from('resource_views').select('resource_id, user_id, viewed_at').range(from, to),
    ),
    fetchAllRows<{ id: string }>((from, to) =>
      supabase
        .from('resources')
        .select('id')
        .eq('created_by', user.id)
        .eq('is_active', true)
        .range(from, to),
    ),
  ]);

  const myResourceIds = new Set(myResourceIdsData.map((r) => r.id));
  const views = allViews.filter((v) => myResourceIds.has(v.resource_id));

  const totalViews = views.length;
  const resourcesPublished = resources.filter((r) => r.published).length;
  const totalUploads = resources.length;
  const pendingUploads = resources.filter((r) => !r.published).length;

  const viewsThisMonth = views.filter((v) => {
    const d = new Date(v.viewed_at);
    return d >= currentMonthStart && d < nextMonthStart;
  }).length;
  const viewsLastMonth = views.filter((v) => {
    const d = new Date(v.viewed_at);
    return d >= lastMonthStart && d < currentMonthStart;
  }).length;

  const uploadsThisMonth = resources.filter((r) => {
    const d = new Date(r.created_at);
    return d >= currentMonthStart && d < nextMonthStart;
  }).length;
  const uploadsLastMonth = resources.filter((r) => {
    const d = new Date(r.created_at);
    return d >= lastMonthStart && d < currentMonthStart;
  }).length;

  const publishedThisWeek = resources.filter((r) => {
    const d = new Date(r.created_at);
    return r.published && d >= weekStart;
  }).length;

  const stats = [
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: 'eye' as const,
      trend: `${formatDelta(viewsThisMonth - viewsLastMonth, 'vs last month')}`,
    },
    {
      label: 'Published',
      value: resourcesPublished.toLocaleString(),
      icon: 'check_circle' as const,
      trend: `${publishedThisWeek} this week`,
    },
    {
      label: 'Total Uploads',
      value: totalUploads.toLocaleString(),
      icon: 'upload' as const,
      trend: `${uploadsThisMonth} this month`,
    },
    {
      label: 'Pending Review',
      value: pendingUploads.toLocaleString(),
      icon: 'pending' as const,
      trend: 'Awaiting approval',
    },
  ];

  const monthKeys = Array.from({ length: 6 }, (_, i) => addMonths(currentMonthStart, i - 5));
  const monthlyActivity = monthKeys.map((m) => {
    const mStart = monthStart(m);
    const mEnd = addMonths(mStart, 1);
    return {
      month: formatMonthLabel(mStart),
      views: views.filter((v) => {
        const d = new Date(v.viewed_at);
        return d >= mStart && d < mEnd;
      }).length,
      uploads: resources.filter((r) => {
        const d = new Date(r.created_at);
        return d >= mStart && d < mEnd;
      }).length,
    };
  });

  const typeCount: Record<string, number> = {};
  for (const r of resources) typeCount[r.material_type] = (typeCount[r.material_type] || 0) + 1;
  const contentByType = Object.keys(typeCount)
    .sort((a, b) => typeCount[b] - typeCount[a])
    .map((key, i) => ({
      name: formatTypeLabel(key),
      value: typeCount[key],
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  const subjectCount: Record<string, number> = {};
  for (const r of resources) {
    const name = (r.subjects as any)?.name || 'Unknown';
    subjectCount[name] = (subjectCount[name] || 0) + 1;
  }
  const contentBySubject = Object.keys(subjectCount)
    .sort((a, b) => subjectCount[b] - subjectCount[a])
    .map((subject) => ({
      subject,
      count: subjectCount[subject],
    }));

  const dayBuckets = Array.from({ length: 7 }, (_, i) =>
    dayStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i))),
  );
  const dailyTrend = dayBuckets.map((day) => {
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayViews = views.filter((v) => {
      const d = new Date(v.viewed_at);
      return d >= day && d < dayEnd;
    });
    return {
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      views: dayViews.length,
      sessions: new Set(dayViews.map((v) => v.user_id)).size,
    };
  });

  const resourceViews: Record<string, number> = {};
  views.forEach((v) => {
    resourceViews[v.resource_id] = (resourceViews[v.resource_id] || 0) + 1;
  });

  const topResources = resources
    .map((r) => ({
      id: r.id,
      title: r.title,
      views: resourceViews[r.id] || 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return {
    stats,
    monthlyActivity,
    contentByType,
    contentBySubject,
    dailyTrend,
    topResources,
  };
}
