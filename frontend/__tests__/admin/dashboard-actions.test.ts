import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import { getAdminDashboardData } from '@/app/admin/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockSupabase = createMockSupabase();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => ({ id: 'admin-id', email: 'admin@test.com' })),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('getAdminDashboardData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all dashboard fields with correct structure', async () => {
    // The function does:
    //   1. from('profiles').select('*').eq('id', user.id).single() — admin profile
    //   2. Promise.all of 7 queries via from(...)
    //      - from('profiles').select(..., head:true).eq('role','student').eq('is_active',true)
    //      - from('resources').select(..., head:true).eq('is_active',true)
    //      - from('resource_views').select(..., head:true)
    //      - from('resources').select(..., head:true).eq('published',false).eq('is_active',true)
    //      - from('resources').select(...).eq('published',false).eq('is_active',true).order().limit()
    //      - from('resources').select('material_type').eq('is_active',true)
    //      - from('resources').select(...).order().limit()

    let fromCallCount = 0;
    mockSupabase.from = vi.fn().mockImplementation(() => {
      fromCallCount++;

      // 1. Admin profile
      if (fromCallCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'admin-id', full_name: 'Admin', role: 'admin' },
                error: null,
              }),
            }),
          }),
        };
      }

      // 2. Students count — .select().eq().eq()
      if (fromCallCount === 2) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 10, data: null, error: null }),
            }),
          }),
        };
      }

      // 3. Resources count — .select().eq()
      if (fromCallCount === 3) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 20, data: null, error: null }),
          }),
        };
      }

      // 4. Views count — .select() (head, no filters)
      if (fromCallCount === 4) {
        return {
          select: vi.fn().mockResolvedValue({ count: 100, data: null, error: null }),
        };
      }

      // 5. Pending count — .select().eq().eq()
      if (fromCallCount === 5) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 3, data: null, error: null }),
            }),
          }),
        };
      }

      // 6. Pending approvals data — .select().eq().eq().order().limit()
      if (fromCallCount === 6) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }

      // 7. Content data — .select().eq().range()
      if (fromCallCount === 7) {
        const query: any = {
          range: vi.fn().mockResolvedValue({
            data: [{ material_type: 'textbook' }],
            error: null,
          }),
          then: (resolve: any) =>
            resolve({
              data: [{ material_type: 'textbook' }],
              error: null,
            }),
        };
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(query),
          }),
        };
      }

      // 8. Recent resources — .select().order().limit()
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });

    const result = await getAdminDashboardData();

    expect(result).toHaveProperty('profile');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('pendingApprovals');
    expect(result).toHaveProperty('contentByType');
    expect(result).toHaveProperty('recentActivity');
    expect(result).toHaveProperty('monthlyActivity');
    expect(result.stats).toHaveLength(4);
  });
});
