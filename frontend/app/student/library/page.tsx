'use client';

/**
 * WHY THIS PAGE WAS REFACTORED (Fix #2)
 *
 * Previously this page manually wired up auth + fetch in its own useEffect,
 * with a separate `useCallback`-wrapped `fetchMaterials` so it could also
 * pass it to the <RefreshButton>. That same auth-guard block was copy-pasted
 * from the other student pages.
 *
 * The `useStudentMaterials` hook now owns the auth-guard and initial fetch.
 * The `refetch` function it returns is passed directly to <RefreshButton>,
 * so the refresh behaviour is preserved without any extra boilerplate.
 */
import { type StudentMaterial } from '@/app/student/actions';
import { FilterBar } from '@/components/shared/filter-bar';
import { FullScreenLoading } from '@/components/shared/loading-animation';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { RefreshButton } from '@/components/shared/refresh-button';
import { EmptyState } from '@/components/student/student-empty-state';
import { MaterialCard } from '@/components/student/student-material-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useStudentMaterials } from '@/lib/hooks/useStudentMaterials';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type ProgressStatus = 'Not Started' | 'In Progress' | 'Completed';

function getProgressStatus(progress?: number): ProgressStatus {
  if (progress === undefined || progress === 0) return 'Not Started';
  if (progress >= 100) return 'Completed';
  return 'In Progress';
}

export default function LibraryBrowse() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    materials = [],
    bypassEnabled,
    studentGrade,
    loading,
    refetch,
  } = useStudentMaterials();

  const searchQuery = searchParams.get('q') || '';
  const [selectedSubject, setSelectedSubject] = useState<string | null>(() =>
    searchParams.get('subject'),
  );
  const [selectedMaterialType, setSelectedMaterialType] = useState<string | null>(() =>
    searchParams.get('type'),
  );
  const [selectedProgress, setSelectedProgress] = useState<ProgressStatus | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [page, setPage] = useState(0);
  const filterKey = `${searchQuery}-${selectedSubject}-${selectedMaterialType}-${selectedProgress}-${selectedGrade}-${onlyBookmarked}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
  }

  if (loading) return <FullScreenLoading />;
  if (!user) return null;

  const subjects = Array.from(new Set(materials.map((m: StudentMaterial) => m.subject))).sort();
  const materialTypes = Array.from(
    new Set(materials.map((m: StudentMaterial) => m.materialType)),
  ).sort();

  const updateFilterParam = (key: 'subject' | 'type' | 'q', value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const query = params.toString();
    router.replace(query ? `/student/library?${query}` : '/student/library');
  };

  const filteredMaterials = materials.filter((m: StudentMaterial) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (m.title || '').toLowerCase().includes(q) ||
      (m.bookId || '').toLowerCase().includes(q) ||
      (m.subject || '').toLowerCase().includes(q) ||
      (m.materialType || '').toLowerCase().includes(q);
    const matchesSubject = !selectedSubject || m.subject === selectedSubject;
    const matchesMaterialType = !selectedMaterialType || m.materialType === selectedMaterialType;
    const matchesProgress = !selectedProgress || getProgressStatus(m.progress) === selectedProgress;
    const matchesBookmark = !onlyBookmarked || m.isBookmarked === true;

    let matchesGrade = true;
    if (bypassEnabled && selectedGrade !== 'all') {
      matchesGrade = m.grades.length === 0 || m.grades.includes(parseInt(selectedGrade, 10));
    }

    return (
      matchesSearch &&
      matchesSubject &&
      matchesMaterialType &&
      matchesProgress &&
      matchesBookmark &&
      matchesGrade
    );
  });

  const totalPages = Math.ceil(filteredMaterials.length / 18);
  const pagedMaterials = filteredMaterials.slice(page * 18, (page + 1) * 18);

  const clearAll = () => {
    setSelectedSubject(null);
    setSelectedMaterialType(null);
    setSelectedProgress(null);
    setSelectedGrade('all');
    setOnlyBookmarked(false);

    // Also strip URL-backed filter params.
    const params = new URLSearchParams(searchParams.toString());
    params.delete('subject');
    params.delete('type');
    params.delete('q');
    const query = params.toString();
    router.replace(query ? `/student/library?${query}` : '/student/library');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-4">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <Icon name="library" size="md" filled />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Library</h1>
          <p className="text-muted-foreground text-sm">
            {materials.length} {materials.length === 1 ? 'material' : 'materials'} total
          </p>
        </div>
      </header>

      {/* Filter toolbar */}
      <FilterBar
        search={searchQuery}
        onSearchChange={(v) => updateFilterParam('q', v || null)}
        searchPlaceholder="Search materials..."
        resultCount={filteredMaterials.length}
        resultLabel={filteredMaterials.length === 1 ? 'material' : 'materials'}
        onClearAll={clearAll}
        filters={[
          ...(subjects.length > 0
            ? [
                {
                  key: 'subject',
                  label: 'Subject',
                  icon: 'book' as const,
                  type: 'select' as const,
                  value: selectedSubject,
                  onChange: (v: string | null) => {
                    setSelectedSubject(v);
                    updateFilterParam('subject', v);
                  },
                  options: subjects.map((s) => ({ value: s, label: s })),
                },
              ]
            : []),
          ...(materialTypes.length > 0
            ? [
                {
                  key: 'type',
                  label: 'Material Type',
                  type: 'select' as const,
                  value: selectedMaterialType,
                  onChange: (v: string | null) => {
                    setSelectedMaterialType(v);
                    updateFilterParam('type', v);
                  },
                  options: materialTypes.map((t) => ({ value: t, label: t })),
                },
              ]
            : []),
          ...(bypassEnabled
            ? [
                {
                  key: 'grade',
                  label: 'Grade',
                  type: 'select' as const,
                  value: selectedGrade === 'all' ? null : selectedGrade,
                  onChange: (v: string | null) => setSelectedGrade(v ?? 'all'),
                  options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => ({
                    value: String(g),
                    label: `Class ${g}${g === studentGrade ? ' (My Grade)' : ''}`,
                  })),
                },
              ]
            : []),
          {
            key: 'progress',
            label: 'Progress',
            icon: 'schedule' as const,
            type: 'badge-toggle' as const,
            value: selectedProgress,
            onChange: (v) => setSelectedProgress(v as ProgressStatus | null),
            options: (['Not Started', 'In Progress', 'Completed'] as ProgressStatus[]).map(
              (ps) => ({
                value: ps,
                label: ps,
              }),
            ),
          },
          {
            key: 'bookmarked',
            label: 'Bookmarked',
            type: 'boolean' as const,
            value: onlyBookmarked ? 'true' : null,
            onChange: (v) => setOnlyBookmarked(v === 'true'),
            booleanLabel: 'Saved only',
            booleanIcon: 'bookmark' as const,
            options: [],
          },
        ]}
        actions={<RefreshButton onRefresh={refetch!} />}
      />

      <section aria-label="Library materials">
        {filteredMaterials.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pagedMaterials.map((material: StudentMaterial) => (
                <MaterialCard
                  key={material.id}
                  {...material}
                  onClick={() => router.push(`/student/viewer/${material.id}`)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationBar
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                label={`Showing ${page * 18 + 1}\u2013${Math.min((page + 1) * 18, filteredMaterials.length)} of ${filteredMaterials.length} materials`}
                className="border-t-0 px-0 pt-2 pb-0"
              />
            )}
          </div>
        ) : (
          <EmptyState
            icon="search"
            title="No materials match your filters"
            description="Adjust your search or reset filters to see more."
            action={{
              label: 'Reset filters',
              onClick: clearAll,
              variant: 'outline',
              icon: 'tune',
            }}
          />
        )}
      </section>
    </div>
  );
}
