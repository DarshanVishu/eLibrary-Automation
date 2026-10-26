import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import { getApprovalsData } from '@/app/admin/approvals/actions';
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

describe('getApprovalsData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns structured approvals and actioned data', async () => {
    // Pending query chain
    const pendingResult = {
      data: [
        {
          id: 'r1',
          title: 'Math Book',
          material_type: 'textbook',
          file_size_bytes: 5242880,
          page_count: 120,
          created_at: '2025-06-15T10:00:00Z',
          subjects: { name: 'Mathematics' },
          profiles: { full_name: 'Teacher A' },
          resource_grade_access: [{ grade: 5 }],
        },
      ],
      error: null,
    };

    // Actioned query chain
    const actionedResult = {
      data: [
        {
          id: 'r2',
          title: 'Science Guide',
          material_type: 'guide',
          file_size_bytes: 1048576,
          page_count: 50,
          updated_at: '2025-06-16T10:00:00Z',
          profiles: { full_name: 'Teacher B' },
          resource_grade_access: [{ grade: 3 }, { grade: 7 }],
        },
      ],
      error: null,
    };

    let fromCallCount = 0;
    mockSupabase.from = vi.fn().mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue(pendingResult),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue(actionedResult),
              }),
            }),
          }),
        }),
      };
    });

    const result = await getApprovalsData();

    expect(result).toHaveProperty('initialApprovals');
    expect(result).toHaveProperty('initialActioned');
    expect(result.initialApprovals).toHaveLength(1);
    expect(result.initialActioned).toHaveLength(1);

    // Verify pending approval mapping
    const pending = result.initialApprovals[0];
    expect(pending.title).toBe('Math Book');
    expect(pending.teacher).toBe('Teacher A');
    expect(pending.subject).toBe('Mathematics');
    expect(pending.grade).toBe('Grade 5');
    expect(pending.type).toBe('Textbook');
    expect(pending.pages).toBe(120);
    expect(pending.size).toBe('5 MB');

    // Verify actioned mapping
    const actioned = result.initialActioned[0];
    expect(actioned.title).toBe('Science Guide');
    expect(actioned.teacher).toBe('Teacher B');
    expect(actioned.grade).toBe('Grades 3–7');
    expect(actioned.status).toBe('approved');
  });

  it('handles empty data gracefully', async () => {
    mockSupabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    });

    const result = await getApprovalsData();

    expect(result.initialApprovals).toEqual([]);
    expect(result.initialActioned).toEqual([]);
  });
});
