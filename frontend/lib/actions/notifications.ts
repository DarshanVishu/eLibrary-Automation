'use server';

import { requireAuth } from '@/lib/auth';
import { getServiceRoleClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type NotificationType = 'new_upload' | 'approved' | 'rejected' | 'new_material' | 'general';
export type AnnouncementAudience = 'all' | 'student' | 'teacher' | 'admin';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string;
  resource_id: string | null;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

// ── Notify admins when a teacher uploads ──────────────────────────────────────
// Uses notify_admins_for_upload RPC which fetches resource + uploader name and
// batch-inserts notifications for all active admins in one server-side query,
// replacing the previous 3-step sequential fetch → insert pattern.
//
// Primary path: handled by DB trigger trg_notify_admins_on_upload.
// This is the manual fallback for bulk imports or when the trigger is bypassed.
export async function notifyAdminsForUpload(resourceId: string) {
  const supabase = getServiceRoleClient();

  const { data: count, error } = await supabase.rpc('notify_admins_for_upload', {
    p_resource_id: resourceId,
  });

  if (error) return { error: error.message };
  return { success: true, count: count as number };
}

// ── Notify teacher when their upload is approved ──────────────────────────────
// Simple single insert — kept as a direct query (no fan-out, no business logic).
// Primary: handled by DB trigger trg_notify_teacher_on_approval.
export async function notifyTeacherApproved(resourceId: string) {
  const supabase = getServiceRoleClient();

  const { data: resource } = await supabase
    .from('resources')
    .select('title, created_by')
    .eq('id', resourceId)
    .single();

  if (!resource) return { error: 'Resource not found' };

  const { error } = await supabase.from('notifications').insert({
    user_id: resource.created_by,
    title: 'Upload Approved',
    message: `Your upload "${resource.title}" has been approved and is now live in the library.`,
    link: '/teacher/uploads',
    resource_id: resourceId,
    type: 'approved' as NotificationType,
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ── Notify teacher when their upload is rejected ──────────────────────────────
// Simple single insert — kept as a direct query.
// Primary: handled by DB trigger trg_notify_teacher_on_approval.
export async function notifyTeacherRejected(resourceId: string) {
  const supabase = getServiceRoleClient();

  const { data: resource } = await supabase
    .from('resources')
    .select('title, created_by')
    .eq('id', resourceId)
    .single();

  if (!resource) return { error: 'Resource not found' };

  const { error } = await supabase.from('notifications').insert({
    user_id: resource.created_by,
    title: 'Upload Rejected',
    message: `Your upload "${resource.title}" was not approved. Please review and re-upload if needed.`,
    link: '/teacher/uploads',
    resource_id: resourceId,
    type: 'rejected' as NotificationType,
  });

  if (error) return { error: error.message };
  return { success: true };
}

// ── Notify students when a resource is published/approved ─────────────────────
// Uses notify_students_for_resource RPC which resolves target grades, finds
// matching students, and batch-inserts all notifications in a single CTE query,
// replacing the previous 3-step sequential fetch → insert pattern.
export async function notifyStudentsForResource(resourceId: string) {
  const supabase = getServiceRoleClient();

  const { data: count, error } = await supabase.rpc('notify_students_for_resource', {
    p_resource_id: resourceId,
  });

  if (error) return { error: error.message };
  return { success: true, count: count as number };
}

// ── Get notifications for the current user ──────────────────────────────────────
export async function getNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return { error: error.message };

  return { data };
}

// ── Mark a single notification as read ───────────────────────────────────────
// Single-row UPDATE — kept as a direct query.
export async function markNotificationAsRead(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

// ── Mark all notifications as read ───────────────────────────────────────────
// Uses mark_all_notifications_read RPC which atomically bulk-updates all unread
// rows for the calling user in a single server-side statement, avoiding the
// previous pattern of a client-side filter + unbounded UPDATE.
export async function markAllAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: count, error } = await supabase.rpc('mark_all_notifications_read');

  if (error) return { error: error.message };
  return { success: true, count: count as number };
}

// ── Delete a single notification ──────────────────────────────────────────────
// Single-row DELETE — kept as a direct query.
export async function deleteNotification(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

// ── Send an announcement to a target audience ─────────────────────────────────
// Calls the send_announcement DB RPC which fan-out inserts a 'general'
// notification for each active user matching the requested role (or all roles).
// Only admin users may invoke this action.
export async function sendAnnouncement(
  title: string,
  message: string,
  audience: AnnouncementAudience,
  link: string = '',
) {
  await requireAuth('admin');
  const supabase = getServiceRoleClient();
  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  const trimmedLink = link.trim();

  if (!trimmedTitle) return { error: 'Announcement title is required.' };
  if (!trimmedMessage) return { error: 'Announcement message is required.' };

  const { data: count, error } = await supabase.rpc('send_announcement', {
    p_title: trimmedTitle,
    p_message: trimmedMessage,
    p_link: trimmedLink,
    p_role: audience,
  });

  if (error) return { error: error.message };
  return { success: true, count: count as number };
}
