import { createMockSupabase } from '../__mocks__/supabase';
// ── Import AFTER mocks ──────────────────────────────────────────────────────
import {
  deleteNotification,
  markAllAsRead,
  markNotificationAsRead,
  notifyAdminsForUpload,
  notifyStudentsForResource,
  notifyTeacherApproved,
  notifyTeacherRejected,
  sendAnnouncement,
} from '@/lib/actions/notifications';
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

// ── notifyAdminsForUpload ────────────────────────────────────────────────────
describe('notifyAdminsForUpload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success with count from RPC', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: 3, error: null });

    const result = await notifyAdminsForUpload('res-1');

    expect(result).toEqual({ success: true, count: 3 });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('notify_admins_for_upload', {
      p_resource_id: 'res-1',
    });
  });

  it('returns error when RPC fails', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    });

    const result = await notifyAdminsForUpload('res-1');

    expect(result).toEqual({ error: 'RPC error' });
  });
});

// ── notifyTeacherApproved ────────────────────────────────────────────────────
describe('notifyTeacherApproved', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success when resource exists', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: { title: 'My Book', created_by: 'teacher-1' },
      error: null,
    });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'resources') return { select: selectFn };
      if (table === 'notifications') return { insert: insertFn };
      return {};
    });

    const result = await notifyTeacherApproved('res-1');

    expect(result).toEqual({ success: true });
  });

  it('returns error when resource not found', async () => {
    const singleFn = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const result = await notifyTeacherApproved('bad-id');

    expect(result).toEqual({ error: 'Resource not found' });
  });
});

// ── notifyTeacherRejected ────────────────────────────────────────────────────
describe('notifyTeacherRejected', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success when resource exists', async () => {
    const singleFn = vi.fn().mockResolvedValue({
      data: { title: 'My Book', created_by: 'teacher-1' },
      error: null,
    });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'resources') return { select: selectFn };
      if (table === 'notifications') return { insert: insertFn };
      return {};
    });

    const result = await notifyTeacherRejected('res-1');

    expect(result).toEqual({ success: true });
  });

  it('returns error when resource not found', async () => {
    const singleFn = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    mockSupabase.from = vi.fn().mockReturnValue({ select: selectFn });

    const result = await notifyTeacherRejected('bad-id');

    expect(result).toEqual({ error: 'Resource not found' });
  });
});

// ── notifyStudentsForResource ────────────────────────────────────────────────
describe('notifyStudentsForResource', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success with count from RPC', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: 25, error: null });

    const result = await notifyStudentsForResource('res-1');

    expect(result).toEqual({ success: true, count: 25 });
  });

  it('returns error when RPC fails', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Notification error' },
    });

    const result = await notifyStudentsForResource('res-1');

    expect(result).toEqual({ error: 'Notification error' });
  });
});

// ── markNotificationAsRead ───────────────────────────────────────────────────
describe('markNotificationAsRead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success when update succeeds', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const updateFn = vi.fn().mockReturnValue({ eq: eq1 });
    mockSupabase.from = vi.fn().mockReturnValue({ update: updateFn });

    const result = await markNotificationAsRead('notif-1');

    expect(result).toEqual({ success: true });
  });

  it('returns error when not logged in', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await markNotificationAsRead('notif-1');

    expect(result).toEqual({ error: 'Unauthorized' });
  });
});

// ── markAllAsRead ────────────────────────────────────────────────────────────
describe('markAllAsRead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success with count from RPC', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: 5, error: null });

    const result = await markAllAsRead();

    expect(result).toEqual({ success: true, count: 5 });
  });

  it('returns error when not logged in', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await markAllAsRead();

    expect(result).toEqual({ error: 'Unauthorized' });
  });
});

// ── deleteNotification ───────────────────────────────────────────────────────
describe('deleteNotification', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success when delete succeeds', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const deleteFn = vi.fn().mockReturnValue({ eq: eq1 });
    mockSupabase.from = vi.fn().mockReturnValue({ delete: deleteFn });

    const result = await deleteNotification('notif-1');

    expect(result).toEqual({ success: true });
  });

  it('returns error when not logged in', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await deleteNotification('notif-1');

    expect(result).toEqual({ error: 'Unauthorized' });
  });
});

// ── sendAnnouncement ──────────────────────────────────────────────────────────
describe('sendAnnouncement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success with count from RPC', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: 50, error: null });

    const result = await sendAnnouncement('Test Title', 'Test message', 'all');

    expect(result).toEqual({ success: true, count: 50 });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('send_announcement', {
      p_title: 'Test Title',
      p_message: 'Test message',
      p_link: '',
      p_role: 'all',
    });
  });

  it('passes link when provided', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: 10, error: null });

    await sendAnnouncement('Title', 'Msg', 'student', '/announcements');

    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'send_announcement',
      expect.objectContaining({ p_link: '/announcements', p_role: 'student' }),
    );
  });

  it('returns error when RPC fails', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Send failed' },
    });

    const result = await sendAnnouncement('Title', 'Msg', 'all');

    expect(result).toEqual({ error: 'Send failed' });
  });

  it('rejects empty title before RPC', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: 1, error: null });

    const result = await sendAnnouncement('   ', 'Message', 'all');

    expect(result).toEqual({ error: 'Announcement title is required.' });
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('rejects empty message before RPC', async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: 1, error: null });

    const result = await sendAnnouncement('Title', '   ', 'all');

    expect(result).toEqual({ error: 'Announcement message is required.' });
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });
});
