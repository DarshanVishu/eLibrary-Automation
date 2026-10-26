'use client';

/**
 * WHY THIS PAGE WAS REFACTORED (Fix #2)
 *
 * Same auth + fetch boilerplate copy-pasted from other student pages.
 * useStudentMaterials centralises the pattern. The local `Material` type
 * alias inside the function body was also removed — the type is inferred
 * directly from the materials array which is typed as StudentMaterial[].
 */
import { type StudentMaterial } from '@/app/student/actions';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import { EmptyState } from '@/components/student/student-empty-state';
import { MaterialCard } from '@/components/student/student-material-card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { useSearch } from '@/lib/hooks/useSearch';
import { useStudentMaterials } from '@/lib/hooks/useStudentMaterials';
import { useSearchParams, useRouter } from 'next/navigation';

export default function RecentPage() {
  const router = useRouter();
  const { user, materials = [], bypassEnabled, loading } = useStudentMaterials();
  const userGrade = user?.grade ?? 5;

  const searchParams = useSearchParams();
  const externalQuery = searchParams.get('q') || '';

  const { results } = useSearch({
    items: materials,
    filterMode: 'recent',
    userGrade,
    query: externalQuery,
    bypassEnabled,
  });

  if (loading) return <FullScreenLoading />;
  if (!user) return null;

  const recentlyViewedBaseCount = materials.filter(
    (m) =>
      m.lastViewed &&
      (bypassEnabled || !m.grades || m.grades.length === 0 || m.grades.includes(userGrade)),
  ).length;
  const filtered = [...results].sort((a: StudentMaterial, b: StudentMaterial) =>
    b.lastViewed! > a.lastViewed! ? 1 : -1,
  );

  const bySubject = filtered.reduce<Record<string, StudentMaterial[]>>((acc, m) => {
    if (!acc[m.subject]) acc[m.subject] = [];
    acc[m.subject].push(m);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-4">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <Icon name="clock" size="md" filled />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Recently Viewed</h1>
          <p className="text-muted-foreground text-sm">
            {recentlyViewedBaseCount} {recentlyViewedBaseCount === 1 ? 'material' : 'materials'} ·
            Grade {userGrade}
          </p>
        </div>
      </header>

      {/* Content */}
      {recentlyViewedBaseCount === 0 ? (
        <EmptyState
          icon="clock"
          title="No reading history yet"
          description="Open your first book from the library and it will appear here."
          action={{
            label: 'Browse Library',
            onClick: () => router.push('/student/library'),
            icon: 'library',
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matches found"
          description="Try a different search term to find what you're looking for."
          action={{
            label: 'Clear search',
            onClick: () => {
              if (externalQuery) {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('q');
                router.replace(
                  `/student/recent${params.toString() ? `?${params.toString()}` : ''}`,
                );
              }
            },
            variant: 'outline',
            icon: 'close_small',
          }}
        />
      ) : (
        <section aria-label="Recently viewed materials" className="space-y-8">
          {Object.entries(bySubject).map(([subject, items]) => (
            <div key={subject}>
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="secondary">{subject}</Badge>
                <span className="text-muted-foreground text-sm">
                  {items.length} {items.length === 1 ? 'material' : 'materials'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <MaterialCard
                    key={m.id}
                    {...m}
                    onClick={() => router.push(`/student/viewer/${m.id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
