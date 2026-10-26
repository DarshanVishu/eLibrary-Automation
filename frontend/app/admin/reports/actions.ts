'use server';

import { fetchAllRows } from '@/lib/supabase/fetch-all';
import { createClient } from '@/lib/supabase/server';
import type {
  ReportParams,
  OverallReportData,
  AllStudentsReportData,
  IndividualStudentReportData,
  StudentReportRow,
} from '@/lib/types/reports';
import {
  formatTypeLabel,
  formatMonthLabel,
  monthStart,
  addMonths,
  formatGradeLabel,
  formatBytes,
} from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDateFilter(params: ReportParams): { from: Date | null; to: Date | null } {
  const from = params.from ? new Date(params.from) : null;
  const to = params.to ? new Date(params.to + 'T23:59:59.999Z') : null;
  return { from, to };
}

async function getSchoolName(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data } = await supabase
    .from('app_settings')
    .select('school_name, platform_name')
    .eq('id', 1)
    .maybeSingle();
  return (data as any)?.school_name || data?.platform_name || 'DAV Public School';
}

function inRange(dateStr: string, from: Date | null, to: Date | null): boolean {
  const d = new Date(dateStr);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

// ─── Overall Platform Report ──────────────────────────────────────────────────

export async function getOverallReportData(params: ReportParams = {}): Promise<OverallReportData> {
  const supabase = await createClient();
  const { from, to } = buildDateFilter(params);
  const schoolName = await getSchoolName(supabase);

  const [profiles, resources, allViewsData, allProgressData, allBookmarksData, allAnnotationsData] =
    await Promise.all([
      fetchAllRows((from, to) =>
        supabase
          .from('profiles')
          .select('id, full_name, email, grade, is_active, role, created_at')
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
        published,
        is_active,
        page_count,
        file_size_bytes,
        subject_id,
        created_at,
        subjects(id, name),
        resource_grade_access(grade)
      `,
          )
          .eq('is_active', true)
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase.from('resource_views').select('resource_id, user_id, viewed_at').range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from('reading_progress')
          .select('user_id, resource_id, progress_pct, last_page, last_viewed_at')
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase.from('bookmarks').select('user_id, resource_id').range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from('resource_annotations')
          .select('user_id, resource_id, page_number')
          .range(from, to),
      ),
    ]);
  const activeResourceIds = new Set(resources.map((r) => r.id));

  // Resource metadata maps
  const resourceMap = new Map(resources.map((r) => [r.id, r]));

  // Filter views by date range and active resources
  const views = (allViewsData ?? []).filter(
    (v) => activeResourceIds.has(v.resource_id) && inRange(v.viewed_at, from, to),
  );

  const students = profiles.filter((p) => p.role === 'student');
  const staff = profiles.filter((p) => p.role === 'teacher' || p.role === 'admin');
  const activeStudents = students.filter((p) => p.is_active).length;
  const inactiveStudents = students.filter((p) => !p.is_active).length;

  const totalPagesDigitized = resources.reduce((acc, r) => acc + (r.page_count || 0), 0);
  const totalSizeBytes = resources.reduce((acc, r) => acc + (r.file_size_bytes || 0), 0);
  const totalStorageMB = formatBytes(totalSizeBytes);

  // Views by student
  const studentViewCounts = new Map<string, number>();
  const activeReaderIds = new Set<string>();
  for (const v of views) {
    studentViewCounts.set(v.user_id, (studentViewCounts.get(v.user_id) ?? 0) + 1);
    activeReaderIds.add(v.user_id);
  }

  // Progress by student
  const progressByStudent = new Map<string, number[]>();
  const completedBooksByStudent = new Map<string, number>();
  for (const row of allProgressData ?? []) {
    if (!progressByStudent.has(row.user_id)) progressByStudent.set(row.user_id, []);
    progressByStudent.get(row.user_id)!.push(row.progress_pct);
    if (row.progress_pct >= 80) {
      completedBooksByStudent.set(row.user_id, (completedBooksByStudent.get(row.user_id) ?? 0) + 1);
    }
  }

  const allProgressValues = (allProgressData ?? []).map((p) => p.progress_pct);
  const averageProgressPct =
    allProgressValues.length > 0
      ? Math.round(allProgressValues.reduce((a, b) => a + b, 0) / allProgressValues.length)
      : 0;

  const totalCompletedBooks = (allProgressData ?? []).filter((p) => p.progress_pct >= 80).length;
  const studentsWithCompletions = Array.from(completedBooksByStudent.keys()).filter((uid) =>
    students.some((s) => s.id === uid),
  ).length;

  const participationRate =
    students.length > 0 ? Math.round((activeReaderIds.size / students.length) * 100) : 0;
  const cohortCompletionRate =
    students.length > 0 ? Math.round((studentsWithCompletions / students.length) * 100) : 0;

  // ── Grade Performance Matrix ──
  const presentGrades = Array.from(
    new Set(students.map((s) => s.grade).filter((g): g is number => typeof g === 'number')),
  ).sort((a, b) => a - b);

  const gradeMatrix = presentGrades.map((grade) => {
    const gradeStudents = students.filter((s) => s.grade === grade);
    const gradeStudentIds = new Set(gradeStudents.map((s) => s.id));
    const gradeViews = views.filter((v) => gradeStudentIds.has(v.user_id));
    const gradeActiveReaders = new Set(gradeViews.map((v) => v.user_id)).size;

    const gradeProgressList: number[] = [];
    let gradeCompletions = 0;
    for (const s of gradeStudents) {
      const pList = progressByStudent.get(s.id) ?? [];
      gradeProgressList.push(...pList);
      gradeCompletions += completedBooksByStudent.get(s.id) ?? 0;
    }

    const avgProgress =
      gradeProgressList.length > 0
        ? Math.round(gradeProgressList.reduce((a, b) => a + b, 0) / gradeProgressList.length)
        : 0;

    // Top subject in this grade
    const subjectViewCount = new Map<string, number>();
    for (const v of gradeViews) {
      const res = resourceMap.get(v.resource_id);
      const subName = (res?.subjects as any)?.name || 'General';
      subjectViewCount.set(subName, (subjectViewCount.get(subName) ?? 0) + 1);
    }
    const topSubEntry = Array.from(subjectViewCount.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      grade,
      totalStudents: gradeStudents.length,
      activeReaders: gradeActiveReaders,
      participationPct:
        gradeStudents.length > 0
          ? Math.round((gradeActiveReaders / gradeStudents.length) * 100)
          : 0,
      totalViews: gradeViews.length,
      avgProgressPct: avgProgress,
      completedBooks: gradeCompletions,
      topSubject: topSubEntry ? topSubEntry[0] : 'None',
    };
  });

  // ── Subject Performance Matrix ──
  const subjectMap = new Map<string, any[]>();
  for (const r of resources) {
    const sName = (r.subjects as any)?.name || 'General';
    if (!subjectMap.has(sName)) subjectMap.set(sName, []);
    subjectMap.get(sName)!.push(r);
  }

  const subjectMatrix = Array.from(subjectMap.entries())
    .map(([subject, subResources]) => {
      const subResIds = new Set(subResources.map((r) => r.id));
      const subViews = views.filter((v) => subResIds.has(v.resource_id));
      const uniqueReaders = new Set(subViews.map((v) => v.user_id)).size;

      const subProgressList = (allProgressData ?? [])
        .filter((p) => subResIds.has(p.resource_id))
        .map((p) => p.progress_pct);
      const avgCompletion =
        subProgressList.length > 0
          ? Math.round(subProgressList.reduce((a, b) => a + b, 0) / subProgressList.length)
          : 0;

      const subBookmarks = (allBookmarksData ?? []).filter((b) =>
        subResIds.has(b.resource_id),
      ).length;

      // Grade with most views for this subject
      const gradeViews = new Map<number, number>();
      for (const v of subViews) {
        const studentProfile = profiles.find((p) => p.id === v.user_id);
        if (studentProfile?.grade) {
          gradeViews.set(studentProfile.grade, (gradeViews.get(studentProfile.grade) ?? 0) + 1);
        }
      }
      const topGradeEntry = Array.from(gradeViews.entries()).sort((a, b) => b[1] - a[1])[0];

      return {
        subject,
        titlesCount: subResources.length,
        totalViews: subViews.length,
        uniqueReaders,
        avgCompletionPct: avgCompletion,
        bookmarksCount: subBookmarks,
        topGrade: topGradeEntry ? `Grade ${topGradeEntry[0]}` : 'All Grades',
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);

  // ── Material Type Matrix ──
  const typeMap = new Map<string, any[]>();
  for (const r of resources) {
    const typeLabel = formatTypeLabel(r.material_type);
    if (!typeMap.has(typeLabel)) typeMap.set(typeLabel, []);
    typeMap.get(typeLabel)!.push(r);
  }

  const materialTypeMatrix = Array.from(typeMap.entries())
    .map(([type, typeResources]) => {
      const typeResIds = new Set(typeResources.map((r) => r.id));
      const typeViews = views.filter((v) => typeResIds.has(v.resource_id)).length;
      const typeProgress = (allProgressData ?? [])
        .filter((p) => typeResIds.has(p.resource_id))
        .map((p) => p.progress_pct);
      const avgProg =
        typeProgress.length > 0
          ? Math.round(typeProgress.reduce((a, b) => a + b, 0) / typeProgress.length)
          : 0;

      return {
        type,
        titlesCount: typeResources.length,
        totalViews: typeViews,
        viewSharePct: views.length > 0 ? Math.round((typeViews / views.length) * 100) : 0,
        avgProgressPct: avgProg,
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);

  // ── Top 15 Most Engaged Resources ──
  const viewCountByRes = new Map<string, number>();
  const readersByRes = new Map<string, Set<string>>();
  for (const v of views) {
    viewCountByRes.set(v.resource_id, (viewCountByRes.get(v.resource_id) ?? 0) + 1);
    if (!readersByRes.has(v.resource_id)) readersByRes.set(v.resource_id, new Set());
    readersByRes.get(v.resource_id)!.add(v.user_id);
  }

  const progressByRes = new Map<string, number[]>();
  const completionsByRes = new Map<string, number>();
  for (const p of allProgressData ?? []) {
    if (!progressByRes.has(p.resource_id)) progressByRes.set(p.resource_id, []);
    progressByRes.get(p.resource_id)!.push(p.progress_pct);
    if (p.progress_pct >= 80) {
      completionsByRes.set(p.resource_id, (completionsByRes.get(p.resource_id) ?? 0) + 1);
    }
  }

  const topResources = resources
    .map((r) => {
      const pList = progressByRes.get(r.id) ?? [];
      const avg =
        pList.length > 0 ? Math.round(pList.reduce((a, b) => a + b, 0) / pList.length) : 0;
      const targetGrades = formatGradeLabel(r.resource_grade_access);

      return {
        id: r.id,
        title: r.title,
        subject: (r.subjects as any)?.name || 'General',
        materialType: formatTypeLabel(r.material_type),
        targetGrades,
        views: viewCountByRes.get(r.id) ?? 0,
        uniqueReaders: readersByRes.get(r.id)?.size ?? 0,
        avgProgressPct: avg,
        completionsCount: completionsByRes.get(r.id) ?? 0,
      };
    })
    .sort((a, b) => b.views - a.views || b.completionsCount - a.completionsCount)
    .slice(0, 15)
    .map((item, idx) => ({
      rank: idx + 1,
      title: item.title,
      subject: item.subject,
      materialType: item.materialType,
      targetGrades: item.targetGrades,
      views: item.views,
      uniqueReaders: item.uniqueReaders,
      avgProgressPct: item.avgProgressPct,
      completionsCount: item.completionsCount,
    }));

  // ── Student Honor Roll (Top 10 Readers) ──
  const studentHonorRoll = students
    .map((s) => {
      const pList = progressByStudent.get(s.id) ?? [];
      const avg =
        pList.length > 0 ? Math.round(pList.reduce((a, b) => a + b, 0) / pList.length) : 0;
      const completed = completedBooksByStudent.get(s.id) ?? 0;
      const totalV = studentViewCounts.get(s.id) ?? 0;

      // Find last active
      const userViews = views
        .filter((v) => v.user_id === s.id)
        .map((v) => v.viewed_at)
        .sort();
      const lastActive = userViews.length > 0 ? userViews[userViews.length - 1] : null;

      return {
        name: s.full_name || 'Unknown',
        grade: s.grade,
        booksCompleted: completed,
        totalViews: totalV,
        avgProgressPct: avg,
        lastActive,
      };
    })
    .sort((a, b) => b.booksCompleted - a.booksCompleted || b.totalViews - a.totalViews)
    .slice(0, 10)
    .map((s, idx) => ({ rank: idx + 1, ...s }));

  // ── Inactive Cohort Breakdown ──
  const inactiveCohort = presentGrades.map((grade) => {
    const gradeStudents = students.filter((s) => s.grade === grade);
    const inactiveInGrade = gradeStudents.filter((s) => !activeReaderIds.has(s.id)).length;
    return {
      grade,
      inactiveCount: inactiveInGrade,
      inactivePct:
        gradeStudents.length > 0 ? Math.round((inactiveInGrade / gradeStudents.length) * 100) : 0,
    };
  });

  // ── 12-Month Trend ──
  const now = new Date();
  const currentMonthStart = monthStart(now);
  const monthKeys = Array.from({ length: 12 }, (_, i) => addMonths(currentMonthStart, i - 11));
  const monthlyTrend = monthKeys.map((m) => {
    const mStart = monthStart(m);
    const mEnd = addMonths(mStart, 1);
    return {
      month: formatMonthLabel(mStart),
      views: views.filter((v) => {
        const d = new Date(v.viewed_at);
        return d >= mStart && d < mEnd;
      }).length,
      uploads: resources.filter((r) => {
        const d = new Date(r.created_at);
        return d >= mStart && d < mEnd;
      }).length,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    schoolName,
    period: {
      from: params.from ?? null,
      to: params.to ?? null,
    },
    summary: {
      totalStudents: students.length,
      activeStudents,
      inactiveStudents,
      staffCount: staff.length,
      totalResources: resources.length,
      publishedResources: resources.filter((r) => r.published).length,
      draftResources: resources.filter((r) => !r.published).length,
      totalPagesDigitized,
      totalStorageMB,
      totalViews: views.length,
      activeReaders: activeReaderIds.size,
      participationRate,
      averageProgressPct,
      completedBooksCount: totalCompletedBooks,
      cohortCompletionRate,
      totalBookmarks: allBookmarksData?.length ?? 0,
      totalAnnotations: allAnnotationsData?.length ?? 0,
    },
    gradeMatrix,
    subjectMatrix,
    materialTypeMatrix,
    topResources,
    studentHonorRoll,
    inactiveCohort,
    monthlyTrend,
  };
}

// ─── All-Students Report ──────────────────────────────────────────────────────

export async function getAllStudentsReportData(
  params: ReportParams = {},
): Promise<AllStudentsReportData> {
  const supabase = await createClient();
  const { from, to } = buildDateFilter(params);
  const schoolName = await getSchoolName(supabase);

  const [students, viewsData, progressData, bookmarksData, annotationsData, resourcesData] =
    await Promise.all([
      fetchAllRows((from, to) =>
        supabase
          .from('profiles')
          .select('id, full_name, email, grade, is_active, created_at')
          .eq('role', 'student')
          .order('grade', { ascending: true })
          .order('full_name', { ascending: true })
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase.from('resource_views').select('user_id, resource_id, viewed_at').range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from('reading_progress')
          .select('user_id, resource_id, progress_pct, last_page, last_viewed_at')
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase.from('bookmarks').select('user_id, resource_id').range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase.from('resource_annotations').select('user_id, resource_id').range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from('resources')
          .select('id, subjects(name)')
          .eq('is_active', true)
          .range(from, to),
      ),
    ]);
  const resourceSubjectMap = new Map(
    (resourcesData ?? []).map((r: any) => [r.id, r.subjects?.name || 'General']),
  );

  // Pre-index by user_id
  const viewsByUser = new Map<string, { resource_id: string; viewed_at: string }[]>();
  for (const v of viewsData ?? []) {
    if (!inRange(v.viewed_at, from, to)) continue;
    if (!viewsByUser.has(v.user_id)) viewsByUser.set(v.user_id, []);
    viewsByUser.get(v.user_id)!.push(v);
  }

  const progressByUser = new Map<string, any[]>();
  for (const p of progressData ?? []) {
    if (!progressByUser.has(p.user_id)) progressByUser.set(p.user_id, []);
    progressByUser.get(p.user_id)!.push(p);
  }

  const bookmarksByUser = new Map<string, number>();
  for (const b of bookmarksData ?? []) {
    bookmarksByUser.set(b.user_id, (bookmarksByUser.get(b.user_id) ?? 0) + 1);
  }

  const annotationsByUser = new Map<string, number>();
  for (const a of annotationsData ?? []) {
    annotationsByUser.set(a.user_id, (annotationsByUser.get(a.user_id) ?? 0) + 1);
  }

  const rawRows = students.map((s) => {
    const userViews = viewsByUser.get(s.id) ?? [];
    const uniqueBooksRead = new Set(userViews.map((v) => v.resource_id)).size;
    const userProgress = progressByUser.get(s.id) ?? [];

    const progressValues = userProgress.map((p) => p.progress_pct);
    const avgProgressPct =
      progressValues.length > 0
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : 0;

    const estimatedPagesRead = userProgress.reduce((sum, p) => sum + (p.last_page || 0), 0);
    const booksCompleted = userProgress.filter((p) => p.progress_pct >= 80).length;
    const booksInProgress = userProgress.filter(
      (p) => p.progress_pct >= 15 && p.progress_pct < 80,
    ).length;
    const booksStarted = userProgress.filter(
      (p) => p.progress_pct > 0 && p.progress_pct < 15,
    ).length;

    // Top primary subject for this student
    const subCount = new Map<string, number>();
    for (const v of userViews) {
      const sName = resourceSubjectMap.get(v.resource_id) || 'General';
      subCount.set(sName, (subCount.get(sName) ?? 0) + 1);
    }
    const topSub = Array.from(subCount.entries()).sort((a, b) => b[1] - a[1])[0];

    // Engagement Level classification
    let engagementLevel: 'High' | 'Moderate' | 'Low' | 'Inactive' = 'Inactive';
    if (booksCompleted >= 2 || userViews.length >= 10) {
      engagementLevel = 'High';
    } else if (userViews.length >= 3 || booksCompleted >= 1) {
      engagementLevel = 'Moderate';
    } else if (userViews.length >= 1) {
      engagementLevel = 'Low';
    }

    const viewTimestamps = userViews.map((v) => v.viewed_at).sort();
    const lastActive = viewTimestamps.length > 0 ? viewTimestamps[viewTimestamps.length - 1] : null;

    return {
      name: s.full_name ?? 'Unknown',
      grade: s.grade,
      email: s.email,
      status: (s.is_active ? 'active' : 'inactive') as 'active' | 'inactive',
      engagementLevel,
      uniqueBooksRead,
      totalViews: userViews.length,
      estimatedPagesRead,
      avgProgressPct,
      booksCompleted,
      booksInProgress,
      booksStarted,
      bookmarkCount: bookmarksByUser.get(s.id) ?? 0,
      notesCount: annotationsByUser.get(s.id) ?? 0,
      primarySubject: topSub ? topSub[0] : '-',
      lastActive,
      joinedAt: s.created_at,
    };
  });

  // Sort by completed books desc, views desc, name asc, then assign rank
  rawRows.sort(
    (a, b) =>
      b.booksCompleted - a.booksCompleted ||
      b.totalViews - a.totalViews ||
      a.name.localeCompare(b.name),
  );

  const studentRows: StudentReportRow[] = rawRows.map((row, idx) => ({
    rank: idx + 1,
    ...row,
  }));

  const activeCohortCount = studentRows.filter((s) => s.engagementLevel !== 'Inactive').length;
  const totalCohortViews = studentRows.reduce((sum, s) => sum + s.totalViews, 0);
  const totalCohortCompletions = studentRows.reduce((sum, s) => sum + s.booksCompleted, 0);
  const allCohortAvgList = studentRows.filter((s) => s.totalViews > 0).map((s) => s.avgProgressPct);
  const avgCohortProgress =
    allCohortAvgList.length > 0
      ? Math.round(allCohortAvgList.reduce((a, b) => a + b, 0) / allCohortAvgList.length)
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    schoolName,
    period: { from: params.from ?? null, to: params.to ?? null },
    summary: {
      totalCohort: studentRows.length,
      activeCohort: activeCohortCount,
      totalCohortViews,
      avgCohortProgress,
      totalCohortCompletions,
    },
    students: studentRows,
  };
}

// ─── Individual Student Report ────────────────────────────────────────────────

export async function getIndividualStudentReportData(
  studentId: string,
  params: ReportParams = {},
): Promise<IndividualStudentReportData> {
  const supabase = await createClient();
  const { from, to } = buildDateFilter(params);
  const schoolName = await getSchoolName(supabase);

  const [{ data: profileData }, viewsData, progressData, bookmarksData, annotationsData] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, grade, is_active, created_at')
        .eq('id', studentId)
        .single(),
      fetchAllRows((from, to) =>
        supabase
          .from('resource_views')
          .select('resource_id, viewed_at')
          .eq('user_id', studentId)
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from('reading_progress')
          .select('resource_id, progress_pct, last_page, last_viewed_at')
          .eq('user_id', studentId)
          .range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase.from('bookmarks').select('resource_id').eq('user_id', studentId).range(from, to),
      ),
      fetchAllRows((from, to) =>
        supabase
          .from('resource_annotations')
          .select('resource_id, page_number')
          .eq('user_id', studentId)
          .range(from, to),
      ),
    ]);

  // Filter views by date range
  const filteredViews = (viewsData ?? []).filter((v) => inRange(v.viewed_at, from, to));
  const accessedResourceIds = new Set(filteredViews.map((v) => v.resource_id));

  // All resources student interacted with
  const allResourceIds = Array.from(
    new Set([
      ...accessedResourceIds,
      ...(progressData ?? []).map((p) => p.resource_id),
      ...(bookmarksData ?? []).map((b) => b.resource_id),
    ]),
  );

  const resources: any[] = [];
  if (allResourceIds.length > 0) {
    const ID_BATCH_SIZE = 500;
    const batchPromises = [];
    for (let i = 0; i < allResourceIds.length; i += ID_BATCH_SIZE) {
      const batch = allResourceIds.slice(i, i + ID_BATCH_SIZE);
      batchPromises.push(
        supabase
          .from('resources')
          .select('id, title, material_type, page_count, subjects(name)')
          .in('id', batch)
          .eq('is_active', true)
          .range(0, 999),
      );
    }
    const results = await Promise.all(batchPromises);
    for (const r of results) {
      if (r.data) resources.push(...r.data);
    }
  }

  // Lookup maps
  const viewCountByRes = new Map<string, number>();
  for (const v of filteredViews) {
    viewCountByRes.set(v.resource_id, (viewCountByRes.get(v.resource_id) ?? 0) + 1);
  }

  const progressByRes = new Map<
    string,
    { progress_pct: number; last_page: number | null; last_viewed_at: string | null }
  >();
  for (const p of progressData ?? []) {
    progressByRes.set(p.resource_id, {
      progress_pct: p.progress_pct,
      last_page: p.last_page,
      last_viewed_at: p.last_viewed_at,
    });
  }

  const bookmarkSet = new Set((bookmarksData ?? []).map((b) => b.resource_id));
  const annotationCountByRes = new Map<string, number>();
  for (const a of annotationsData ?? []) {
    annotationCountByRes.set(a.resource_id, (annotationCountByRes.get(a.resource_id) ?? 0) + 1);
  }

  // Build resource transcript
  const resourceTranscript = resources
    .map((r) => {
      const prog = progressByRes.get(r.id);
      const viewsCount = viewCountByRes.get(r.id) ?? 0;
      const pct = prog?.progress_pct ?? 0;

      let readingStatus: 'Completed' | 'In Progress' | 'Started' = 'Started';
      if (pct >= 80) readingStatus = 'Completed';
      else if (pct >= 15) readingStatus = 'In Progress';

      const readingDepth =
        prog?.last_page != null && r.page_count != null && r.page_count > 0
          ? `Page ${prog.last_page} of ${r.page_count}`
          : prog?.last_page != null
            ? `Page ${prog.last_page}`
            : pct > 0
              ? `${pct}% read`
              : viewsCount > 0
                ? `${viewsCount} view(s)`
                : '-';

      return {
        title: r.title,
        subject: r.subjects?.name || 'General',
        materialType: formatTypeLabel(r.material_type),
        readingStatus,
        progressPct: pct,
        readingDepth,
        timesViewed: viewsCount,
        isBookmarked: bookmarkSet.has(r.id),
        annotationsCount: annotationCountByRes.get(r.id) ?? 0,
        lastReadDate: prog?.last_viewed_at ?? null,
      };
    })
    .sort((a, b) => b.timesViewed - a.timesViewed || b.progressPct - a.progressPct);

  // Subject Breakdown
  const subjectGroups = new Map<string, typeof resourceTranscript>();
  for (const item of resourceTranscript) {
    if (!subjectGroups.has(item.subject)) subjectGroups.set(item.subject, []);
    subjectGroups.get(item.subject)!.push(item);
  }

  const subjectBreakdown = Array.from(subjectGroups.entries())
    .map(([subject, items]) => {
      const totalV = items.reduce((sum, item) => sum + item.timesViewed, 0);
      const avgProg = Math.round(
        items.reduce((sum, item) => sum + item.progressPct, 0) / items.length,
      );
      const completed = items.filter((item) => item.progressPct >= 80).length;

      return {
        subject,
        booksAccessed: items.length,
        totalViews: totalV,
        avgProgressPct: avgProg,
        completedCount: completed,
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);

  // Academic Overview metrics
  const progressList = (progressData ?? []).map((p) => p.progress_pct);
  const overallCompletionRate =
    progressList.length > 0
      ? Math.round(progressList.reduce((a, b) => a + b, 0) / progressList.length)
      : 0;

  const estimatedPagesRead = (progressData ?? []).reduce((sum, p) => sum + (p.last_page || 0), 0);
  const booksMastered = progressList.filter((p) => p >= 80).length;
  const booksInProgress = progressList.filter((p) => p >= 15 && p < 80).length;
  const booksStarted = progressList.filter((p) => p > 0 && p < 15).length;

  const primarySub = subjectBreakdown[0]?.subject || 'None';

  let readingConsistency: 'Highly Active' | 'Active' | 'Occasional' | 'Needs Attention' =
    'Needs Attention';
  if (filteredViews.length >= 15 || booksMastered >= 3) {
    readingConsistency = 'Highly Active';
  } else if (filteredViews.length >= 5 || booksMastered >= 1) {
    readingConsistency = 'Active';
  } else if (filteredViews.length >= 1) {
    readingConsistency = 'Occasional';
  }

  let engagementLevel: 'High' | 'Moderate' | 'Low' | 'Inactive' = 'Inactive';
  if (booksMastered >= 2 || filteredViews.length >= 10) {
    engagementLevel = 'High';
  } else if (filteredViews.length >= 3 || booksMastered >= 1) {
    engagementLevel = 'Moderate';
  } else if (filteredViews.length >= 1) {
    engagementLevel = 'Low';
  }

  const viewTimestamps = filteredViews.map((v) => v.viewed_at).sort();
  const lastActive = viewTimestamps.length > 0 ? viewTimestamps[viewTimestamps.length - 1] : null;

  // Generate learning insights
  const learningInsights: string[] = [];
  if (primarySub !== 'None') {
    learningInsights.push(
      `Primary academic focus is ${primarySub}, accounting for ${subjectBreakdown[0]?.booksAccessed} explored titles.`,
    );
  }
  if (booksMastered > 0) {
    learningInsights.push(
      `Demonstrated subject mastery with ${booksMastered} book(s) completed with >= 80% progress.`,
    );
  }
  if (booksInProgress > 0) {
    learningInsights.push(
      `Currently actively studying ${booksInProgress} learning resource(s) in progress.`,
    );
  }
  if (annotationsData && annotationsData.length > 0) {
    learningInsights.push(
      `Active study habits demonstrated with ${annotationsData.length} personal annotations & study notes saved.`,
    );
  }
  if (filteredViews.length === 0) {
    learningInsights.push(
      'No reading sessions recorded during the selected period. Follow-up and encouragement recommended.',
    );
  } else {
    learningInsights.push(
      `Recorded ${filteredViews.length} interactive reading session(s) covering an estimated ${estimatedPagesRead} pages.`,
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    schoolName,
    period: { from: params.from ?? null, to: params.to ?? null },
    profile: {
      name: profileData?.full_name ?? 'Unknown',
      studentId: profileData?.id ? profileData.id.slice(0, 8).toUpperCase() : 'N/A',
      email: profileData?.email ?? null,
      grade: profileData?.grade ?? null,
      status: profileData?.is_active ? 'active' : 'inactive',
      joinedAt: profileData?.created_at ?? new Date().toISOString(),
      lastActive,
      engagementLevel,
    },
    academicOverview: {
      totalReadingSessions: filteredViews.length,
      uniqueBooksRead: accessedResourceIds.size,
      estimatedPagesRead,
      overallCompletionRate,
      booksMastered,
      booksInProgress,
      booksStarted,
      savedBookmarks: bookmarksData?.length ?? 0,
      notesAndAnnotations: annotationsData?.length ?? 0,
      primarySubject: primarySub,
      readingConsistency,
    },
    subjectBreakdown,
    resourceTranscript,
    learningInsights,
  };
}
