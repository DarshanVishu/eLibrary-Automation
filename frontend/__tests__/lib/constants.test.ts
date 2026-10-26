import {
  CHART_COLORS,
  FEATURES,
  GRADE_MOTTOS,
  PROGRAMS,
  TESTIMONIALS,
} from '@/lib/constants/dashboard';
import { SUBJECT_KEYS, SUBJECT_MAP, SUBJECTS } from '@/lib/constants/subjects';
import { describe, expect, it } from 'vitest';

// ─── GRADE_MOTTOS ────────────────────────────────────────────────────────────
describe('GRADE_MOTTOS', () => {
  it('has entries for grades 1 through 10', () => {
    for (let i = 1; i <= 10; i++) {
      expect(GRADE_MOTTOS[i]).toBeDefined();
      expect(typeof GRADE_MOTTOS[i]).toBe('string');
      expect(GRADE_MOTTOS[i].length).toBeGreaterThan(0);
    }
  });

  it('has exactly 10 entries', () => {
    expect(Object.keys(GRADE_MOTTOS)).toHaveLength(10);
  });
});

// ─── PROGRAMS ────────────────────────────────────────────────────────────────
describe('PROGRAMS', () => {
  it('has 3 programs', () => {
    expect(PROGRAMS).toHaveLength(3);
  });

  it('each program has required fields', () => {
    PROGRAMS.forEach((p) => {
      expect(p).toHaveProperty('icon');
      expect(p).toHaveProperty('label');
      expect(p).toHaveProperty('desc');
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.desc.length).toBeGreaterThan(0);
    });
  });
});

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
describe('TESTIMONIALS', () => {
  it('has 3 testimonials', () => {
    expect(TESTIMONIALS).toHaveLength(3);
  });

  it('each testimonial has valid star rating (1-5)', () => {
    TESTIMONIALS.forEach((t) => {
      expect(t.stars).toBeGreaterThanOrEqual(1);
      expect(t.stars).toBeLessThanOrEqual(5);
    });
  });

  it('each testimonial has name, grade, and text', () => {
    TESTIMONIALS.forEach((t) => {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.grade).toBeGreaterThanOrEqual(1);
      expect(t.grade).toBeLessThanOrEqual(10);
      expect(t.text.length).toBeGreaterThan(0);
    });
  });
});

// ─── FEATURES ────────────────────────────────────────────────────────────────
describe('FEATURES', () => {
  it('has 3 features', () => {
    expect(FEATURES).toHaveLength(3);
  });

  it('each feature has icon and label', () => {
    FEATURES.forEach((f) => {
      expect(f).toHaveProperty('icon');
      expect(f).toHaveProperty('label');
      expect(f.label.length).toBeGreaterThan(0);
    });
  });
});

// ─── CHART_COLORS ────────────────────────────────────────────────────────────
describe('CHART_COLORS', () => {
  it('has 10 color entries', () => {
    expect(CHART_COLORS).toHaveLength(10);
  });

  it('all entries are hex color strings', () => {
    CHART_COLORS.forEach((c) => {
      expect(c).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

// ─── SUBJECTS ────────────────────────────────────────────────────────────────
describe('SUBJECTS', () => {
  it('has 16 subjects configured', () => {
    expect(SUBJECTS).toHaveLength(16);
  });

  it('each subject has all required config fields', () => {
    SUBJECTS.forEach((s) => {
      expect(s.key).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.shortLabel).toBeTruthy();
      expect(s.iconName).toBeTruthy();
      expect(s.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.lightBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  const expectedSubjects = [
    'Mathematics',
    'Science',
    'English',
    'Hindi',
    'Social Science',
    'Computer Science',
    'EVS',
    'Sanskrit',
    'Physical Education',
    'Vocational Education',
    'Kannada',
    'Information Technology',
    'Artificial Intelligence',
    'Art Education',
    'Value Education',
    'General Knowledge',
  ];

  it('contains all expected subjects', () => {
    const keys = SUBJECTS.map((s) => s.key);
    expectedSubjects.forEach((name) => {
      expect(keys).toContain(name);
    });
  });
});

// ─── SUBJECT_MAP ─────────────────────────────────────────────────────────────
describe('SUBJECT_MAP', () => {
  it('provides O(1) lookup by subject name', () => {
    expect(SUBJECT_MAP['Mathematics']).toBeDefined();
    expect(SUBJECT_MAP['Mathematics'].shortLabel).toBe('Maths');
  });

  it('has same length as SUBJECTS array', () => {
    expect(Object.keys(SUBJECT_MAP)).toHaveLength(SUBJECTS.length);
  });
});

// ─── SUBJECT_KEYS ────────────────────────────────────────────────────────────
describe('SUBJECT_KEYS', () => {
  it('matches SUBJECTS keys in order', () => {
    expect(SUBJECT_KEYS).toEqual(SUBJECTS.map((s) => s.key));
  });
});
