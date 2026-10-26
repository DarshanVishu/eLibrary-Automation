'use server';

import { requireAuth } from '@/lib/auth';
import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';
import { formatRelativeTime } from '@/lib/utils';

interface StudentData {
  id: string;
  name: string;
  email: string;
  grade: number;
  rollNumber: string;
  avatar?: string;
  enrollmentDate: string;
  totalViews: number;
  materialsAccessed: number;
  lastActive: string;
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
  parentContact: string;
}

export async function getTeacherStudentsData(): Promise<{
  students: StudentData[];
  stats: {
    totalStudents: number;
    activeStudents: number;
    averageViews: number;
    excellentPerformers: number;
  };
  grades: string[];
}> {
  const user = await requireAuth('teacher');
  const supabase = await createClient();

  const { data: myResources } = await supabase
    .from('resources')
    .select('id, resource_grade_access(grade)')
    .eq('created_by', user.id)
    .eq('is_active', true)
    .eq('published', true);

  const myGrades = new Set(
    (myResources || [])
      .flatMap((r) => (r.resource_grade_access as any[]) || [])
      .map((g) => g.grade),
  );

  const gradesArray = Array.from(myGrades);

  const totalStudentsPromise = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .eq('is_active', true);

  const profilesPromise = fetchAllRows((from, to) =>
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
      .range(from, to),
  );

  const viewsPromise = fetchAllRows((from, to) =>
    supabase.from('resource_views').select('resource_id, user_id, viewed_at').range(from, to),
  );

  const [totalStudentsRes, profilesData, viewsData] = await Promise.all([
    totalStudentsPromise,
    profilesPromise,
    viewsPromise,
  ]);

  const resourceIds = new Set((myResources || []).map((r) => r.id));
  const viewsList = Array.isArray(viewsData) ? viewsData : (viewsData as any)?.data || [];
  const myViews = viewsList.filter(
    (v: { resource_id: string; user_id: string; viewed_at: string }) =>
      resourceIds.has(v.resource_id),
  );

  const studentViews: Record<string, number> = {};
  const studentMaterials: Record<string, Set<string>> = {};
  const studentLastActive: Record<string, string> = {};

  myViews.forEach((v: { resource_id: string; user_id: string; viewed_at: string }) => {
    studentViews[v.user_id] = (studentViews[v.user_id] || 0) + 1;
    if (!studentMaterials[v.user_id]) {
      studentMaterials[v.user_id] = new Set();
    }
    studentMaterials[v.user_id].add(v.resource_id);
    if (
      !studentLastActive[v.user_id] ||
      new Date(v.viewed_at) > new Date(studentLastActive[v.user_id])
    ) {
      studentLastActive[v.user_id] = v.viewed_at;
    }
  });

  const calculatePerformance = (views: number, materials: number): StudentData['performance'] => {
    const score = views * 0.6 + materials * 0.4;
    if (score >= 150) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 40) return 'average';
    return 'needs-improvement';
  };

  const profilesList = Array.isArray(profilesData)
    ? profilesData
    : (profilesData as any)?.data || [];
  const students: StudentData[] = profilesList.map((p: any) => {
    const views = studentViews[p.id] || 0;
    const materials = studentMaterials[p.id]?.size || 0;
    return {
      id: p.id,
      name: p.full_name || 'Unknown',
      email: p.email || '',
      grade: p.grade || 0,
      rollNumber: p.roll_number || p.id.slice(0, 8),
      avatar: p.avatar_url || undefined,
      enrollmentDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '-',
      totalViews: views,
      materialsAccessed: materials,
      lastActive: studentLastActive[p.id] ? formatRelativeTime(studentLastActive[p.id]) : 'Never',
      performance: calculatePerformance(views, materials),
      parentContact: p.parent_phone || '-',
    };
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const stats = {
    totalStudents: totalStudentsRes.count ?? students.length,
    activeStudents: students.filter((s) => {
      const raw = studentLastActive[s.id];
      if (!raw) return false;
      const lastActive = new Date(raw);
      return Number.isFinite(lastActive.getTime()) && lastActive > weekAgo;
    }).length,
    averageViews:
      students.length > 0
        ? Math.round(students.reduce((acc, s) => acc + s.totalViews, 0) / students.length)
        : 0,
    excellentPerformers: students.filter((s) => s.performance === 'excellent').length,
  };

  const gradesSet = new Set(students.map((s) => `${s.grade}A`));

  return {
    students,
    stats,
    grades: Array.from(gradesSet),
  };
}
