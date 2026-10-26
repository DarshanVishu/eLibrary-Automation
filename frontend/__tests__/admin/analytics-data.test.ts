import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import { getAnalyticsData } from '@/app/admin/analytics/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockSupabase = createMockSupabase();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('getAnalyticsData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns analytics with all expected fields', async () => {
    const now = new Date();
    const recentDate = new Date(now);
    recentDate.setDate(recentDate.getDate() - 1);

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        const query: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [{ created_at: recentDate.toISOString(), is_active: true }],
            error: null,
          }),
          then: (resolve: any) =>
            resolve({
              count: 50,
              data: [{ created_at: recentDate.toISOString(), is_active: true }],
              error: null,
            }),
        };
        return query;
      }

      if (table === 'resources') {
        const query: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'r1',
                material_type: 'textbook',
                published: true,
                created_at: recentDate.toISOString(),
                subjects: { name: 'Mathematics' },
              },
              {
                id: 'r2',
                material_type: 'guide',
                published: true,
                created_at: recentDate.toISOString(),
                subjects: { name: 'Science' },
              },
            ],
            error: null,
          }),
          then: (resolve: any) =>
            resolve({
              count: 2,
              data: [
                {
                  id: 'r1',
                  material_type: 'textbook',
                  published: true,
                  created_at: recentDate.toISOString(),
                  subjects: { name: 'Mathematics' },
                },
                {
                  id: 'r2',
                  material_type: 'guide',
                  published: true,
                  created_at: recentDate.toISOString(),
                  subjects: { name: 'Science' },
                },
              ],
              error: null,
            }),
        };
        return query;
      }

      // resource_views
      return {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [
            { resource_id: 'r1', user_id: 'u1', viewed_at: recentDate.toISOString() },
            { resource_id: 'r1', user_id: 'u2', viewed_at: recentDate.toISOString() },
            { resource_id: 'r2', user_id: 'u1', viewed_at: recentDate.toISOString() },
          ],
          error: null,
        }),
        then: (resolve: any) =>
          resolve({
            data: [
              { resource_id: 'r1', user_id: 'u1', viewed_at: recentDate.toISOString() },
              { resource_id: 'r1', user_id: 'u2', viewed_at: recentDate.toISOString() },
              { resource_id: 'r2', user_id: 'u1', viewed_at: recentDate.toISOString() },
            ],
            error: null,
          }),
      };
    });

    const result = await getAnalyticsData();

    // Structure checks
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('monthlyActivity');
    expect(result).toHaveProperty('contentByType');
    expect(result).toHaveProperty('contentBySubject');
    expect(result).toHaveProperty('dailyTrend');

    // Stats
    expect(result.stats).toHaveLength(4);
    expect(result.stats[0].label).toBe('Total Views');
    expect(result.stats[1].label).toBe('Active Students');
    expect(result.stats[2].label).toBe('Resources Published');
    expect(result.stats[3].label).toBe('Total Uploads');

    // Monthly activity has 6 months
    expect(result.monthlyActivity).toHaveLength(6);
    result.monthlyActivity.forEach((m) => {
      expect(m).toHaveProperty('month');
      expect(m).toHaveProperty('views');
      expect(m).toHaveProperty('uploads');
    });

    // Content by type
    expect(result.contentByType.length).toBeGreaterThan(0);
    result.contentByType.forEach((c) => {
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('value');
      expect(c).toHaveProperty('color');
    });

    // Content by subject
    expect(result.contentBySubject.length).toBeGreaterThan(0);

    // Daily trend has 7 days
    expect(result.dailyTrend).toHaveLength(7);
    result.dailyTrend.forEach((d) => {
      expect(d).toHaveProperty('day');
      expect(d).toHaveProperty('views');
      expect(d).toHaveProperty('sessions');
    });
  });

  it('handles empty data gracefully', async () => {
    const emptyQuery: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ count: 0, data: [], error: null }),
      then: (resolve: any) => resolve({ count: 0, data: [], error: null }),
    };
    mockSupabase.from = vi.fn().mockReturnValue(emptyQuery);

    const result = await getAnalyticsData();

    expect(result.stats).toHaveLength(4);
    expect(result.monthlyActivity).toHaveLength(6);
    expect(result.dailyTrend).toHaveLength(7);
  });
});
