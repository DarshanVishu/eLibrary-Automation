'use server';

import type { IconName } from '@/components/ui/icon';
import { SUBJECT_MAP } from '@/lib/constants';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database';
import { formatBytes, formatTypeLabel } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

type Resource = Database['public']['Tables']['resources']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

export interface LibraryBook {
  id: string;
  bookId: string | null;
  title: string;
  subject: string;
  grades: number[];
  /** Formatted label e.g. "NCERT Textbook" */
  type: string;
  /** Raw material_type key e.g. "textbook" */
  rawType: string;
  views: number;
  pages: number;
  fileSize: string;
  uploadedBy: string;
  icon: IconName;
}

const PAGE_SIZE = 24;

export interface LibraryStats {
  total: number;
  subjects: string[];
  materialTypes: string[];
  contentBySubject: { subject: string; count: number }[];
}

export interface LibraryPageData {
  books: LibraryBook[];
  total: number;
}

export async function getLibraryStats(): Promise<LibraryStats> {
  const supabase = await createClient();

  // 1. Total count
  const { count: total } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // 2. Subjects list
  const { data: subjectsData } = await supabase.from('subjects').select('name').order('name');
  const subjects = (subjectsData || []).map((s) => s.name);

  // 3. Material types list and 4. Content by subject
  const resources = await fetchAllRows((from, to) =>
    supabase
      .from('resources')
      .select('material_type, subjects(name)')
      .eq('is_active', true)
      .range(from, to),
  );

  const typesSet = new Set<string>();
  const subjectCount: Record<string, number> = {};

  resources.forEach((r) => {
    typesSet.add(formatTypeLabel(r.material_type));
    const subjectName = (r.subjects as any)?.name || 'Unknown';
    subjectCount[subjectName] = (subjectCount[subjectName] || 0) + 1;
  });

  return {
    total: total || 0,
    subjects,
    materialTypes: Array.from(typesSet),
    contentBySubject: Object.keys(subjectCount).map((subject) => ({
      subject,
      count: subjectCount[subject],
    })),
  };
}

// Reverse map for material types
const TYPE_REVERSE: Record<string, string> = {
  'NCERT Textbook': 'textbook',
  Guide: 'guide',
  'Question Bank': 'question_bank',
  Reference: 'reference',
  'Model Paper': 'model_paper',
  'Sample Paper': 'sample_paper',
  'Lab Material': 'lab_material',
  'School Material': 'school_material',
  Others: 'others',
};

export async function getLibraryPageData(
  page: number,
  search: string,
  subject: string,
  type: string,
  grade: string,
): Promise<LibraryPageData> {
  const supabase = await createClient();

  const gradeAccessSelect =
    grade !== 'all' ? 'resource_grade_access!inner(grade)' : 'resource_grade_access(grade)';

  let query = supabase
    .from('resources')
    .select(
      `
      id,
      book_id,
      title,
      material_type,
      file_size_bytes,
      page_count,
      subjects(name),
      profiles:created_by(full_name),
      ${gradeAccessSelect}
    `,
      { count: 'exact' },
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,book_id.ilike.%${search.trim()}%`);
  }

  if (subject !== 'all') {
    const { data: sub } = await supabase
      .from('subjects')
      .select('id')
      .ilike('name', subject)
      .limit(1)
      .maybeSingle();
    if (sub) query = query.eq('subject_id', sub.id);
  }

  if (type !== 'all') {
    const rawType = TYPE_REVERSE[type];
    if (rawType) query = query.eq('material_type', rawType);
  }

  if (grade !== 'all') {
    query = query.eq('resource_grade_access.grade', parseInt(grade, 10));
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: resourcesData, count, error } = await query.range(from, to);

  if (error) {
    console.error('Error fetching library page data:', error);
    return { books: [], total: 0 };
  }

  const resourceIds = (resourcesData || []).map((r) => r.id);

  // Fetch full grade list and views for just the 24 items on the current page
  const [viewsRes, gradeAccessRes] = await Promise.all([
    resourceIds.length > 0
      ? supabase
          .from('resource_view_counts')
          .select('resource_id, views')
          .in('resource_id', resourceIds)
      : Promise.resolve({ data: [] }),
    resourceIds.length > 0
      ? supabase
          .from('resource_grade_access')
          .select('resource_id, grade')
          .in('resource_id', resourceIds)
      : Promise.resolve({ data: [] }),
  ]);

  const viewCounts: Record<string, number> = {};
  if (viewsRes.data && viewsRes.data.length > 0) {
    (viewsRes.data || []).forEach((v: any) => {
      viewCounts[v.resource_id] = Number(v.views) || 0;
    });
  } else if (resourceIds.length > 0) {
    // Fallback if view doesn't exist or is empty
    const { data: fallbackViews } = await supabase
      .from('resource_views')
      .select('resource_id')
      .in('resource_id', resourceIds)
      .range(0, 9999);
    (fallbackViews || []).forEach((v) => {
      viewCounts[v.resource_id] = (viewCounts[v.resource_id] || 0) + 1;
    });
  }

  const gradesMap: Record<string, number[]> = {};
  (gradeAccessRes.data || []).forEach((g: any) => {
    if (!gradesMap[g.resource_id]) {
      gradesMap[g.resource_id] = [];
    }
    gradesMap[g.resource_id].push(g.grade);
  });

  const books: LibraryBook[] = (resourcesData || []).map((r: any) => {
    const subjectName = (r.subjects as any)?.name || 'Unknown';
    const subjectConfig = SUBJECT_MAP[subjectName];

    // Use grades from gradesMap if available (ensures full grade list even when filtered),
    // otherwise fallback to embedded resource_grade_access
    const grades = gradesMap[r.id]
      ? gradesMap[r.id].sort((a: number, b: number) => a - b)
      : Array.isArray(r.resource_grade_access)
        ? r.resource_grade_access.map((g: any) => g.grade).sort((a: number, b: number) => a - b)
        : [];

    return {
      id: r.id,
      bookId: r.book_id || null,
      title: r.title,
      subject: subjectName,
      grades,
      type: formatTypeLabel(r.material_type),
      rawType: r.material_type,
      views: viewCounts[r.id] || 0,
      pages: r.page_count || 0,
      fileSize: formatBytes(r.file_size_bytes || 0),
      uploadedBy: (r.profiles as any)?.full_name || 'System',
      icon: subjectConfig?.iconName || 'books',
    };
  });

  return { books, total: count || 0 };
}

export async function deleteResource(id: string) {
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from('resources').update({ is_active: false }).eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/library');
  return { success: true };
}

export async function getPreviewUrl(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('storage_path, source_url')
    .eq('id', id)
    .single();

  if (error || !data) {
    return { error: 'Resource not found' };
  }

  if (data.source_url) {
    return { url: data.source_url };
  }

  if (data.storage_path) {
    const { data: signed, error: signError } = await supabase.storage
      .from('library-files')
      .createSignedUrl(data.storage_path, 3600);

    if (signError || !signed) {
      return { error: 'Failed to generate preview URL' };
    }

    return { url: signed.signedUrl };
  }

  return { error: 'No file associated with this resource' };
}

export interface AdminUpdateMaterialMetadataParams {
  id: string;
  bookId?: string | null;
  title: string;
  subject: string;
  grade: number;
  type: string;
}

export type AdminUpdateMaterialMetadataResult =
  | { success: true }
  | { success: false; error: string };

const SUBJECT_NAME_ALIASES_ADMIN: Record<string, string> = {
  'Environmental Studies': 'EVS',
  'Social Studies': 'Social Science',
};

/**
 * Server action: admins can update metadata for any resource.
 */
export async function adminUpdateMaterialMetadata(
  params: AdminUpdateMaterialMetadataParams,
): Promise<AdminUpdateMaterialMetadataResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  // Resolve subject name → subject id
  const rawName = params.subject;
  const mappedName = SUBJECT_NAME_ALIASES_ADMIN[rawName] ?? rawName;

  const { data: subjectRow } = await supabase
    .from('subjects')
    .select('id')
    .ilike('name', mappedName)
    .limit(1)
    .maybeSingle();

  if (!subjectRow) {
    return { success: false, error: `Subject "${params.subject}" not found in the database.` };
  }

  // Update resource row (admin can edit any resource)
  const { error: updateError } = await supabase
    .from('resources')
    .update({
      book_id: params.bookId !== undefined ? params.bookId?.trim() || null : undefined,
      title: params.title,
      subject_id: subjectRow.id,
      material_type: params.type as any,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', params.id);

  if (updateError) return { success: false, error: updateError.message };

  // Replace grade access rows
  const { error: deleteError } = await supabase
    .from('resource_grade_access')
    .delete()
    .eq('resource_id', params.id);

  if (deleteError) return { success: false, error: deleteError.message };

  const isAllGrades = params.grade === 0;
  const gradeRows = isAllGrades
    ? Array.from({ length: 10 }, (_, i) => ({ resource_id: params.id, grade: i + 1 }))
    : [{ resource_id: params.id, grade: params.grade }];

  const { error: insertError } = await supabase.from('resource_grade_access').insert(gradeRows);
  if (insertError) return { success: false, error: insertError.message };

  revalidatePath('/admin/library');
  revalidatePath('/teacher/uploads');
  return { success: true };
}
