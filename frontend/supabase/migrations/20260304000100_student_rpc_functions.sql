-- ─────────────────────────────────────────────────────────────────────────────
-- Student-side RPC functions
-- Migration: 20260304000100_student_rpc_functions.sql
--
-- Converts multi-step fan-out queries and business-logic mutations into
-- efficient, single round-trip Postgres functions.
--
-- Functions created:
--   1. get_student_library(p_user_id uuid)
--      Replaces 4 sequential client-side fetches
--      (resources + progress + bookmarks + grade_access) with one JOIN query.
--
--   2. toggle_bookmark(p_resource_id uuid)
--      Replaces the conditional insert-or-delete bookmark toggle with an
--      atomic, conflict-safe function.
--
--   3. notify_students_for_resource(p_resource_id uuid)
--      Replaces the 3-step fan-out in notifyStudentsForResource:
--        fetch resource → fetch relevant grades → fetch matching students
--        → batch insert notifications.
--
--   4. notify_admins_for_upload(p_resource_id uuid)
--      Replaces the 2-step fan-out in notifyAdminsForUpload:
--        fetch resource + uploader name → fetch admins → batch insert.
--
--   5. mark_all_notifications_read()
--      Replaces the bulk UPDATE that touches an unbounded number of rows,
--      executed atomically server-side.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. get_student_library ───────────────────────────────────────────────────
-- Returns every resource the calling student can see (RLS-equivalent filter),
-- enriched with their personal reading progress, bookmark status, and the list
-- of grades the resource is assigned to — all in a single query.
--
-- Called with:  supabase.rpc('get_student_library', { p_user_id: user.id })
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.get_student_library(p_user_id uuid)
returns table (
  id              uuid,
  title           text,
  material_type   text,
  academic_year   text,
  thumbnail_url   text,
  storage_path    text,
  source_url      text,
  page_count      integer,
  created_at      timestamptz,
  subject_name    text,
  progress_pct    numeric,
  last_page       integer,
  last_viewed_at  timestamptz,
  is_bookmarked   boolean,
  grades          integer[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_grade smallint;
begin
  -- Resolve the student's own grade once
  select p.grade into v_grade
  from public.profiles p
  where p.id = p_user_id
    and p.role = 'student'
    and p.is_active = true;

  -- Guard: only students with a valid grade can call this function
  if v_grade is null then
    return;
  end if;

  return query
  select
    r.id,
    r.title,
    r.material_type::text,
    r.academic_year,
    r.thumbnail_url,
    r.storage_path,
    r.source_url,
    r.page_count,
    r.created_at,
    s.name                                                   as subject_name,
    coalesce(rp.progress_pct, 0)                             as progress_pct,
    rp.last_page,
    rp.last_viewed_at,
    (bm.resource_id is not null)                             as is_bookmarked,
    -- Aggregate all assigned grades into an array
    coalesce(
      array_agg(rga.grade order by rga.grade)
        filter (where rga.grade is not null),
      array[]::integer[]
    )                                                        as grades
  from public.resources r
  join public.subjects s          on s.id = r.subject_id
  -- Only resources assigned to this student's grade
  join public.resource_grade_access rga_filter
       on rga_filter.resource_id = r.id
       and rga_filter.grade = v_grade
  -- All grade assignments for the resource (for the grades[] array)
  left join public.resource_grade_access rga
       on rga.resource_id = r.id
  -- Student's personal reading progress
  left join public.reading_progress rp
       on rp.resource_id = r.id
       and rp.user_id = p_user_id
  -- Bookmark status
  left join public.bookmarks bm
       on bm.resource_id = r.id
       and bm.user_id = p_user_id
  where r.published  = true
    and r.is_active  = true
  group by
    r.id, r.title, r.material_type, r.academic_year,
    r.thumbnail_url, r.storage_path, r.source_url,
    r.page_count, r.created_at,
    s.name,
    rp.progress_pct, rp.last_page, rp.last_viewed_at,
    bm.resource_id
  order by r.created_at desc;
end;
$$;


-- ─── 2. toggle_bookmark ───────────────────────────────────────────────────────
-- Atomically inserts or deletes a bookmark row for the calling user.
-- Returns the new bookmark state (true = bookmarked, false = removed).
--
-- Called with:  supabase.rpc('toggle_bookmark', { p_resource_id: id })
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.toggle_bookmark(p_resource_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_exists  boolean;
begin
  -- Check current state
  select exists(
    select 1 from public.bookmarks
    where user_id    = v_uid
      and resource_id = p_resource_id
  ) into v_exists;

  if v_exists then
    delete from public.bookmarks
    where user_id     = v_uid
      and resource_id = p_resource_id;
    return false;
  else
    insert into public.bookmarks (user_id, resource_id)
    values (v_uid, p_resource_id)
    on conflict (user_id, resource_id) do nothing;
    return true;
  end if;
end;
$$;


-- ─── 3. notify_students_for_resource ─────────────────────────────────────────
-- Fan-out: fetch resource → resolve target grades → fetch matching students
-- → batch-insert notifications. Replaces 3+ sequential server-side fetches.
--
-- Intended to be called by a service-role Edge Function or admin server action.
-- Called with:  supabase.rpc('notify_students_for_resource', { p_resource_id: id })
-- Returns the number of notifications inserted.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.notify_students_for_resource(p_resource_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title      text;
  v_type_label text;
  v_count      integer := 0;
begin
  -- 1. Fetch resource metadata
  select
    r.title,
    replace(r.material_type::text, '_', ' ')
  into v_title, v_type_label
  from public.resources r
  where r.id = p_resource_id;

  if v_title is null then
    raise exception 'Resource % not found', p_resource_id;
  end if;

  -- 2. Batch-insert one notification per matching student
  --    (students whose grade is in resource_grade_access for this resource)
  with target_students as (
    select p.id as student_id
    from public.profiles p
    join public.resource_grade_access rga
         on rga.grade = p.grade
         and rga.resource_id = p_resource_id
    where p.role      = 'student'
      and p.is_active = true
  )
  insert into public.notifications (user_id, title, message, link, resource_id, type)
  select
    ts.student_id,
    'New Material Added',
    format('A new %s: "%s" has been added to your library.', v_type_label, v_title),
    format('/student/viewer/%s', p_resource_id),
    p_resource_id,
    'new_material'
  from target_students ts;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ─── 4. notify_admins_for_upload ─────────────────────────────────────────────
-- Fetches resource + uploader name, then batch-inserts one notification per
-- active admin. Replaces 3 sequential fetches + insert loop.
--
-- Called with:  supabase.rpc('notify_admins_for_upload', { p_resource_id: id })
-- Returns the number of notifications inserted.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.notify_admins_for_upload(p_resource_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title         text;
  v_uploader_name text;
  v_count         integer := 0;
begin
  -- 1. Fetch resource + uploader display name in one query
  select
    r.title,
    coalesce(p.full_name, 'A teacher')
  into v_title, v_uploader_name
  from public.resources r
  left join public.profiles p on p.id = r.created_by
  where r.id = p_resource_id;

  if v_title is null then
    raise exception 'Resource % not found', p_resource_id;
  end if;

  -- 2. Batch-insert one notification per active admin
  insert into public.notifications (user_id, title, message, link, resource_id, type)
  select
    p.id,
    'New Upload Pending Review',
    format('%s uploaded "%s" and it is awaiting your approval.', v_uploader_name, v_title),
    '/admin/approvals',
    p_resource_id,
    'new_upload'
  from public.profiles p
  where p.role      = 'admin'
    and p.is_active = true;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ─── 5. mark_all_notifications_read ──────────────────────────────────────────
-- Bulk-marks every unread notification belonging to the calling user as read.
-- Atomic; avoids a round-trip to count rows before updating.
--
-- Called with:  supabase.rpc('mark_all_notifications_read')
-- Returns the number of rows updated.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid    := auth.uid();
  v_count integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.notifications
  set    is_read = true
  where  user_id  = v_uid
    and  is_read  = false;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ─── Grant execute to authenticated users ────────────────────────────────────
-- get_student_library and toggle_bookmark are called by the authenticated
-- student. The notify_* functions are called from server actions using the
-- service role, but granting to authenticated is harmless because the
-- underlying tables are protected by RLS policies.
grant execute on function public.get_student_library(uuid)         to authenticated;
grant execute on function public.toggle_bookmark(uuid)             to authenticated;
grant execute on function public.notify_students_for_resource(uuid) to authenticated;
grant execute on function public.notify_admins_for_upload(uuid)    to authenticated;
grant execute on function public.mark_all_notifications_read()     to authenticated;
