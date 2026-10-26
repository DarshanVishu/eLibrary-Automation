'use server';

import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';

const TYPE_LABEL_MAP: Record<string, 'Textbook' | 'Guide' | 'Question Bank' | 'Reference'> = {
  textbook: 'Textbook',
  guide: 'Guide',
  question_bank: 'Question Bank',
  reference: 'Reference',
  model_paper: 'Question Bank',
  sample_paper: 'Question Bank',
  lab_material: 'Reference',
  school_material: 'Reference',
  others: 'Reference',
};

export interface StudentMaterial {
  id: string;
  bookId?: string | null;
  title: string;
  subject: string;
  grades: number[];
  materialType: 'Textbook' | 'Guide' | 'Question Bank' | 'Reference';
  coverImage?: string;
  /** Short-lived signed URL for the PDF — used to render a first-page preview on the card. */
  pdfPreviewUrl?: string;
  progress?: number;
  lastPage?: number;
  lastViewed?: string;
  isBookmarked?: boolean;
  addedDate?: string;
  academicYear?: string;
}

async function createSignedUrlMap(supabase: Awaited<ReturnType<typeof createClient>>, rows: any[]) {
  const signedUrlMap = new Map<string, string>();
  const storagePaths = rows
    .filter((r: any) => r.storage_path)
    .map((r: any) => r.storage_path as string);

  if (storagePaths.length === 0) {
    return signedUrlMap;
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < storagePaths.length; i += BATCH_SIZE) {
    const batch = storagePaths.slice(i, i + BATCH_SIZE);
    const { data: signedList, error } = await supabase.storage
      .from('library-files')
      .createSignedUrls(batch, 3600);

    if (!error && signedList) {
      for (const item of signedList) {
        if (item.signedUrl) {
          const resource = rows.find((r: any) => r.storage_path === item.path);
          if (resource) signedUrlMap.set(resource.id, item.signedUrl);
        }
      }
    }
  }

  return signedUrlMap;
}

function mapStudentMaterials(rows: any[], signedUrlMap: Map<string, string>): StudentMaterial[] {
  return rows.map((r: any) => {
    // An empty grades array means the material is unrestricted (visible to all grades).
    // Callers should render "All Grades" when this array is empty.
    // Previously this fell back to [5] which was wrong and misleading.
    const grades: number[] = Array.isArray(r.grades) ? r.grades : [];
    const pdfPreviewUrl = signedUrlMap.get(r.id) ?? (r.source_url as string | null) ?? undefined;

    return {
      id: r.id,
      bookId: r.book_id ?? undefined,
      title: r.title,
      subject: r.subject_name ?? 'General',
      grades,
      materialType: TYPE_LABEL_MAP[r.material_type] ?? 'Reference',
      coverImage: r.thumbnail_url ?? undefined,
      pdfPreviewUrl,
      progress: r.progress_pct ? Number(r.progress_pct) : 0,
      lastPage: r.last_page ? Number(r.last_page) : undefined,
      lastViewed: r.last_viewed_at ?? undefined,
      isBookmarked: r.is_bookmarked ?? false,
      addedDate: r.created_at,
      academicYear: r.academic_year ?? undefined,
    };
  });
}

async function getStudentMaterialsFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ materials: StudentMaterial[]; bypassEnabled: boolean; studentGrade: number }> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('grade, role, is_active')
    .eq('id', userId)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== 'student' ||
    !profile.is_active ||
    !profile.grade
  ) {
    return { materials: [], bypassEnabled: false, studentGrade: 0 };
  }

  const { data: settings } = await supabase
    .from('app_settings')
    .select('allow_all_grades_access')
    .eq('id', 1)
    .single();
  const bypassEnabled = settings?.allow_all_grades_access ?? false;
  const studentGrade = profile.grade;

  let resourceIds: string[] = [];

  if (bypassEnabled) {
    const allResources = await fetchAllRows((from, to) =>
      supabase
        .from('resources')
        .select('id')
        .eq('published', true)
        .eq('is_active', true)
        .range(from, to),
    );
    resourceIds = allResources.map((r) => r.id);
  } else {
    // 1. Resources restricted to student's grade
    const gradeAccessRows = await fetchAllRows((from, to) =>
      supabase
        .from('resource_grade_access')
        .select('resource_id')
        .eq('grade', profile.grade)
        .range(from, to),
    );
    const matchedGradeIds = gradeAccessRows.map((row) => row.resource_id);

    // 2. Unrestricted resources (materials with no grade rows)
    const allAccessRows = await fetchAllRows((from, to) =>
      supabase.from('resource_grade_access').select('resource_id').range(from, to),
    );
    const restrictedIds = new Set(allAccessRows.map((r) => r.resource_id));

    const allActiveResources = await fetchAllRows((from, to) =>
      supabase
        .from('resources')
        .select('id')
        .eq('published', true)
        .eq('is_active', true)
        .range(from, to),
    );

    const unrestrictedIds = allActiveResources
      .map((r) => r.id)
      .filter((id) => !restrictedIds.has(id));

    resourceIds = Array.from(new Set([...matchedGradeIds, ...unrestrictedIds]));
  }

  if (resourceIds.length === 0) {
    return { materials: [], bypassEnabled, studentGrade };
  }

  const resources: any[] = [];
  const ID_BATCH_SIZE = 500;
  for (let i = 0; i < resourceIds.length; i += ID_BATCH_SIZE) {
    const batch = resourceIds.slice(i, i + ID_BATCH_SIZE);
    const { data: batchData, error: resourcesError } = await supabase
      .from('resources')
      .select(
        `
          id,
          book_id,
          title,
          material_type,
          academic_year,
          thumbnail_url,
          storage_path,
          source_url,
          created_at,
          subjects(name),
          resource_grade_access(grade)
        `,
      )
      .in('id', batch)
      .eq('published', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(0, 999);

    if (resourcesError) {
      return { materials: [], bypassEnabled, studentGrade };
    }
    if (batchData) resources.push(...batchData);
  }

  const activeResourceIds = resources.map((resource: any) => resource.id);
  if (activeResourceIds.length === 0) {
    return { materials: [], bypassEnabled, studentGrade };
  }

  const [progressRows, bookmarkRows] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from('reading_progress')
        .select('resource_id, progress_pct, last_page, last_viewed_at')
        .eq('user_id', userId)
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase.from('bookmarks').select('resource_id').eq('user_id', userId).range(from, to),
    ),
  ]);

  const progressMap = new Map((progressRows ?? []).map((row) => [row.resource_id, row]));
  const bookmarkSet = new Set((bookmarkRows ?? []).map((row) => row.resource_id));

  const normalizedRows = resources.map((resource: any) => {
    const progress = progressMap.get(resource.id);
    return {
      id: resource.id,
      book_id: resource.book_id,
      title: resource.title,
      material_type: resource.material_type,
      academic_year: resource.academic_year,
      thumbnail_url: resource.thumbnail_url,
      storage_path: resource.storage_path,
      source_url: resource.source_url,
      created_at: resource.created_at,
      subject_name: resource.subjects?.name ?? 'General',
      grades: Array.isArray(resource.resource_grade_access)
        ? resource.resource_grade_access.map((entry: any) => entry.grade)
        : [profile.grade],
      progress_pct: progress?.progress_pct ?? 0,
      last_page: progress?.last_page ?? null,
      last_viewed_at: progress?.last_viewed_at ?? null,
      is_bookmarked: bookmarkSet.has(resource.id),
    };
  });

  const signedUrlMap = await createSignedUrlMap(supabase, normalizedRows);
  return {
    materials: mapStudentMaterials(normalizedRows, signedUrlMap),
    bypassEnabled,
    studentGrade,
  };
}

export async function getStudentMaterials(): Promise<{
  materials: StudentMaterial[];
  bypassEnabled: boolean;
  studentGrade: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { materials: [], bypassEnabled: false, studentGrade: 0 };

  // ── Single RPC replaces 4 sequential queries ──────────────────────────────
  // get_student_library returns resources + subject name + reading progress +
  // bookmark status + grade list all joined server-side in one round-trip.
  let rows: any[] = [];
  try {
    const rpcQuery = supabase.rpc('get_student_library', { p_user_id: user.id });
    if (rpcQuery && typeof (rpcQuery as any).range === 'function') {
      rows = await fetchAllRows((from, to) =>
        supabase.rpc('get_student_library', { p_user_id: user.id }).range(from, to),
      );
    } else {
      const res = await rpcQuery;
      if (res.error) {
        return getStudentMaterialsFallback(supabase, user.id);
      }
      rows = res.data ?? [];
    }
  } catch {
    return getStudentMaterialsFallback(supabase, user.id);
  }

  if (rows.length === 0) {
    return getStudentMaterialsFallback(supabase, user.id);
  }

  // Fetch bypass and grade
  const { data: profile } = await supabase
    .from('profiles')
    .select('grade')
    .eq('id', user.id)
    .single();

  const { data: settings } = await supabase
    .from('app_settings')
    .select('allow_all_grades_access')
    .eq('id', 1)
    .single();

  const bypassEnabled = settings?.allow_all_grades_access ?? false;
  const studentGrade = profile?.grade ?? 0;

  // ── Generate short-lived signed URLs for PDF preview (storage only) ────────
  // Only resources stored in the bucket need a signed URL; external source_url
  // resources use the URL directly. Failures are silently ignored — the card
  // falls back to the subject icon placeholder.
  const signedUrlMap = await createSignedUrlMap(supabase, rows);
  return {
    materials: mapStudentMaterials(rows, signedUrlMap),
    bypassEnabled,
    studentGrade,
  };
}
