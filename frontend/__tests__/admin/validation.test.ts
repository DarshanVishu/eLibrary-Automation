import { changePassword } from '@/app/actions';
import { resetUserPassword } from '@/app/admin/users/actions';
import { describe, expect, it } from 'vitest';

// ─── changePassword input validation ────────────────────────────────────────
// These tests only cover the synchronous validation guards that return before
// hitting Supabase. The actual auth flow requires a real/mocked client.
describe('changePassword input validation', () => {
  it('rejects when both fields are empty', async () => {
    const result = await changePassword('', '');
    expect(result).toEqual({ success: false, error: 'Please fill in all fields.' });
  });

  it('rejects when current password is empty', async () => {
    const result = await changePassword('', 'newpass123');
    expect(result).toEqual({ success: false, error: 'Please fill in all fields.' });
  });

  it('rejects when new password is empty', async () => {
    const result = await changePassword('oldpass', '');
    expect(result).toEqual({ success: false, error: 'Please fill in all fields.' });
  });

  it('rejects when new password is too short', async () => {
    const result = await changePassword('oldpass', '12345');
    expect(result).toEqual({
      success: false,
      error: 'New password must be at least 6 characters.',
    });
  });

  it('rejects when new password is the same as current', async () => {
    const result = await changePassword('samepass', 'samepass');
    expect(result).toEqual({
      success: false,
      error: 'New password must be different from the current password.',
    });
  });
});

// ─── resetUserPassword input validation ──────────────────────────────────────
describe('resetUserPassword input validation', () => {
  it('rejects when password is empty', async () => {
    const result = await resetUserPassword('user-id', '');
    expect(result).toEqual({
      success: false,
      error: 'Password must be at least 6 characters.',
    });
  });

  it('rejects when password is too short', async () => {
    const result = await resetUserPassword('user-id', '123');
    expect(result).toEqual({
      success: false,
      error: 'Password must be at least 6 characters.',
    });
  });
});
