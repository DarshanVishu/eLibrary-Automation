import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import { bulkCreateUsers, getUsersPageData } from '@/app/admin/users/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockSupabase = createMockSupabase();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));
vi.mock('@/lib/supabase/admin', () => ({
  getServiceRoleClient: vi.fn(() => mockSupabase),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// ── getUsersPageData ──────────────────────────────────────────────────────────
describe('getUsersPageData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps profiles to User interface', async () => {
    const rangeFn = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'u1',
          full_name: 'Alice',
          role: 'student',
          grade: 5,
          email: 'alice@test.com',
          is_active: true,
          updated_at: '2025-06-15T10:00:00Z',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'u2',
          full_name: null,
          role: 'teacher',
          grade: null,
          email: 'bob@test.com',
          is_active: false,
          updated_at: '2025-03-01T10:00:00Z',
          created_at: '2025-01-01T10:00:00Z',
        },
      ],
      count: 2,
      error: null,
    });
    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
    const selectFn = vi.fn().mockReturnValue({ order: orderFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const { users, total } = await getUsersPageData(0, 'all', 'all', '');

    expect(users).toHaveLength(2);
    expect(total).toBe(2);

    // First user
    expect(users[0].id).toBe('u1');
    expect(users[0].name).toBe('Alice');
    expect(users[0].role).toBe('student');
    expect(users[0].grade).toBe(5);
    expect(users[0].status).toBe('active');
    expect(users[0].lastActive).toMatch(/\d{2}\/\d{2}\/\d{4}/);

    // Second user — null full_name
    expect(users[1].name).toBe('No Name');
    expect(users[1].status).toBe('inactive');
  });

  it('returns empty array when no profiles', async () => {
    const rangeFn = vi.fn().mockResolvedValue({ data: null, count: 0, error: null });
    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });
    const selectFn = vi.fn().mockReturnValue({ order: orderFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const { users, total } = await getUsersPageData();

    expect(users).toEqual([]);
    expect(total).toBe(0);
  });
});

// ── bulkCreateUsers ──────────────────────────────────────────────────────────
describe('bulkCreateUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success with results when edge function succeeds', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.functions.invoke = vi.fn().mockResolvedValue({
      data: { results: [{ email: 'a@b.com', success: true }] },
      error: null,
    });

    const result = await bulkCreateUsers([
      { email: 'a@b.com', name: 'Test', role: 'student', grade: '5' },
    ]);

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'bulk-create-users',
      expect.objectContaining({
        body: { users: [{ email: 'a@b.com', name: 'Test', role: 'student', grade: '5' }] },
      }),
    );
  });

  it('returns error when session is missing', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await bulkCreateUsers([{ email: 'a@b.com', name: 'Test', role: 'student' }]);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when edge function fails', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.functions.invoke = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Bulk create failed'),
    });

    const result = await bulkCreateUsers([{ email: 'a@b.com', name: 'Test', role: 'student' }]);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Bulk create failed');
  });
});
