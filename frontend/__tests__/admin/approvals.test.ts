import { formatGradeLabel } from '@/lib/utils';
import { describe, expect, it } from 'vitest';

// ─── formatGradeLabel ────────────────────────────────────────────────────────
describe('formatGradeLabel', () => {
  it('returns "All Grades" for null input', () => {
    expect(formatGradeLabel(null)).toBe('All Grades');
  });

  it('returns "All Grades" for undefined input', () => {
    expect(formatGradeLabel(undefined)).toBe('All Grades');
  });

  it('returns "All Grades" for empty array', () => {
    expect(formatGradeLabel([])).toBe('All Grades');
  });

  it('returns "Grade X" for a single grade', () => {
    expect(formatGradeLabel([{ grade: 5 }])).toBe('Grade 5');
  });

  it('returns "Grades X–Y" for multiple grades', () => {
    expect(formatGradeLabel([{ grade: 3 }, { grade: 7 }, { grade: 5 }])).toBe('Grades 3–7');
  });

  it('deduplicates grades', () => {
    expect(formatGradeLabel([{ grade: 4 }, { grade: 4 }, { grade: 4 }])).toBe('Grade 4');
  });

  it('filters out non-numeric grade values', () => {
    expect(formatGradeLabel([{ grade: null }, { grade: undefined }, { grade: 'abc' }])).toBe(
      'All Grades',
    );
  });

  it('handles mixed valid and invalid values', () => {
    expect(formatGradeLabel([{ grade: null }, { grade: 2 }, { grade: 8 }])).toBe('Grades 2–8');
  });
});
