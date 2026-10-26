'use client';

/**
 * WHY THIS PAGE WAS REFACTORED (Fix #2)
 *
 * Previously this page owned its own copy of the auth-guard + fetch cycle:
 *   const [materials, setMaterials] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   useEffect → if (!user) router.replace('/') → getStudentMaterials()...
 *
 * That exact same 10-line block was duplicated in Library, Bookmarks and
 * Recent. A change to the redirect path, toast message, or loading strategy
 * required editing all 4 files. By switching to useStudentMaterials, the
 * auth-guard and fetch logic live in exactly one place.
 */
import { type StudentMaterial } from './actions';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import {
  HeroSection,
  PopularClassesSection,
  AnnouncementsExamsPanel,
  SubjectJumpSection,
} from '@/components/student/dashboard';
import {
  Announcement,
  ExamCountdown,
} from '@/components/student/dashboard/announcements-exams-panel';
import { EmptyState } from '@/components/student/student-empty-state';
import { MaterialCard } from '@/components/student/student-material-card';
import { useSearch } from '@/lib/hooks/useSearch';
import { useStudentMaterials } from '@/lib/hooks/useStudentMaterials';
import { useSearchParams, useRouter } from 'next/navigation';

const getDays = (d: string) =>
  Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const externalQuery = searchParams.get('q') || '';

  const { user, materials = [], bypassEnabled, loading } = useStudentMaterials();
  const userGrade = user?.grade || 5;

  const { results: searchResults } = useSearch({
    items: materials,
    userGrade,
    query: externalQuery,
    bypassEnabled,
  });

  const isSearching = !!externalQuery;

  // Announcements and exams: replace with real queries once DB tables exist.
  const announcements: Announcement[] = [];
  const exams: ExamCountdown[] = [];

  if (loading) return <FullScreenLoading />;
  if (!user) return null;

  const recentlyAdded = materials
    .sort((a, b) => (b.addedDate! > a.addedDate! ? 1 : -1))
    .slice(0, 3);

  const continueReading = [...materials]
    .filter((m) => m.progress && m.progress > 0 && m.progress < 100)
    .sort((a, b) => {
      const aTime = a.lastViewed ? new Date(a.lastViewed).getTime() : 0;
      const bTime = b.lastViewed ? new Date(b.lastViewed).getTime() : 0;
      return bTime - aTime;
    })[0];

  const bookmarkedCount = materials.filter((m) => m.isBookmarked).length;

  const upcomingExam = exams
    .filter((e) => e.grade === userGrade)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // Only render the announcements/exams panel when there is actual content.
  const hasAnnouncements = announcements.some(
    (a) => !a.targetGrades || a.targetGrades.includes(userGrade),
  );
  const hasExams = exams.some((e) => e.grade === userGrade);

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-4">
      {isSearching ? (
        <section aria-label="Search results" className="pt-2">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Search Results</h1>
            <p className="text-muted-foreground text-sm">
              {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'} for &quot;
              {externalQuery}&quot;
            </p>
          </div>

          {searchResults.length === 0 ? (
            <EmptyState
              icon="search"
              title="No matches found"
              description="Try adjusting your search term."
              action={{
                label: 'Clear search',
                onClick: () => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('q');
                  router.replace(`/student${params.toString() ? `?${params.toString()}` : ''}`);
                },
                variant: 'outline',
                icon: 'close_small',
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((m: StudentMaterial) => (
                <MaterialCard
                  key={m.id}
                  {...m}
                  onClick={() => router.push(`/student/viewer/${m.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <HeroSection
            user={user}
            bookmarkedCount={bookmarkedCount}
            recentlyAddedCount={recentlyAdded.length}
            continueReading={continueReading}
            upcomingExam={upcomingExam}
            getDays={getDays}
          />

          <SubjectJumpSection />

          <PopularClassesSection materials={recentlyAdded} userGrade={userGrade} />

          {(hasAnnouncements || hasExams) && (
            <AnnouncementsExamsPanel
              announcements={announcements}
              exams={exams}
              userGrade={userGrade}
              getDays={getDays}
            />
          )}
        </>
      )}
    </div>
  );
}
