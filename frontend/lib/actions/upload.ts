'use server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function generateUploadId() {
  await requireAuth();
  return crypto.randomUUID();
}

export async function getUploadAccessToken(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

const SUBJECT_NAME_ALIASES: Record<string, string> = {
  'Environmental Studies': 'EVS',
  'Social Studies': 'Social Science',
};

export interface SaveUploadMetadataParams {
  resourceId: string;
  bookId?: string | null;
  title: string;
  subjectId: string;
  grade: number;
  type: string;
  storagePath: string;
  fileMime: string;
  fileSizeBytes: number;
  pageCount: number;
}

export type SaveUploadMetadataResult = { success: true } | { success: false; error: string };

/**
 * Server action: saves resource + grade access after TUS upload completes.
 * Runs on the server with cookie-based Supabase client — no browser auth
 * locks, no cross-tab contention.
 */
export async function saveUploadMetadata(
  params: SaveUploadMetadataParams,
): Promise<SaveUploadMetadataResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const published = profile?.role === 'admin';

  // Resolve subject from numeric id or fixed subject name
  const parsedSubjectId = Number.parseInt(params.subjectId, 10);
  let resolvedSubjectId: number | null = Number.isFinite(parsedSubjectId) ? parsedSubjectId : null;

  if (!resolvedSubjectId) {
    const rawName = params.subjectId.trim();
    const mappedName = SUBJECT_NAME_ALIASES[rawName] ?? rawName;

    const { data: exact } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', mappedName)
      .maybeSingle();
    resolvedSubjectId = exact?.id ?? null;

    if (!resolvedSubjectId) {
      const { data: fuzzy } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', mappedName)
        .limit(1)
        .maybeSingle();
      resolvedSubjectId = fuzzy?.id ?? null;
    }

    if (!resolvedSubjectId) {
      return {
        success: false,
        error: `Invalid subject selected ("${params.subjectId}"). Please select a valid subject from the list.`,
      };
    }
  }

  const VALID_TYPES = new Set([
    'textbook',
    'guide',
    'question_bank',
    'reference',
    'model_paper',
    'sample_paper',
    'lab_material',
    'school_material',
    'others',
  ]);
  const resolvedType = VALID_TYPES.has(params.type) ? params.type : 'reference';

  const { error: resourceError } = await supabase.from('resources').insert({
    id: params.resourceId,
    book_id: params.bookId?.trim() || null,
    title: params.title,
    subject_id: resolvedSubjectId,
    material_type: resolvedType,
    storage_path: params.storagePath,
    file_mime: params.fileMime || 'application/pdf',
    file_size_bytes: params.fileSizeBytes,
    page_count: params.pageCount,
    published,
    created_by: user.id,
  });
  if (resourceError) return { success: false, error: resourceError.message };

  const isAllGrades = params.grade === 0;

  if (isAllGrades) {
    const gradeAccessRows = Array.from({ length: 10 }, (_, i) => ({
      resource_id: params.resourceId,
      grade: (i + 1) as number,
    }));

    const { error: gradeError } = await supabase
      .from('resource_grade_access')
      .insert(gradeAccessRows);

    if (gradeError) return { success: false, error: gradeError.message };
  } else {
    const { error: gradeError } = await supabase.from('resource_grade_access').insert({
      resource_id: params.resourceId,
      grade: params.grade,
    });
    if (gradeError) return { success: false, error: gradeError.message };
  }

  revalidatePath('/student', 'layout');
  revalidatePath('/teacher', 'layout');
  revalidatePath('/admin', 'layout');

  return { success: true };
}
