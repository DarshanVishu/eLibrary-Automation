'use server';

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

export async function getAnalyticsData(period: 'week' | 'month' | '6months' = 'month') {
  const supabase = await createClient();

  const now = new Date();
  const currentMonthStart = monthStart(now);
  const lastMonthStart = addMonths(currentMonthStart, -1);
  const nextMonthStart = addMonths(currentMonthStart, 1);
  const weekStart = dayStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const priorWeekStart = dayStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13));

  // Only fetch views from the past 6 months — sufficient for weekly/monthly
  // stats and all charts. Using gte() at the DB level keeps the result set
  // small even as the table grows past 50k rows.
  const sixMonthsAgo = addMonths(currentMonthStart, -5);

  const [
    { count: activeStudentsCount },
    { count: totalStudentsCount },
    { count: totalPublishedCount },
    { count: totalUploadsCount },
    studentProfiles,
    resources,
    viewsData,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('published', true),
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_active', true),
    fetchAllRows((from, to) =>
      supabase
        .from('profiles')
        .select('created_at, is_active')
        .eq('role', 'student')
        .range(from, to),
    ),
    fetchAllRows<ResourceRow>((from, to) =>
      supabase
        .from('resources')
        .select(
          `
            id,
            material_type,
            published,
            created_at,
            subjects(name)
          `,
        )
        .eq('is_active', true)
        .range(from, to),
    ),
    // Only last 6 months — enough for weekly, monthly, and 6-month chart windows
    fetchAllRows<ViewRow>((from, to) =>
      supabase
        .from('resource_views')
        .select('resource_id, user_id, viewed_at')
        .gte('viewed_at', sixMonthsAgo.toISOString())
        .range(from, to),
    ),
  ]);

  const activeResourceIds = new Set(resources.map((r) => r.id));
  const views = viewsData.filter((v) => activeResourceIds.has(v.resource_id));

  // Calculations across time windows
  const viewsThisWeek = views.filter((v) => new Date(v.viewed_at) >= weekStart).length;
  const viewsPriorWeek = views.filter((v) => {
    const d = new Date(v.viewed_at);
    return d >= priorWeekStart && d < weekStart;
  }).length;

  const viewsThisMonth = views.filter((v) => {
    const d = new Date(v.viewed_at);
    return d >= currentMonthStart && d < nextMonthStart;
  }).length;
  const viewsLastMonth = views.filter((v) => {
    const d = new Date(v.viewed_at);
    return d >= lastMonthStart && d < currentMonthStart;
  }).length;

  const activeReadersThisWeek = new Set(
    views.filter((v) => new Date(v.viewed_at) >= weekStart).map((v) => v.user_id),
  ).size;
  const activeReadersThisMonth = new Set(
    views
      .filter((v) => {
        const d = new Date(v.viewed_at);
        return d >= currentMonthStart && d < nextMonthStart;
      })
      .map((v) => v.user_id),
  ).size;

  const studentsThisMonth = studentProfiles.filter((p) => {
    const d = new Date(p.created_at);
    return d >= currentMonthStart && d < nextMonthStart;
  }).length;
  const studentsLastMonth = studentProfiles.filter((p) => {
    const d = new Date(p.created_at);
    return d >= lastMonthStart && d < currentMonthStart;
  }).length;
  const studentsThisWeek = studentProfiles.filter((p) => {
    const d = new Date(p.created_at);
    return d >= weekStart;
  }).length;

  const publishedThisWeek = resources.filter((r) => {
    const d = new Date(r.created_at);
    return r.published && d >= weekStart;
  }).length;
  const publishedThisMonth = resources.filter((r) => {
    const d = new Date(r.created_at);
    return r.published && d >= currentMonthStart && d < nextMonthStart;
  }).length;
  const totalPublished = totalPublishedCount ?? resources.filter((r) => r.published).length;

  const uploadsThisWeek = resources.filter((r) => new Date(r.created_at) >= weekStart).length;
  const uploadsThisMonth = resources.filter((r) => {
    const d = new Date(r.created_at);
    return d >= currentMonthStart && d < nextMonthStart;
  }).length;
  const totalUploads = totalUploadsCount ?? resources.length;
  const activeStudents = activeStudentsCount ?? 0;
  const totalStudents = totalStudentsCount ?? studentProfiles.length;

  // Dynamic stat cards based on selected period
  let stats: {
    label: string;
    value: string;
    icon: 'eye' | 'school' | 'book' | 'upload';
    trend: string;
  }[];

  if (period === 'week') {
    stats = [
      {
        label: 'Total Views',
        value: viewsThisWeek.toLocaleString(),
        icon: 'eye' as const,
        trend: `${formatDelta(viewsThisWeek - viewsPriorWeek, 'vs prior week')}`,
      },
      {
        label: 'Active Students',
        value: (activeReadersThisWeek || activeStudents).toLocaleString(),
        icon: 'school' as const,
        trend: `${studentsThisWeek} joined this week`,
      },
      {
        label: 'Resources Published',
        value: publishedThisWeek.toLocaleString(),
        icon: 'book' as const,
        trend: 'Past 7 days',
      },
      {
        label: 'Total Uploads',
        value: totalUploads.toLocaleString(),
        icon: 'upload' as const,
        trend: `+${uploadsThisWeek} this week`,
      },
    ];
  } else if (period === 'month') {
    stats = [
      {
        label: 'Total Views',
        value: viewsThisMonth.toLocaleString(),
        icon: 'eye' as const,
        trend: `${formatDelta(viewsThisMonth - viewsLastMonth, 'vs last month')}`,
      },
      {
        label: 'Active Students',
        value: (activeReadersThisMonth || activeStudents).toLocaleString(),
        icon: 'school' as const,
        trend: `${formatDelta(studentsThisMonth - studentsLastMonth, 'this month')}`,
      },
      {
        label: 'Resources Published',
        value: totalPublished.toLocaleString(),
        icon: 'book' as const,
        trend: `+${publishedThisMonth} this month`,
      },
      {
        label: 'Total Uploads',
        value: totalUploads.toLocaleString(),
        icon: 'upload' as const,
        trend: `+${uploadsThisMonth} this month`,
      },
    ];
  } else {
    // last 6 months
    stats = [
      {
        label: 'Total Views',
        value: views.length.toLocaleString(),
        icon: 'eye' as const,
        trend: `${viewsThisMonth.toLocaleString()} this month`,
      },
      {
        label: 'Active Students',
        value: activeStudents.toLocaleString(),
        icon: 'school' as const,
        trend: `${totalStudents.toLocaleString()} total registered`,
      },
      {
        label: 'Resources Published',
        value: totalPublished.toLocaleString(),
        icon: 'book' as const,
        trend: 'Last 6 months',
      },
      {
        label: 'Total Uploads',
        value: totalUploads.toLocaleString(),
        icon: 'upload' as const,
        trend: 'Last 6 months',
      },
    ];
  }

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

  return {
    stats,
    monthlyActivity,
    contentByType,
    contentBySubject,
    dailyTrend,
  };
}
