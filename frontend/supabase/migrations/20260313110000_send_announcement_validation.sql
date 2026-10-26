-- Enforce non-empty announcement title/message at DB level.
create or replace function public.send_announcement(
  p_title           text,
  p_message         text,
  p_link            text    default '',
  p_role            text    default 'all',
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
  if coalesce(length(btrim(p_title)), 0) = 0 then
    raise exception 'Announcement title is required.';
  end if;

  if coalesce(length(btrim(p_message)), 0) = 0 then
    raise exception 'Announcement message is required.';
  end if;

  with targets as (
    select id
    from public.profiles
    where is_active = true
      and (p_role = 'all' or role::text = p_role)
      and (p_exclude_user_id is null or id <> p_exclude_user_id)
  ),
  inserted as (
    insert into public.notifications (user_id, title, message, link, type)
    select t.id, btrim(p_title), btrim(p_message), btrim(p_link), 'general'
    from targets t
    returning id
  )
  select count(*) into v_inserted from inserted;

  return v_inserted;
end;
$$;
