import { getUsersPageData } from '@/app/admin/users/actions';
import { createClient } from '@/lib/supabase/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('getUsersPageData grade filtering', () => {
  const mockEq = vi.fn().mockReturnThis();
  const mockOr = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockResolvedValue({
    data: [
      {
        id: 'user-1',
        full_name: 'John Grade 5',
        role: 'student',
        grade: 5,
        email: 'john@example.com',
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
      },
    ],
    count: 1,
  });

  const mockSelect = vi.fn().mockReturnValue({
    order: mockOrder,
    eq: mockEq,
    or: mockOr,
    range: mockRange,
  });

  const mockSupabase = {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it('applies grade filter when role is student and grade is specified', async () => {
    const res = await getUsersPageData(0, 'student', 'all', '', '5');

    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(mockEq).toHaveBeenCalledWith('role', 'student');
    expect(mockEq).toHaveBeenCalledWith('grade', 5);
    expect(res.users).toHaveLength(1);
    expect(res.users[0].grade).toBe(5);
  });

  it('does not apply grade filter when grade is all', async () => {
    await getUsersPageData(0, 'student', 'all', '', 'all');

    expect(mockEq).toHaveBeenCalledWith('role', 'student');
    expect(mockEq).not.toHaveBeenCalledWith('grade', expect.anything());
  });
});
