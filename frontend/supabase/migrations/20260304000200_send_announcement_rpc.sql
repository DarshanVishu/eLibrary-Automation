-- ============================================================
-- RPC: send_announcement
-- Fan-out inserts a 'general' notification to all active users
-- matching the requested audience role (or all roles).
-- p_exclude_user_id: UUID to skip (the sending admin) so they
-- don't receive their own announcement as a toast.
-- Returns the count of notifications inserted.
-- ============================================================

create or replace function public.send_announcement(
  p_title           text,
  p_message         text,
  p_link            text    default '',
  p_role            text    default 'all',   -- 'all' | 'student' | 'teacher' | 'admin'
  p_exclude_user_id uuid    default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted bigint;
begin
  with targets as (
    select id
    from public.profiles
    where is_active = true
      and (p_role = 'all' or role::text = p_role)
      and (p_exclude_user_id is null or id <> p_exclude_user_id)
  ),
  inserted as (
    insert into public.notifications (user_id, title, message, link, type)
    select t.id, p_title, p_message, p_link, 'general'
    from targets t
    returning id
  )
  select count(*) into v_inserted from inserted;

  return v_inserted;
end;
$$;

