export interface ReportParams {
  from?: string; // ISO date string (inclusive)
  to?: string; // ISO date string (inclusive)
}

// ─── Overall Platform Report ──────────────────────────────────────────────────

export interface OverallReportData {
  generatedAt: string;
  schoolName: string;
  period: { from: string | null; to: string | null };
  summary: {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    staffCount: number; // teachers + admins
    totalResources: number;
    publishedResources: number;
    draftResources: number;
    totalPagesDigitized: number;
    totalStorageMB: string;
    totalViews: number;
    activeReaders: number;
    participationRate: number; // % of students with >= 1 view in range
    averageProgressPct: number;
    completedBooksCount: number; // total books with progress >= 80%
    cohortCompletionRate: number; // % of active readers who completed >= 1 book
    totalBookmarks: number;
    totalAnnotations: number;
  };
  gradeMatrix: {
    grade: number;
    totalStudents: number;
    activeReaders: number;
    participationPct: number;
    totalViews: number;
    avgProgressPct: number;
    completedBooks: number;
    topSubject: string;
  }[];
  subjectMatrix: {
    subject: string;
    titlesCount: number;
    totalViews: number;
    uniqueReaders: number;
    avgCompletionPct: number;
    bookmarksCount: number;
    topGrade: string;
  }[];
  materialTypeMatrix: {
    type: string;
    titlesCount: number;
    totalViews: number;
    viewSharePct: number;
    avgProgressPct: number;
  }[];
  topResources: {
    rank: number;
    title: string;
    subject: string;
    materialType: string;
    targetGrades: string;
    views: number;
    uniqueReaders: number;
    avgProgressPct: number;
    completionsCount: number;
  }[];
  studentHonorRoll: {
    rank: number;
    name: string;
    grade: number | null;
    booksCompleted: number;
    totalViews: number;
    avgProgressPct: number;
    lastActive: string | null;
  }[];
  inactiveCohort: {
    grade: number;
    inactiveCount: number;
    inactivePct: number;
  }[];
  monthlyTrend: { month: string; views: number; uploads: number }[];
}

// ─── All-Students Report ──────────────────────────────────────────────────────

export interface StudentReportRow {
  rank: number;
  name: string;
  grade: number | null;
  email: string | null;
  status: 'active' | 'inactive';
  engagementLevel: 'High' | 'Moderate' | 'Low' | 'Inactive';
  uniqueBooksRead: number;
  totalViews: number;
  estimatedPagesRead: number;
  avgProgressPct: number;
  booksCompleted: number; // progress_pct >= 80
  booksInProgress: number; // 15 <= progress_pct < 80
  booksStarted: number; // progress_pct < 15
  bookmarkCount: number;
  notesCount: number;
  primarySubject: string;
  lastActive: string | null;
  joinedAt: string;
}

export interface AllStudentsReportData {
  generatedAt: string;
  schoolName: string;
  period: { from: string | null; to: string | null };
  summary: {
    totalCohort: number;
    activeCohort: number;
    totalCohortViews: number;
    avgCohortProgress: number;
    totalCohortCompletions: number;
  };
  students: StudentReportRow[];
}

// ─── Individual Student Report ────────────────────────────────────────────────

export interface IndividualStudentReportData {
  generatedAt: string;
  schoolName: string;
  period: { from: string | null; to: string | null };
  profile: {
    name: string;
    studentId: string;
    email: string | null;
    grade: number | null;
    status: 'active' | 'inactive';
    joinedAt: string;
    lastActive: string | null;
    engagementLevel: 'High' | 'Moderate' | 'Low' | 'Inactive';
  };
  academicOverview: {
    totalReadingSessions: number;
    uniqueBooksRead: number;
    estimatedPagesRead: number;
    overallCompletionRate: number; // avg progress pct across all books
    booksMastered: number; // >= 80%
    booksInProgress: number; // 15% - 79%
    booksStarted: number; // < 15%
    savedBookmarks: number;
    notesAndAnnotations: number;
    primarySubject: string;
    readingConsistency: 'Highly Active' | 'Active' | 'Occasional' | 'Needs Attention';
  };
  subjectBreakdown: {
    subject: string;
    booksAccessed: number;
    totalViews: number;
    avgProgressPct: number;
    completedCount: number;
  }[];
  resourceTranscript: {
    title: string;
    subject: string;
    materialType: string;
    readingStatus: 'Completed' | 'In Progress' | 'Started';
    progressPct: number;
    readingDepth: string; // e.g. "Page 45 of 120"
    timesViewed: number;
    isBookmarked: boolean;
    annotationsCount: number;
    lastReadDate: string | null;
  }[];
  learningInsights: string[];
}

export type ReportType = 'overall' | 'all-students' | 'individual';
export type ExportFormat = 'pdf' | 'csv';
