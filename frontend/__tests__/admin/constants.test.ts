import { ADMIN_CHART_COLORS, ADMIN_ROUTES, DEFAULT_GRADE_ACCESS } from '@/lib/constants/admin';
import { describe, expect, it } from 'vitest';

// ─── ADMIN_ROUTES ────────────────────────────────────────────────────────────
describe('ADMIN_ROUTES', () => {
  it('has all expected route keys', () => {
    const expectedKeys = ['dashboard', 'analytics', 'approvals', 'library', 'users', 'settings'];
    expect(Object.keys(ADMIN_ROUTES).sort()).toEqual(expectedKeys.sort());
  });

  it('all routes start with /admin', () => {
    Object.values(ADMIN_ROUTES).forEach((route) => {
      expect(route).toMatch(/^\/admin/);
    });
  });

  it('has correct specific paths', () => {
    expect(ADMIN_ROUTES.dashboard).toBe('/admin');
    expect(ADMIN_ROUTES.analytics).toBe('/admin/analytics');
    expect(ADMIN_ROUTES.approvals).toBe('/admin/approvals');
    expect(ADMIN_ROUTES.library).toBe('/admin/library');
    expect(ADMIN_ROUTES.users).toBe('/admin/users');
    expect(ADMIN_ROUTES.settings).toBe('/admin/settings');
  });
});

// ─── DEFAULT_GRADE_ACCESS ────────────────────────────────────────────────────
describe('DEFAULT_GRADE_ACCESS', () => {
  it('contains grades 1 through 10', () => {
    expect(DEFAULT_GRADE_ACCESS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('has exactly 10 elements', () => {
    expect(DEFAULT_GRADE_ACCESS).toHaveLength(10);
  });
});

// ─── ADMIN_CHART_COLORS ──────────────────────────────────────────────────────
describe('ADMIN_CHART_COLORS', () => {
  it('has 10 entries', () => {
    expect(ADMIN_CHART_COLORS).toHaveLength(10);
  });

  it('all entries are hex color strings', () => {
    ADMIN_CHART_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});
