import { useDebounce } from './useDebounce';
import type { StudentMaterial } from '@/app/student/actions';
import { useState, useMemo } from 'react';

export type SearchFilterMode = 'all' | 'bookmarked' | 'recent';

interface UseSearchOptions {
  items: StudentMaterial[];
  filterMode?: SearchFilterMode;
  userGrade?: number | null;
  /** Explicit query to drive the filtering (e.g. from searchParams) */
  query?: string;
  bypassEnabled?: boolean;
}

/**
 * Centered logic for handling search typing, debouncing, and filtering globally
 * without causing lag everywhere.
 */
export function useSearch({
  items,
  filterMode = 'all',
  userGrade,
  query,
  bypassEnabled = false,
}: UseSearchOptions) {
  // Pure typing state that updates instantly on keystroke.
  const [inputValue, setInputValue] = useState('');

  // Creates a delay so massive array sorting wait until user pauses typing.
  const localDebouncedQuery = useDebounce(inputValue, 300);

  // Fallback to the provided `query` (from URL params) if it exists, otherwise use the hook's own state
  const effectiveQuery = typeof query === 'string' ? query : localDebouncedQuery;

  // Memoizing the results ensures we don't recalculate the array
  // every single render unless the debounced query, grade, or properties actually change.
  const results = useMemo(() => {
    let filtered = items;

    // 1. Grade filtering (Ensures students only see docs they should, unless grade restriction is bypassed)
    if (!bypassEnabled && typeof userGrade === 'number') {
      filtered = filtered.filter(
        (m) => !m.grades || m.grades.length === 0 || m.grades.includes(userGrade),
      );
    }

    // 2. Section-specific structural filters (Allows logic to be fully reused)
    if (filterMode === 'bookmarked') {
      filtered = filtered.filter((m) => m.isBookmarked);
    } else if (filterMode === 'recent') {
      filtered = filtered.filter((m) => m.lastViewed);
    }

    // 3. Optional: Sub-string search matching
    if (!effectiveQuery) {
      return filtered; // Typically on library/bookmarks, we just return the base array
    }

    const q = effectiveQuery.toLowerCase();
    return filtered.filter(
      (m) =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.bookId || '').toLowerCase().includes(q) ||
        (m.subject || '').toLowerCase().includes(q) ||
        (m.materialType || '').toLowerCase().includes(q),
    );
  }, [items, filterMode, userGrade, effectiveQuery, bypassEnabled]);

  return {
    inputValue: typeof query === 'string' ? query : inputValue,
    setInputValue,
    debouncedQuery: effectiveQuery,
    results, // Consistently formatted, performant, filtered results array
  };
}
