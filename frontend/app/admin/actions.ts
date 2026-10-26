'use server';

import { requireAuth } from '@/lib/auth';
import { CHART_COLORS } from '@/lib/constants';
import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database';
import type { AppRole } from '@/lib/types/database';
import { formatTypeLabel } from '@/lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Resource = Database['public']['Tables']['resources']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

interface PendingApproval {
  id: string;
  title: string;
  teacher: string;
  grade: string;
  type: string;
  submitted: string;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  book: string;
  grade: string;
  time: string;
  avatar: string;
}

export async function getAdminDashboardData() {
  const user = await requireAuth('admin');
  const supabase = await createClient();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const [
    { count: studentsCount },
    { count: resourcesCount },
    { count: viewsCount },
    { count: pendingCount },
    pendingApprovalsData,
    contentData,
    recentResources,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('is_active', true),
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('resource_views').select('*', { count: 'exact', head: true }),
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('published', false)
      .eq('is_active', true),
    supabase
      .from('resources')
      .select(
        `
        id,
        title,
        material_type,
        created_at,
        profiles:created_by (full_name),
        resource_grade_access (grade)
      `,
      )
      .eq('published', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5),
    fetchAllRows((from, to) =>
      supabase.from('resources').select('material_type').eq('is_active', true).range(from, to),
    ),
    supabase
      .from('resources')
      .select(
        `
        id,
        title,
        created_at,
        profiles:created_by (full_name),
        resource_grade_access (grade)
      `,
      )
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const stats = [
    {
      label: 'Active Students',
      value: (studentsCount || 0).toString(),
      trend: 'Current',
      icon: 'student' as const,
      positive: true,
    },
    {
      label: 'Resources',
      value: (resourcesCount || 0).toString(),
      trend: 'Total',
      icon: 'books' as const,
      positive: true,
    },
    {
      label: 'Total Views',
      value: (viewsCount || 0).toString(),
      trend: 'Lifetime',
      icon: 'eye' as const,
      positive: true,
    },
    {
      label: 'Pending Review',
      value: (pendingCount || 0).toString(),
      trend: pendingCount && pendingCount > 0 ? 'Needs action' : 'All caught up',
      icon: 'pending' as const,
      positive: pendingCount === 0,
    },
  ];

  const pendingApprovals: PendingApproval[] = (pendingApprovalsData.data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    teacher: (p.profiles as any)?.full_name || 'Unknown',
    grade: (p.resource_grade_access as any)?.[0]?.grade || '-',
    type: p.material_type,
    submitted: `${String(new Date(p.created_at).getDate()).padStart(2, '0')}/${String(
      new Date(p.created_at).getMonth() + 1,
    ).padStart(2, '0')}/${new Date(p.created_at).getFullYear()}`,
  }));

  const typeCount: Record<string, number> = {};
  const contentItems = Array.isArray(contentData) ? contentData : (contentData as any)?.data || [];
  contentItems.forEach((c: any) => {
    typeCount[c.material_type] = (typeCount[c.material_type] || 0) + 1;
  });

  const contentByType = Object.keys(typeCount).map((key, i) => ({
    name: formatTypeLabel(key),
    value: typeCount[key],
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const recentActivity: RecentActivity[] = (recentResources.data || []).map((r: any) => ({
    id: r.id,
    user: (r.profiles as any)?.full_name || 'System',
    action: 'uploaded',
    book: r.title,
    grade: (r.resource_grade_access as any)?.[0]?.grade || '-',
    time: `${String(new Date(r.created_at).getDate()).padStart(2, '0')}/${String(
      new Date(r.created_at).getMonth() + 1,
    ).padStart(2, '0')}/${new Date(r.created_at).getFullYear()}`,
    avatar: ((r.profiles as any)?.full_name?.[0] || 'S').toUpperCase(),
  }));

  const monthlyActivity = [
    { month: 'Jan', views: 0, uploads: 0 },
    { month: 'Feb', views: viewsCount || 0, uploads: resourcesCount || 0 },
  ];

  return {
    profile,
    stats,
    pendingApprovals,
    contentByType,
    recentActivity,
    monthlyActivity,
  };
}
