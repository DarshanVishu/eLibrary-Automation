-- ============================================================
-- Notifications System
-- ============================================================

-- 1. Create notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  link text not null default '',
  resource_id uuid references public.resources(id) on delete cascade,
  type text not null default 'general'
    check (type in ('new_upload', 'approved', 'rejected', 'new_material', 'general')),
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- 2. Indexes
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id, is_read) where is_read = false;

-- 3. Enable RLS
alter table public.notifications enable row level security;

-- 4. RLS Policies
-- Users can only see their own notifications
create policy notifications_select_own
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

-- Users can mark their own notifications as read or delete them
create policy notifications_update_own
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notifications_delete_own
on public.notifications
for delete
to authenticated
using (user_id = auth.uid());

-- Service role or authenticated users can insert (server actions & triggers use service role)
create policy notifications_insert_service
on public.notifications
for insert
to authenticated
with check (true);

-- ============================================================
-- 5. DB Function: Notify all admins when a teacher uploads
-- ============================================================
create or replace function public.notify_admins_on_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uploader_name text;
  admin_record record;
begin
  select full_name into uploader_name
  from public.profiles
  where id = new.created_by;

  for admin_record in
    select id from public.profiles
    where role = 'admin' and is_active = true
  loop
    insert into public.notifications (user_id, title, message, link, resource_id, type)
    values (
      admin_record.id,
      'New Upload Pending Review',
      coalesce(uploader_name, 'A teacher') || ' uploaded "' || new.title || '" and it is awaiting your approval.',
      '/admin/approvals',
      new.id,
      'new_upload'
    );
  end loop;

  return new;
end;
$$;

create trigger trg_notify_admins_on_upload
after insert on public.resources
for each row
execute function public.notify_admins_on_upload();

-- ============================================================
-- 6. DB Function: Notify teacher when resource is approved/rejected
-- ============================================================
create or replace function public.notify_teacher_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Detect approval: published flipped from false to true
  if (old.published = false and new.published = true) then
    insert into public.notifications (user_id, title, message, link, resource_id, type)
    values (
      new.created_by,
      'Upload Approved',
      'Your upload "' || new.title || '" has been approved and is now live in the library.',
      '/teacher/uploads',
      new.id,
      'approved'
    );

  -- Detect rejection: is_active flipped from true to false
  elsif (old.is_active = true and new.is_active = false) then
    insert into public.notifications (user_id, title, message, link, resource_id, type)
    values (
      new.created_by,
      'Upload Rejected',
      'Your upload "' || new.title || '" was not approved. Please review and re-upload if needed.',
      '/teacher/uploads',
      new.id,
      'rejected'
    );
  end if;

  return new;
end;
$$;

create trigger trg_notify_teacher_on_approval
after update on public.resources
for each row
execute function public.notify_teacher_on_approval();

-- ============================================================
-- 7. Enable realtime for the notifications table
-- ============================================================
alter publication supabase_realtime add table public.notifications;
