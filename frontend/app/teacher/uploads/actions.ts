'use server';

import type { IconName } from '@/components/ui/icon';
import { requireAuth } from '@/lib/auth';
import { SUBJECT_MAP } from '@/lib/constants';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database';
import { formatBytes, formatTypeLabel } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

type Resource = Database['public']['Tables']['resources']['Row'];

interface Book {
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
  published: boolean;
  createdAt: string;
}

export async function getTeacherUploadsData() {
  const user = await requireAuth('teacher');
  const supabase = await createClient();

  const resourcesData = await fetchAllRows((from, to) =>
    supabase
      .from('resources')
      .select(
        `
        id,
        book_id,
        title,
        material_type,
        file_size_bytes,
        page_count,
        published,
        created_at,
        subjects(name),
        profiles:created_by(full_name),
        resource_grade_access(grade)
      `,
      )
      .eq('created_by', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to),
  );

  const resourceIds = resourcesData.map((r) => r.id);

  const viewsList: any[] = [];
  if (resourceIds.length > 0) {
    const ID_BATCH_SIZE = 500;
    for (let i = 0; i < resourceIds.length; i += ID_BATCH_SIZE) {
      const batch = resourceIds.slice(i, i + ID_BATCH_SIZE);
      const batchViews = await fetchAllRows((from, to) =>
        supabase
          .from('resource_views')
          .select('resource_id')
          .in('resource_id', batch)
          .range(from, to),
      );
      viewsList.push(...batchViews);
    }
  }

  const viewCounts: Record<string, number> = {};
  viewsList.forEach((v) => {
    viewCounts[v.resource_id] = (viewCounts[v.resource_id] || 0) + 1;
  });

  const books: Book[] = resourcesData.map((r) => {
    const subjectName = (r.subjects as any)?.name || 'Unknown';
    const subjectConfig = SUBJECT_MAP[subjectName];

    return {
      id: r.id,
      bookId: r.book_id || null,
      title: r.title,
      subject: subjectName,
      grades: Array.isArray(r.resource_grade_access)
        ? r.resource_grade_access.map((g: any) => g.grade).sort((a: number, b: number) => a - b)
        : [],
      type: formatTypeLabel(r.material_type),
      rawType: r.material_type,
      views: viewCounts[r.id] || 0,
      pages: r.page_count || 0,
      fileSize: formatBytes(r.file_size_bytes || 0),
      uploadedBy: (r.profiles as any)?.full_name || 'System',
      icon: subjectConfig?.iconName || 'books',
      published: r.published,
      createdAt: r.created_at,
    };
  });

  const subjectsSet = new Set(books.map((b) => b.subject));
  const typesSet = new Set(books.map((b) => b.type));

  const subjectCount: Record<string, number> = {};
  books.forEach((b) => {
    subjectCount[b.subject] = (subjectCount[b.subject] || 0) + 1;
  });

  const publishedCount = books.filter((b) => b.published).length;
  const pendingCount = books.filter((b) => !b.published).length;
  const totalViews = books.reduce((sum, b) => sum + b.views, 0);

  return {
    books,
    subjects: Array.from(subjectsSet),
    materialTypes: Array.from(typesSet),
    contentBySubject: Object.keys(subjectCount).map((subject) => ({
      subject,
      count: subjectCount[subject],
    })),
    stats: {
      total: books.length,
      published: publishedCount,
      pending: pendingCount,
      totalViews,
    },
  };
}

export async function deleteTeacherUpload(id: string) {
  const user = await requireAuth('teacher');
  const supabase = getServiceRoleClient();

  const { data: resource, error: fetchError } = await supabase
    .from('resources')
    .select('created_by')
    .eq('id', id)
    .single();

  if (fetchError || !resource) {
    return { error: 'Resource not found' };
  }

  if (resource.created_by !== user.id) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase.from('resources').update({ is_active: false }).eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/teacher/uploads');
  return { success: true };
}

export async function getTeacherPreviewUrl(id: string) {
  const user = await requireAuth('teacher');
  const supabase = await createClient();

  const { data: resource, error: fetchError } = await supabase
    .from('resources')
    .select('storage_path, source_url, created_by')
    .eq('id', id)
    .single();

  if (fetchError || !resource) {
    return { error: 'Resource not found' };
  }

  if (resource.created_by !== user.id) {
    return { error: 'Unauthorized' };
  }

  if (resource.source_url) {
    return { url: resource.source_url };
  }

  if (resource.storage_path) {
    const { data: signed, error: signError } = await supabase.storage
      .from('library-files')
      .createSignedUrl(resource.storage_path, 3600);

    if (signError || !signed) {
      return { error: 'Failed to generate preview URL' };
    }

    return { url: signed.signedUrl };
  }

  return { error: 'No file associated with this resource' };
}

export interface UpdateMaterialMetadataParams {
  id: string;
  bookId?: string | null;
  title: string;
  subject: string;
  grade: number;
  type: string;
}

export type UpdateMaterialMetadataResult = { success: true } | { success: false; error: string };

const SUBJECT_NAME_ALIASES_UPDATE: Record<string, string> = {
  'Environmental Studies': 'EVS',
  'Social Studies': 'Social Science',
};

/**
 * Server action: updates resource metadata (title, subject, grade, type).
 * Only the teacher who uploaded the resource — or an admin — can edit it.
 */
export async function updateMaterialMetadata(
  params: UpdateMaterialMetadataParams,
): Promise<UpdateMaterialMetadataResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  // Verify the requester owns this resource (teacher check)
  const { data: resource, error: fetchError } = await supabase
    .from('resources')
    .select('created_by')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (fetchError || !resource) {
    return { success: false, error: 'Resource not found.' };
  }

  if (resource.created_by !== user.id) {
    return { success: false, error: 'Unauthorized. You can only edit your own materials.' };
  }

  // Resolve subject name → subject id
  const rawName = params.subject;
  const mappedName = SUBJECT_NAME_ALIASES_UPDATE[rawName] ?? rawName;

  const { data: subjectRow } = await supabase
    .from('subjects')
    .select('id')
    .ilike('name', mappedName)
    .limit(1)
    .maybeSingle();

  if (!subjectRow) {
    return { success: false, error: `Subject "${params.subject}" not found in the database.` };
  }

  // Update resource row
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

  revalidatePath('/teacher/uploads');
  return { success: true };
}
