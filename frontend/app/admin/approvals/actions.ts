'use server';

import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';
import { formatBytes, formatRelativeTime, formatTypeLabel, formatGradeLabel } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

interface PendingApproval {
  id: string;
  title: string;
  teacher: string;
  subject: string;
  grade: string;
  type: string;
  submitted: string;
  pages: number;
  size: string;
}

interface RecentlyActioned {
  id: string;
  title: string;
  teacher: string;
  grade: string;
  pages: number;
  size: string;
  status: string;
  actionedAt: string;
}

export async function getApprovalsData() {
  const supabase = await createClient();

  const [pendingList, actionedList] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from('resources')
        .select(
          `
        id,
        title,
        material_type,
        file_size_bytes,
        page_count,
        created_at,
        subjects(name),
        profiles:created_by(full_name),
        resource_grade_access(grade)
      `,
        )
        .eq('published', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from('resources')
        .select(
          `
        id,
        title,
        material_type,
        file_size_bytes,
        page_count,
        updated_at,
        profiles:created_by(full_name),
        resource_grade_access(grade)
      `,
        )
        .eq('published', true)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .range(from, to),
    ),
  ]);

  const pendingApprovals: PendingApproval[] = pendingList.map((p: any) => ({
    id: p.id,
    title: p.title,
    teacher: (p.profiles as any)?.full_name || 'System',
    subject: (p.subjects as any)?.name || '-',
    grade: formatGradeLabel(p.resource_grade_access as any[]),
    type: formatTypeLabel(p.material_type),
    submitted: formatRelativeTime(p.created_at),
    pages: p.page_count || 0,
    size: formatBytes(p.file_size_bytes || 0),
  }));

  const recentlyActioned: RecentlyActioned[] = actionedList.map((a: any) => ({
    id: a.id,
    title: a.title,
    teacher: (a.profiles as any)?.full_name || 'System',
    grade: formatGradeLabel(a.resource_grade_access as any[]),
    pages: a.page_count || 0,
    size: formatBytes(a.file_size_bytes || 0),
    status: 'approved',
    actionedAt: formatRelativeTime(a.updated_at),
  }));

  return { initialApprovals: pendingApprovals, initialActioned: recentlyActioned };
}

export async function approveResource(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: resource, error } = await supabase
    .from('resources')
    .update({ published: true })
    .eq('id', id)
    .select('created_by')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/approvals');
  revalidatePath('/admin/library');
  revalidatePath('/admin/analytics');
  revalidatePath('/admin');

  // DB handles BOTH teacher approval and student notifications automatically via DB triggers.
  // - trg_notify_teacher_on_approval -> Sends 'approved' to teacher
  // - trg_students_on_resource_approval -> Sends 'new_material' to students

  const isOwnResource = resource?.created_by === user?.id;
  return { success: true, isOwnResource };
}

export async function rejectResource(id: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: resource, error } = await supabase
    .from('resources')
    .update({ is_active: false })
    .eq('id', id)
    .select('created_by')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // DB trigger handles teacher notification automatically.
  revalidatePath('/admin/approvals');
  revalidatePath('/admin');

  const isOwnResource = resource?.created_by === user?.id;
  return { success: true, isOwnResource };
}

export async function clearAllApprovals() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Approve all pending resources (published: false, is_active: true)
  const { data: resources, error } = await supabase
    .from('resources')
    .update({ published: true })
    .eq('published', false)
    .eq('is_active', true)
    .select('id, created_by');

  if (error) {
    return { success: false, error: error.message, count: 0 };
  }

  revalidatePath('/admin/approvals');
  revalidatePath('/admin/library');
  revalidatePath('/admin');

  // DB handles notifications automatically via triggers for all approved resources
  const approvedCount = resources?.length || 0;
  const ownResourcesCount = resources?.filter((r) => r.created_by === user?.id).length || 0;

  return {
    success: true,
    count: approvedCount,
    isOwnResources: ownResourcesCount > 0,
  };
}
