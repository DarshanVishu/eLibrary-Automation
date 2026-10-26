import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import {
  adminDemoteStudents,
  adminPromoteStudents,
  updateGradeAccessBypass,
} from '@/app/admin/settings/actions';
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
  revalidateTag: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// ── adminPromoteStudents ──────────────────────────────────────────────────────
describe('adminPromoteStudents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success when RPC succeeds', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await adminPromoteStudents();

    expect(result.success).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('admin_promote_students');
  });

  it('returns error when RPC fails', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    });

    const result = await adminPromoteStudents();

    expect(result.success).toBe(false);
    expect(result.error).toBe('RPC error');
  });
});

// ── adminDemoteStudents ──────────────────────────────────────────────────────
describe('adminDemoteStudents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success when password is correct and RPC succeeds', async () => {
    mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: null });
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

    const result = await adminDemoteStudents('correct-pass');

    expect(result.success).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('admin_demote_students');
  });

  it('returns error when password is incorrect', async () => {
    mockSupabase.auth.signInWithPassword = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } });

    const result = await adminDemoteStudents('wrong-pass');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Incorrect password.');
  });

  it('returns error when RPC fails after valid password', async () => {
    mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: null });
    mockSupabase.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' },
    });

    const result = await adminDemoteStudents('correct-pass');

    expect(result.success).toBe(false);
    expect(result.error).toBe('RPC failed');
  });
});

// ── updateGradeAccessBypass ──────────────────────────────────────────────────
describe('updateGradeAccessBypass', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates allow_all_grades_access on app_settings', async () => {
    const maybeSingleFn = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
    const selectFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });

    mockSupabase.from = vi.fn().mockReturnValue({
      update: updateFn,
    });

    const result = await updateGradeAccessBypass(true);

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith({ allow_all_grades_access: true });
    expect(eqFn).toHaveBeenCalledWith('id', 1);
  });

  it('inserts row if id 1 does not exist yet', async () => {
    const maybeSingleFn = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectFn = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFn });
    const eqFn = vi.fn().mockReturnValue({ select: selectFn });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    const insertFn = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi.fn().mockReturnValue({
      update: updateFn,
      insert: insertFn,
    });

    const result = await updateGradeAccessBypass(true);

    expect(result.success).toBe(true);
    expect(insertFn).toHaveBeenCalledWith({ id: 1, allow_all_grades_access: true });
  });
});
