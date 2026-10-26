'use server';

import { trackResourceView } from '@/lib/actions/view-tracking';
import { createClient } from '@/lib/supabase/server';
import type { MaterialData, NoteRecord } from '@/lib/types/viewer';
import { revalidatePath } from 'next/cache';

export async function getMaterialViewerData(
  materialId: string,
): Promise<{ material: MaterialData | null; isBookmarked: boolean; error?: string }> {
  if (!materialId) {
    return { material: null, isBookmarked: false, error: 'Resource ID is required' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { material: null, isBookmarked: false, error: 'Unauthorized' };
  }

  const [{ data: resourceData, error: resourceError }, { data: bookmarkData }] = await Promise.all([
    supabase
      .from('resources')
      .select(`id, title, storage_path, source_url, subjects(name), resource_grade_access(grade)`)
      .eq('id', materialId)
      .maybeSingle(),
    supabase
      .from('bookmarks')
      .select('resource_id')
      .eq('user_id', user.id)
      .eq('resource_id', materialId)
      .maybeSingle(),
  ]);

  if (resourceError) {
    return { material: null, isBookmarked: false, error: resourceError.message };
  }

  if (!resourceData) {
    return { material: null, isBookmarked: false };
  }

  let pdfUrl = resourceData.source_url;
  if (resourceData.storage_path) {
    try {
      const { data: sd } = await supabase.storage
        .from('library-files')
        .createSignedUrl(resourceData.storage_path, 3600);

      pdfUrl = sd?.signedUrl ?? resourceData.source_url ?? null;
    } catch {
      pdfUrl = resourceData.source_url ?? null;
    }
  }

  const subjectName = (resourceData.subjects as any)?.name ?? 'General';
  const grades = ((resourceData.resource_grade_access as any[]) ?? []).map((g) => g.grade);

  const material: MaterialData = {
    id: resourceData.id,
    title: resourceData.title,
    subject: subjectName,
    grade: grades[0] ?? 0,
    pdfUrl: pdfUrl || undefined,
  };

  // Track resource view asynchronously
  trackResourceView(resourceData.id).catch(() => {});

  return {
    material,
    isBookmarked: !!bookmarkData,
  };
}

export async function toggleBookmarkAction(
  resourceId: string,
): Promise<{ isBookmarked: boolean; error?: string }> {
  if (!resourceId) {
    return { isBookmarked: false, error: 'Resource ID is required' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isBookmarked: false, error: 'Unauthorized' };
  }

  const { data, error } = await supabase.rpc('toggle_bookmark', {
    p_resource_id: resourceId,
  });

  if (error) {
    return { isBookmarked: false, error: error.message };
  }

  revalidatePath('/student/bookmarks');
  revalidatePath('/student/library');
  return { isBookmarked: !!data };
}

export async function getMaterialAnnotations(resourceId: string): Promise<NoteRecord[]> {
  if (!resourceId) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('resource_annotations')
    .select('id, annotation_data')
    .eq('user_id', user.id)
    .eq('resource_id', resourceId);

  if (error || !data) return [];

  return (data as NoteRecord[])
    .filter((d) => {
      const ad = d.annotation_data;
      return (
        (ad.type === 'note' && ad.note) ||
        ((ad.type === 'highlight' || ad.type === 'area') && ad.rects)
      );
    })
    .sort((a, b) => (a.annotation_data.page || 0) - (b.annotation_data.page || 0));
}

export async function saveMaterialAnnotation(params: {
  resourceId: string;
  pageNumber: number;
  annotationData: any;
}): Promise<{ id: string | null; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { id: null, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('resource_annotations')
    .insert({
      user_id: user.id,
      resource_id: params.resourceId,
      page_number: params.pageNumber,
      annotation_data: params.annotationData,
    })
    .select('id')
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  return { id: data.id };
}

export async function updateMaterialAnnotation(
  id: string,
  annotationData: any,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('resource_annotations')
    .update({ annotation_data: annotationData })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteMaterialAnnotation(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('resource_annotations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
