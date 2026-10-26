import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import {
  deleteAdminUser,
  editAdminUser,
  manageUserStatus,
  resetUserPassword,
} from '@/app/admin/users/actions';
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

// ── deleteAdminUser ──────────────────────────────────────────────────────────
describe('deleteAdminUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success when edge function succeeds', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: {}, error: null });

    const result = await deleteAdminUser('user-123');

    expect(result.success).toBe(true);
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'delete-user',
      expect.objectContaining({ body: { userId: 'user-123' } }),
    );
  });

  it('returns error when session is missing', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await deleteAdminUser('user-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('returns error when edge function fails', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.functions.invoke = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error('Edge fn error') });

    const result = await deleteAdminUser('user-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Edge fn error');
  });
});

// ── editAdminUser ────────────────────────────────────────────────────────────
describe('editAdminUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates full_name', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await editAdminUser('user-1', { name: 'New Name' });

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'New Name' }));
  });

  it('includes grade when provided', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await editAdminUser('user-1', { name: 'Name', grade: 8 });

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Name', grade: 8 }));
  });

  it('returns error on DB failure', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: new Error('Update failed') });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await editAdminUser('user-1', { name: 'Name' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Update failed');
  });
});

// ── resetUserPassword (full flow with mocked auth) ───────────────────────────
describe('resetUserPassword (mocked)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success for valid password with mocked admin client', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.auth.admin.updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });

    const result = await resetUserPassword('user-1', 'newpass123');

    expect(result.success).toBe(true);
    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', {
      password: 'newpass123',
    });
  });

  it('returns Unauthorized when session is missing', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await resetUserPassword('user-1', 'newpass123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized.');
  });

  it('returns error when admin updateUser fails', async () => {
    mockSupabase.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    });
    mockSupabase.auth.admin.updateUserById = vi
      .fn()
      .mockResolvedValue({ data: null, error: new Error('Auth API error') });

    const result = await resetUserPassword('user-1', 'newpass123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Auth API error');
  });
});

// ── manageUserStatus ─────────────────────────────────────────────────────────
describe('manageUserStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('activates a user', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await manageUserStatus('user-1', true);

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith({ is_active: true });
  });

  it('deactivates a user', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await manageUserStatus('user-1', false);

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith({ is_active: false });
  });

  it('returns error on DB failure', async () => {
    const eqFn = vi.fn().mockResolvedValue({ error: { message: 'DB error' } });
    const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await manageUserStatus('user-1', true);

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });
});
