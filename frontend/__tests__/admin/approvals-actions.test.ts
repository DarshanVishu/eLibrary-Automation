import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import { approveResource, rejectResource } from '@/app/admin/approvals/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockSupabase = createMockSupabase();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));
vi.mock('@/lib/supabase/admin', () => ({
  getServiceRoleClient: vi.fn(() => mockSupabase),
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
vi.mock('@/lib/actions/notifications', () => ({
  notifyStudentsForResource: vi.fn(async () => ({ success: true })),
}));

// ── Tests ────────────────────────────────────────────────────────────────────
describe('approveResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success and calls update on supabase', async () => {
    // Set up the mock chain: from().update().eq().select().single()
    const singleFn = vi.fn().mockResolvedValue({
      data: { created_by: 'teacher-id' },
      error: null,
    });
    const selectFn = vi.fn().mockReturnValue({ single: singleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await approveResource('resource-123');

    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('resources');
  });

  it('returns isOwnResource=true when admin is the uploader', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: { created_by: 'admin-id' },
      error: null,
    });
    const selectFn = vi.fn().mockReturnValue({ single: singleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null,
    });

    const result = await approveResource('resource-123');

    expect(result.success).toBe(true);
    expect(result.isOwnResource).toBe(true);
  });

  it('returns error on supabase failure', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    });
    const selectFn = vi.fn().mockReturnValue({ single: singleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await approveResource('bad-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });
});

describe('rejectResource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('soft-deletes the resource by setting is_active=false', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: { created_by: 'teacher-id' },
      error: null,
    });
    const selectFn = vi.fn().mockReturnValue({ single: singleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await rejectResource('resource-123', 'Low quality');

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith({ is_active: false });
  });

  it('returns error on supabase failure', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });
    const selectFn = vi.fn().mockReturnValue({ single: singleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await rejectResource('bad-id', 'reason');

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });
});
