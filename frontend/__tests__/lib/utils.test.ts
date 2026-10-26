import {
  addMonths,
  cn,
  dayStart,
  formatBytes,
  formatCurrency,
  formatDate,
  formatDelta,
  formatMonthLabel,
  formatRelativeTime,
  formatTypeLabel,
  isValidEmail,
  isValidPhone,
  monthStart,
  slugify,
  truncate,
} from '@/lib/utils';
import { describe, expect, it } from 'vitest';

// ─── cn ──────────────────────────────────────────────────────────────────────
describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('strips falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c');
  });
});

// ─── formatCurrency ──────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats a number as INR', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('1,500');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});

// ─── formatDate ──────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formats a Date object to dd/mm/yyyy', () => {
    // Month is 0-indexed: 0 = January
    expect(formatDate(new Date(2025, 0, 5))).toBe('05/01/2025');
  });

  it('formats an ISO date string', () => {
    expect(formatDate('2025-12-25T00:00:00Z')).toMatch(/25\/12\/2025/);
  });
});

// ─── isValidEmail ────────────────────────────────────────────────────────────
describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

// ─── isValidPhone ────────────────────────────────────────────────────────────
describe('isValidPhone', () => {
  it('accepts a valid 10-digit Indian phone number', () => {
    expect(isValidPhone('9876543210')).toBe(true);
  });

  it('rejects a number starting with 5', () => {
    expect(isValidPhone('5876543210')).toBe(false);
  });

  it('rejects a short number', () => {
    expect(isValidPhone('98765')).toBe(false);
  });

  it('handles spaces inside the number', () => {
    expect(isValidPhone('987 654 3210')).toBe(true);
  });
});

// ─── slugify ─────────────────────────────────────────────────────────────────
describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Foo & Bar!')).toBe('foo-bar');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  Trim Me  ')).toBe('trim-me');
  });
});

// ─── truncate ────────────────────────────────────────────────────────────────
describe('truncate', () => {
  it('returns the full text when within length', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and appends ellipsis', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });
});

// ─── formatBytes ─────────────────────────────────────────────────────────────
describe('formatBytes', () => {
  it('returns "0 Bytes" for 0', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });
});

// ─── formatRelativeTime ──────────────────────────────────────────────────────
describe('formatRelativeTime', () => {
  it('returns mins ago for a very recent date', () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - 30);
    expect(formatRelativeTime(now.toISOString())).toMatch(/\d+ mins? ago/);
  });

  it('returns hours ago for a few-hour-old date', () => {
    const d = new Date();
    d.setHours(d.getHours() - 3);
    expect(formatRelativeTime(d.toISOString())).toBe('3 hrs ago');
  });

  it('returns dd/mm/yyyy for dates older than 24 hours', () => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    expect(formatRelativeTime(d.toISOString())).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

// ─── formatTypeLabel ─────────────────────────────────────────────────────────
describe('formatTypeLabel', () => {
  it('replaces underscores with spaces and title-cases', () => {
    expect(formatTypeLabel('question_bank')).toBe('Question Bank');
  });

  it('passes through a single word', () => {
    expect(formatTypeLabel('textbook')).toBe('Textbook');
  });
});

// ─── formatMonthLabel ────────────────────────────────────────────────────────
describe('formatMonthLabel', () => {
  it('returns short month name', () => {
    expect(formatMonthLabel(new Date(2025, 0, 1))).toBe('Jan');
    expect(formatMonthLabel(new Date(2025, 11, 1))).toBe('Dec');
  });
});

// ─── monthStart ──────────────────────────────────────────────────────────────
describe('monthStart', () => {
  it('returns the first day of the month', () => {
    const result = monthStart(new Date(2025, 5, 15));
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(5);
    expect(result.getFullYear()).toBe(2025);
  });
});

// ─── addMonths ───────────────────────────────────────────────────────────────
describe('addMonths', () => {
  it('adds months correctly', () => {
    const result = addMonths(new Date(2025, 0, 1), 3);
    expect(result.getMonth()).toBe(3);
    expect(result.getFullYear()).toBe(2025);
  });

  it('wraps years when needed', () => {
    const result = addMonths(new Date(2025, 10, 1), 3);
    expect(result.getMonth()).toBe(1);
    expect(result.getFullYear()).toBe(2026);
  });
});

// ─── dayStart ────────────────────────────────────────────────────────────────
describe('dayStart', () => {
  it('zeros out hours/minutes/seconds', () => {
    const d = new Date(2025, 5, 15, 13, 45, 30);
    const result = dayStart(d);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

// ─── formatDelta ─────────────────────────────────────────────────────────────
describe('formatDelta', () => {
  it('formats a positive delta with +', () => {
    expect(formatDelta(5, 'views')).toBe('+5 views');
  });

  it('formats a negative delta with -', () => {
    expect(formatDelta(-3, 'views')).toBe('-3 views');
  });

  it('formats zero', () => {
    expect(formatDelta(0, 'views')).toBe('0 views');
  });
});
