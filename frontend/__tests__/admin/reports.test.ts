import { SUBJECTS } from '@/lib/constants/subjects';
import { describe, it, expect } from 'vitest';

describe('Report Subject Short Formatting & Validation', () => {
  // Strict mapping for the 16 actual subjects in the database
  const dbSubjectShortMap: Record<string, string> = {
    mathematics: 'Maths',
    science: 'Science',
    english: 'English',
    hindi: 'Hindi',
    'social science': 'Social Sci',
    'computer science': 'CS',
    sanskrit: 'Sanskrit',
    evs: 'EVS',
    'physical education': 'Physical Ed',
    'vocational education': 'Vocational',
    kannada: 'Kannada',
    'information technology': 'IT',
    'artificial intelligence': 'AI',
    'art education': 'Art',
    'value education': 'Value Ed',
    'general knowledge': 'GK',
  };

  function formatSubjectShort(name: string | null | undefined): string {
    if (!name) return '-';
    const clean = name.trim();
    const lower = clean.toLowerCase();
    return dbSubjectShortMap[lower] || clean;
  }

  it('correctly maps Computer Science to CS', () => {
    expect(formatSubjectShort('Computer Science')).toBe('CS');
    expect(formatSubjectShort('computer science')).toBe('CS');
  });

  it('correctly maps Social Science to Social Sci', () => {
    expect(formatSubjectShort('Social Science')).toBe('Social Sci');
    expect(formatSubjectShort('social science')).toBe('Social Sci');
  });

  it('correctly maps Artificial Intelligence to AI', () => {
    expect(formatSubjectShort('Artificial Intelligence')).toBe('AI');
  });

  it('correctly maps Information Technology to IT', () => {
    expect(formatSubjectShort('Information Technology')).toBe('IT');
  });

  it('correctly maps Physical Education to Physical Ed', () => {
    expect(formatSubjectShort('Physical Education')).toBe('Physical Ed');
  });

  it('handles null, undefined, or unknown subjects gracefully', () => {
    expect(formatSubjectShort(null)).toBe('-');
    expect(formatSubjectShort(undefined)).toBe('-');
    expect(formatSubjectShort('')).toBe('-');
    expect(formatSubjectShort('Astronomy')).toBe('Astronomy');
  });

  it('covers all 16 database subjects in SUBJECTS constants', () => {
    expect(SUBJECTS).toHaveLength(16);
    for (const sub of SUBJECTS) {
      const formatted = formatSubjectShort(sub.key);
      expect(formatted).not.toBe('-');
      expect(formatted.length).toBeGreaterThan(0);
    }
  });
});
