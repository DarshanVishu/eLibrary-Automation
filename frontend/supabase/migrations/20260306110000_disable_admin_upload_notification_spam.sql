-- Do not send notifications to admins for their own self-approved uploads

create or replace function public.notify_admins_on_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uploader_name text;
  uploader_role text;
  admin_record  record;
begin
  select full_name, role into uploader_name, uploader_role
  from public.profiles
  where id = new.created_by;

  -- If an admin uploads the material, it is auto-approved, so do NOT alert admins.
  if uploader_role = 'admin' then
    return new;
  end if;

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


create or replace function public.notify_teacher_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uploader_role text;
begin
  select role into uploader_role from public.profiles where id = new.created_by;

  -- If the uploader was an admin, they don't need "approval" tracking or notifications for themselves.
  if uploader_role = 'admin' then
    return new;
  end if;

  -- Approval: published flipped false → true
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

  -- Rejection: is_active flipped true → false
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
