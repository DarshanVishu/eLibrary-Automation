'use client';

/**
 * WHY THIS PAGE WAS REFACTORED (Fix #2)
 *
 * Same auth + fetch boilerplate as Dashboard / Library / Recent was copy-
 * pasted here. useStudentMaterials eliminates the duplication. Because
 * bookmarks are derived from the full materials list (filter isBookmarked),
 * there is no separate API call — refetch is still exposed for future use
 * but the pull-to-refresh button was not present on this page originally.
 */
import { type StudentMaterial } from '@/app/student/actions';
import { FilterBar } from '@/components/shared/filter-bar';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { EmptyState } from '@/components/student/student-empty-state';
import { MaterialCard } from '@/components/student/student-material-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useSearch } from '@/lib/hooks/useSearch';
import { useStudentMaterials } from '@/lib/hooks/useStudentMaterials';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function BookmarksPage() {
  const router = useRouter();
  const { user, materials = [], bypassEnabled, loading } = useStudentMaterials();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const userGrade = typeof user?.grade === 'number' ? user.grade : null;

  const searchParams = useSearchParams();
  const externalQuery = searchParams.get('q') || '';

  // Utilize the custom hook instead of copying/pasting typing logic manually. By setting 'bookmarked'
  // mode alongside `userGrade`, it perfectly centralizes structural filters + string search loops.
  const { results: standardBookmarkedResults } = useSearch({
    items: materials,
    filterMode: 'bookmarked',
    userGrade,
    query: externalQuery,
    bypassEnabled,
  });

  if (loading) return <FullScreenLoading />;
  if (!user) return null;

  // Subjects dropdown data is cleanly generated statically off the base filtered bookmarked array
  // BEFORE the user's specific sub-string searches knock items off the screen
  const staticBookmarksList = materials.filter(
    (m) =>
      m.isBookmarked &&
      (bypassEnabled || !m.grades || m.grades.length === 0 || m.grades.includes(userGrade || 5)),
  );
  const subjects = [...new Set(staticBookmarksList.map((m: StudentMaterial) => m.subject))].sort();

  // Optionally layer on local page overrides (e.g. subject dropdown clicks) alongside hook results
  const filtered = standardBookmarkedResults.filter((m: StudentMaterial) => {
    return !selectedSubject || m.subject === selectedSubject;
  });

  const PAGE_SIZE = 18;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedFiltered = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearAll = () => {
    setSelectedSubject(null);
    setPage(0);
    if (externalQuery) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('q');
      router.replace(`/student/bookmarks${params.toString() ? `?${params.toString()}` : ''}`);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-4">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <Icon name="bookmark" size="md" filled />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Bookmarks</h1>
          <p className="text-muted-foreground text-sm">
            {staticBookmarksList.length}{' '}
            {staticBookmarksList.length === 1 ? 'material' : 'materials'} saved · Grade {userGrade}
          </p>
        </div>
      </header>

      {/* Subject filter toolbar */}
      <FilterBar
        search={externalQuery}
        onSearchChange={(v) => {
          const params = new URLSearchParams(searchParams.toString());
          if (v) {
            params.set('q', v);
          } else {
            params.delete('q');
          }
          router.replace(`/student/bookmarks${params.toString() ? `?${params.toString()}` : ''}`);
        }}
        searchPlaceholder="Search bookmarks..."
        resultCount={filtered.length}
        resultLabel={filtered.length === 1 ? 'bookmark' : 'bookmarks'}
        onClearAll={clearAll}
        filters={[
          ...(subjects.length > 0
            ? [
                {
                  key: 'subject',
                  label: 'Subject',
                  icon: 'book' as const,
                  type: 'toggle-group' as const,
                  value: selectedSubject,
                  onChange: (v: string | null) => {
                    setSelectedSubject(v);
                    setPage(0);
                  },
                  options: subjects.map((s) => ({ value: s, label: s })),
                },
              ]
            : []),
        ]}
      />

      {/* Content */}
      <section aria-label="Bookmarked materials">
        {staticBookmarksList.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="No bookmarks yet"
            description="Tap the bookmark icon while reading any material to save it here."
            action={{
              label: 'Browse Library',
              onClick: () => router.push('/student/library'),
              icon: 'library',
            }}
          />
        ) : (externalQuery || selectedSubject) && filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matches found"
            description="Try adjusting your filters or search term."
            action={{
              label: 'Clear filters',
              onClick: clearAll,
              variant: 'outline',
              icon: 'close_small',
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pagedFiltered.map((m: StudentMaterial) => (
                <MaterialCard
                  key={m.id}
                  {...m}
                  onClick={() => router.push(`/student/viewer/${m.id}`)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationBar
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label={`Showing ${page * PAGE_SIZE + 1}\u2013${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} items`}
                className="border-t-0 px-0 pt-2 pb-0"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
