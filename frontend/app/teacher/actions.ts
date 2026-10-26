'use server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatTypeLabel } from '@/lib/utils';

export async function getTeacherSettingsData() {
  const user = await requireAuth('teacher');
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .eq('id', user.id)
    .single();

  return { profile };
}

export async function getTeacherDashboardData() {
  const user = await requireAuth('teacher');
  const supabase = await createClient();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const [
    { data: myUploadsData },
    { count: myUploadsCount },
    { count: myPendingCount },
    { count: myApprovedCount },
    { data: subjectsData },
  ] = await Promise.all([
    supabase
      .from('resources')
      .select(
        `
        id,
        book_id,
        title,
        material_type,
        created_at,
        published,
        page_count,
        subjects!inner (name),
        resource_grade_access (grade),
        resource_views!left (count)
      `,
      )
      .eq('created_by', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(0, 9999),
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('is_active', true),
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('published', false)
      .eq('is_active', true),
    supabase
      .from('resources')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('published', true)
      .eq('is_active', true),
    supabase.from('subjects').select('id, name').order('name'),
  ]);

  let totalViews = 0;
  const myUploads = (myUploadsData || []).map((r) => {
    // Count total views for this resource by counting view records
    const views =
      r.resource_views && Array.isArray(r.resource_views)
        ? r.resource_views.length // Each record = 1 view
        : 0;
    totalViews += views;

    let subjectName = 'Unknown';
    if (r.subjects && !Array.isArray(r.subjects) && typeof r.subjects === 'object') {
      subjectName = (r.subjects as any).name;
    }

    let grade = '-';
    if (
      r.resource_grade_access &&
      Array.isArray(r.resource_grade_access) &&
      r.resource_grade_access.length > 0
    ) {
      grade = r.resource_grade_access[0].grade.toString();
    }

    return {
      id: r.id,
      bookId: r.book_id || null,
      title: r.title,
      type: r.material_type ? formatTypeLabel(r.material_type) : 'Document',
      grade,
      subject: subjectName,
      uploadedAt: new Date(r.created_at).toISOString().split('T')[0],
      views,
      status: r.published ? 'approved' : 'pending',
      pages: r.page_count || 1,
    };
  });

  const recentActivity = myUploads.slice(0, 5).map((r) => ({
    action: `${r.title} ${r.status === 'approved' ? 'was approved' : 'is pending'}`,
    time: new Date(r.uploadedAt).toLocaleDateString(),
    type: r.status,
  }));

  const stats = [
    {
      label: 'Total Uploads',
      value: (myUploadsCount || 0).toString(),
      iconName: 'Upload',
      colorName: 'text-success',
      bgName: 'bg-success-muted',
    },
    {
      label: 'Total Views',
      value: totalViews.toString(),
      iconName: 'Eye',
      colorName: 'text-info',
      bgName: 'bg-info-muted',
    },
    {
      label: 'Approved',
      value: (myApprovedCount || 0).toString(),
      iconName: 'CheckCircle',
      colorName: 'text-success',
      bgName: 'bg-success-muted',
    },
    {
      label: 'Pending Review',
      value: (myPendingCount || 0).toString(),
      iconName: 'Clock',
      colorName: 'text-warning',
      bgName: 'bg-warning-muted',
    },
  ];

  const viewsPerMaterial = myUploads
    .map((r) => ({ name: r.title.substring(0, 10), views: r.views }))
    .sort((a, b) => b.views - a.views);

  return {
    profile,
    myUploads,
    stats,
    recentActivity,
    pendingCount: myPendingCount || 0,
    monthlyActivity: [{ month: 'Overall', views: totalViews }],
    viewsPerMaterial,
    subjectPerformance: [{ subject: 'Overall', views: totalViews, percentage: 100 }],
    last7DaysViews: [
      { day: 'Mon', views: 0 },
      { day: 'Tue', views: 0 },
      { day: 'Wed', views: 0 },
      { day: 'Thu', views: 0 },
      { day: 'Fri', views: 0 },
      { day: 'Sat', views: 0 },
      { day: 'Sun', views: totalViews },
    ],
    books: [] as any[],
    subjects: (subjectsData || []).map((s: any) => ({ id: s.id, name: s.name })),
  };
}
