'use server';

import { getServiceRoleClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database';
import type { AppRole } from '@/lib/types/database';
import { revalidatePath } from 'next/cache';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface User {
  id: string;
  name: string;
  role: AppRole;
  grade: number | null;
  email: string | null;
  status: 'active' | 'inactive';
  lastActive: string;
}

export interface UsersStats {
  total: number;
  student: number;
  teacher: number;
  admin: number;
  active: number;
  inactive: number;
}

export interface UsersPageData {
  users: User[];
  total: number;
}

const PAGE_SIZE = 50;

/** Fetches aggregate counts only — no row data, no row limit. */
export async function getUsersStats(): Promise<UsersStats> {
  const supabase = await createClient();

  const [total, student, teacher, admin, active, inactive] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
  ]);

  return {
    total: total.count ?? 0,
    student: student.count ?? 0,
    teacher: teacher.count ?? 0,
    admin: admin.count ?? 0,
    active: active.count ?? 0,
    inactive: inactive.count ?? 0,
  };
}

/** Fetches a paginated + filtered page of users (50 per page). */
export async function getUsersPageData(
  page: number = 0,
  role: AppRole | 'all' = 'all',
  status: 'active' | 'inactive' | 'all' = 'all',
  search: string = '',
  grade: string = 'all',
): Promise<UsersPageData> {
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (role !== 'all') query = query.eq('role', role);
  if (status !== 'all') query = query.eq('is_active', status === 'active');
  if (role === 'student' && grade !== 'all') {
    const parsedGrade = parseInt(grade, 10);
    if (!isNaN(parsedGrade)) {
      query = query.eq('grade', parsedGrade);
    }
  }
  if (search.trim()) {
    query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: profilesData, count } = await query.range(from, to);

  const users: User[] = (profilesData ?? []).map((p: Profile) => ({
    id: p.id,
    name: p.full_name || 'No Name',
    role: p.role,
    grade: p.grade,
    email: p.email,
    status: p.is_active ? 'active' : 'inactive',
    lastActive: `${String(new Date(p.updated_at).getDate()).padStart(2, '0')}/${String(
      new Date(p.updated_at).getMonth() + 1,
    ).padStart(2, '0')}/${new Date(p.updated_at).getFullYear()}`,
  }));

  return { users, total: count ?? 0 };
}

export async function deleteAdminUser(userId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Unauthorized');
    }

    const adminClient = getServiceRoleClient();
    const serviceKey = process.env.SUPABASE_SECRET_KEY;
    const { error } = await adminClient.functions.invoke('delete-user', {
      body: { userId },
      headers: serviceKey
        ? { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
        : undefined,
    });

    if (error) throw error;

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface BulkUserResult {
  email: string;
  success: boolean;
  error?: string;
}

export async function bulkCreateUsers(
  users: { email: string; name: string; role: AppRole; grade?: string }[],
): Promise<{ success: boolean; error?: string; results?: BulkUserResult[]; partial?: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Unauthorized');
    }

    const adminClient = getServiceRoleClient();
    const serviceKey = process.env.SUPABASE_SECRET_KEY;
    const { data, error } = await adminClient.functions.invoke('bulk-create-users', {
      body: { users },
      headers: serviceKey
        ? { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
        : undefined,
    });

    if (error) throw error;

    const results: BulkUserResult[] = data?.results || [];
    const failed = results.filter((r) => !r.success);
    const succeeded = results.filter((r) => r.success);

    if (failed.length > 0 && succeeded.length === 0) {
      return {
        success: false,
        error: 'All users failed to create.',
        results,
      };
    }

    revalidatePath('/admin/users');

    if (failed.length > 0) {
      return { success: true, partial: true, results };
    }

    return { success: true, results };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function editAdminUser(userId: string, data: { name: string; grade?: number | null }) {
  try {
    const adminClient = getServiceRoleClient();

    const updateData: any = {
      full_name: data.name,
    };

    if (data.grade !== undefined) {
      updateData.grade = data.grade;
    }

    const { error } = await adminClient.from('profiles').update(updateData).eq('id', userId);

    if (error) throw error;

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'Unauthorized.' };
    }

    const adminClient = getServiceRoleClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function manageUserStatus(userId: string, targetStatus: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: targetStatus })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}
