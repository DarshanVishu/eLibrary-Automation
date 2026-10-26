-- CONSOLIDATED CURRENT SCHEMA FOR MANUAL GUI EXECUTION
-- Generated on: 2026-03-04
-- Reflects all applied migrations in order:
--   20260227000000_schema.sql              (baseline)
--   20260227102500_resource_annotations.sql
--   20260303000000_grade_promotion.sql     (now dropped by next migration)
--   20260304000001_drop_automated_promotion.sql
--   20260304000002_notifications_system.sql
--   20260304000003_fix_teacher_student_visibility.sql
--   20260304000010_manual_grade_adjust.sql
--   20260304000100_student_rpc_functions.sql
--   20260304000200_send_announcement_rpc.sql
--   20260306000000_automatic_student_notifications.sql

-- ===================================================================
-- PART 1 — BASELINE SCHEMA
-- Source: 20260227000000_schema.sql
-- ===================================================================

-- ----------
-- Extensions & enum types
-- ----------

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typname = 'app_role') then
    create type public.app_role as enum ('admin', 'teacher', 'student');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typname = 'material_type') then
    create type public.material_type as enum (
      'textbook',
      'guide',
      'question_bank',
      'reference',
      'model_paper',
      'sample_paper',
      'lab_material',
      'school_material'
    );
  end if;
end
$$;


-- ----------
-- Core tables
-- ----------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role public.app_role not null default 'student',
  grade smallint,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_grade_check check (grade between 1 and 10 or grade is null),
  constraint profiles_student_grade_check check (
    (role = 'student' and grade between 1 and 10)
    or (role in ('admin', 'teacher'))
  )
);

create table public.subjects (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  book_id text,
  title text not null,
  description text,
  subject_id bigint not null references public.subjects(id) on delete restrict,
  material_type public.material_type not null,
  academic_year text,
  -- Internal file uploads use storage_path; external/government content uses source_url.
  storage_path text,
  source_url text,
  file_mime text,
  file_size_bytes bigint,
  page_count integer,
  thumbnail_url text,
  published boolean not null default true,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resources_pdf_only_check check (
    file_mime is null
    or lower(file_mime) in ('application/pdf', 'application/x-pdf')
  ),
  constraint resources_source_check check (
    (storage_path is not null and source_url is null)
    or (storage_path is null and source_url is not null)
  ),
  constraint resources_academic_year_check check (
    academic_year is null
    or academic_year ~ '^[0-9]{4}(-[0-9]{2,4})?$'
  )
);

create table public.resource_grade_access (
  resource_id uuid not null references public.resources(id) on delete cascade,
  grade smallint not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (resource_id, grade),
  constraint resource_grade_access_grade_check check (grade between 1 and 10)
);

create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, resource_id)
);

create table public.reading_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  last_page integer not null default 1,
  progress_pct numeric(5,2) not null default 0,
  last_viewed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, resource_id),
  constraint reading_progress_last_page_check check (last_page >= 1),
  constraint reading_progress_pct_check check (progress_pct >= 0 and progress_pct <= 100)
);

create table public.resource_views (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now())
);


-- ----------
-- Helper functions & triggers
-- ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.current_user_grade()
returns smallint
language sql
stable
security definer
set search_path = public
as $$
  select p.grade
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'teacher', false);
$$;

-- Resource files are expected at: <resource_id>/<filename>.pdf
create or replace function public.resource_id_from_storage_path(path text)
returns uuid
language plpgsql
immutable
as $$
declare
  maybe_uuid text;
begin
  maybe_uuid := split_part(path, '/', 1);
  if maybe_uuid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return maybe_uuid::uuid;
  end if;
  return null;
end;
$$;

create or replace function public.can_access_resource(p_resource_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select p.role, p.grade, p.is_active
    from public.profiles p
    where p.id = auth.uid()
  )
  select exists (
    select 1
    from public.resources r
    cross join me
    where r.id = p_resource_id
      and r.is_active = true
      and me.is_active = true
      and (
        me.role in ('admin', 'teacher')
        or (
          me.role = 'student'
          and r.published = true
          and exists (
            select 1
            from public.resource_grade_access rga
            where rga.resource_id = r.id
              and rga.grade = me.grade
          )
        )
      )
  );
$$;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_resources_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

create trigger trg_reading_progress_updated_at
before update on public.reading_progress
for each row execute function public.set_updated_at();

-- Auto-create profile rows when auth users are created.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  requested_grade text;
  safe_role public.app_role;
  safe_grade smallint;
begin
  requested_role := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  requested_grade := nullif(new.raw_user_meta_data->>'grade', '');

  safe_role := case
    when requested_role in ('admin', 'teacher', 'student') then requested_role::public.app_role
    else 'student'::public.app_role
  end;

  safe_grade := case
    when requested_grade ~ '^[0-9]+$' then requested_grade::smallint
    else null
  end;

  insert into public.profiles (id, email, full_name, role, grade)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    safe_role,
    safe_grade
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();


-- ----------
-- Seed subjects
-- ----------

insert into public.subjects (name)
values
  ('Mathematics'),
  ('Science'),
  ('English'),
  ('Hindi'),
  ('Social Science'),
  ('Computer Science'),
  ('Sanskrit'),
  ('EVS'),
  ('Kannada'),
  ('Information Technology'),
  ('Artificial Intelligence'),
  ('Art Education'),
  ('Value Education'),
  ('General Knowledge')
on conflict (name) do nothing;


-- ----------
-- Performance indexes
-- ----------

create index resources_subject_idx on public.resources(subject_id);
create index resources_material_type_idx on public.resources(material_type);
create index resources_created_at_idx on public.resources(created_at desc);
create index resources_active_published_idx on public.resources(is_active, published);
create index resources_title_trgm_idx on public.resources using gin (title gin_trgm_ops);
create index resource_grade_access_grade_idx on public.resource_grade_access(grade);
create index bookmarks_user_created_idx on public.bookmarks(user_id, created_at desc);
create index reading_progress_user_last_viewed_idx on public.reading_progress(user_id, last_viewed_at desc);
create index resource_views_resource_viewed_at_idx on public.resource_views(resource_id, viewed_at desc);
create index resource_views_user_viewed_at_idx on public.resource_views(user_id, viewed_at desc);


-- ----------
-- Row-Level Security
-- ----------

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.resources enable row level security;
alter table public.resource_grade_access enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_progress enable row level security;
alter table public.resource_views enable row level security;

-- Profiles: own row, admins, and teachers can see their students
create policy profiles_select_own_admin_or_teacher_seeing_students
on public.profiles
for select
to authenticated
using (
  (id = auth.uid()) OR
  public.is_admin() OR
  (public.is_teacher() AND role = 'student')
);

create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Subjects
create policy subjects_read_all
on public.subjects
for select
to authenticated
using (true);

create policy subjects_admin_write
on public.subjects
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Resources
create policy resources_read_by_role_and_grade
on public.resources
for select
to authenticated
using (
  is_active = true
  and (
    public.is_admin()
    or public.is_teacher()
    or (
      public.current_user_role() = 'student'
      and published = true
      and (
        -- Global bypass: admins toggled "allow all grades access"
        (select allow_all_grades_access from public.app_settings where id = 1) = true
        or
        -- No grade rows at all → resource is unrestricted
        not exists (
          select 1
          from public.resource_grade_access rga
          where rga.resource_id = resources.id
        )
        or
        -- Resource has grade rows and student's grade is one of them
        exists (
          select 1
          from public.resource_grade_access rga
          where rga.resource_id = resources.id
            and rga.grade = public.current_user_grade()
        )
      )
    )
  )
);

create policy resources_insert_admin_or_teacher
on public.resources
for insert
to authenticated
with check (
  public.is_admin()
  or (public.is_teacher() and created_by = auth.uid())
);

create policy resources_update_admin_or_owner_teacher
on public.resources
for update
to authenticated
using (
  public.is_admin()
  or (public.is_teacher() and created_by = auth.uid())
)
with check (
  public.is_admin()
  or (public.is_teacher() and created_by = auth.uid())
);

create policy resources_delete_admin_or_owner_teacher
on public.resources
for delete
to authenticated
using (
  public.is_admin()
  or (public.is_teacher() and created_by = auth.uid())
);

-- Resource grade access
drop policy if exists resource_grade_access_read_if_resource_visible on public.resource_grade_access;

create policy resource_grade_access_read_all
on public.resource_grade_access
for select
to authenticated
using (true);

create policy resource_grade_access_insert_admin_or_owner_teacher
on public.resource_grade_access
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_teacher()
    and exists (
      select 1 from public.resources r
      where r.id = resource_id
        and r.created_by = auth.uid()
    )
  )
);

create policy resource_grade_access_update_admin_or_owner_teacher
on public.resource_grade_access
for update
to authenticated
using (
  public.is_admin()
  or (
    public.is_teacher()
    and exists (
      select 1 from public.resources r
      where r.id = resource_id
        and r.created_by = auth.uid()
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_teacher()
    and exists (
      select 1 from public.resources r
      where r.id = resource_id
        and r.created_by = auth.uid()
    )
  )
);

create policy resource_grade_access_delete_admin_or_owner_teacher
on public.resource_grade_access
for delete
to authenticated
using (
  public.is_admin()
  or (
    public.is_teacher()
    and exists (
      select 1 from public.resources r
      where r.id = resource_id
        and r.created_by = auth.uid()
    )
  )
);

-- Bookmarks
create policy bookmarks_owner_read
on public.bookmarks
for select
to authenticated
using (user_id = auth.uid());

create policy bookmarks_owner_insert
on public.bookmarks
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.can_access_resource(resource_id)
);

create policy bookmarks_owner_delete
on public.bookmarks
for delete
to authenticated
using (user_id = auth.uid());

-- Reading progress
create policy reading_progress_owner_read
on public.reading_progress
for select
to authenticated
using (user_id = auth.uid());

create policy reading_progress_owner_insert
on public.reading_progress
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.can_access_resource(resource_id)
);

create policy reading_progress_owner_update
on public.reading_progress
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and public.can_access_resource(resource_id)
);

-- Resource views
create policy resource_views_insert_accessible
on public.resource_views
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.can_access_resource(resource_id)
);

create policy resource_views_read_own_or_staff
on public.resource_views
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or public.is_teacher()
);


-- ----------
-- Storage
-- ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library-files', 'library-files', false, 104857600, array['application/pdf'])
on conflict (id) do nothing;

create policy storage_library_files_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'library-files'
  and (
    public.is_admin()
    or public.is_teacher()
    or public.can_access_resource(public.resource_id_from_storage_path(name))
  )
);

create policy storage_library_files_insert_admin_teacher
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'library-files'
  and (public.is_admin() or public.is_teacher())
);

create policy storage_library_files_update_admin_teacher
on storage.objects
for update
to authenticated
using (
  bucket_id = 'library-files'
  and (public.is_admin() or public.is_teacher())
)
with check (
  bucket_id = 'library-files'
  and (public.is_admin() or public.is_teacher())
);

create policy storage_library_files_delete_admin_teacher
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'library-files'
  and (public.is_admin() or public.is_teacher())
);


-- ===================================================================
-- PART 2 — RESOURCE ANNOTATIONS
-- Source: 20260227102500_resource_annotations.sql
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.resource_annotations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  page_number integer,
  annotation_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resource_annotations_user_resource
  ON public.resource_annotations(user_id, resource_id);

ALTER TABLE public.resource_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own annotations"
  ON public.resource_annotations
  FOR ALL
  USING (auth.uid() = user_id);


-- ===================================================================
-- PART 3 — AUTOMATED GRADE PROMOTION (DROPPED)
-- Source: 20260303000000_grade_promotion.sql  →  dropped by 20260304000001
--
-- The grade_promotion_config table and run_grade_promotion_if_due()
-- function were introduced and then intentionally removed. Grade
-- management is now fully manual (see Part 5 below).
-- ===================================================================

-- Nothing to create — included here only for historical context.
-- 20260304000001_drop_automated_promotion.sql cleaned these up:
--   drop function if exists public.run_grade_promotion_if_due();
--   drop trigger if exists trg_grade_promotion_config_updated_at on public.grade_promotion_config;
--   drop table  if exists public.grade_promotion_config;


-- ===================================================================
-- PART 4 — NOTIFICATIONS SYSTEM
-- Source: 20260304000002_notifications_system.sql
-- ===================================================================

-- Table
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  message     text not null,
  link        text not null default '',
  resource_id uuid references public.resources(id) on delete cascade,
  type        text not null default 'general'
    check (type in ('new_upload', 'approved', 'rejected', 'new_material', 'general')),
  is_read     boolean not null default false,
  created_at  timestamptz not null default timezone('utc', now())
);

-- Indexes
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index notifications_user_unread_idx  on public.notifications(user_id, is_read) where is_read = false;

-- RLS
alter table public.notifications enable row level security;

create policy notifications_select_own
on public.notifications for select to authenticated
using (user_id = auth.uid());

create policy notifications_update_own
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notifications_delete_own
on public.notifications for delete to authenticated
using (user_id = auth.uid());

-- Service role / triggers use service role; allow any authenticated insert
create policy notifications_insert_service
on public.notifications for insert to authenticated
with check (true);

-- Trigger: notify admins when a teacher uploads
create or replace function public.notify_admins_on_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uploader_name text;
  admin_record  record;
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

-- Trigger: notify teacher when their upload is approved or rejected
create or replace function public.notify_teacher_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

create trigger trg_notify_teacher_on_approval
after update on public.resources
for each row
execute function public.notify_teacher_on_approval();

-- Trigger: notify students when a resource is approved
create or replace function public.trg_notify_students_on_approval()
returns trigger
language plpgsql
security definer
as $$
begin
  if (old.published = false and new.published = true) then
    perform public.notify_students_for_resource(new.id);
  end if;
  return new;
end;
$$;

create trigger trg_students_on_resource_approval
after update on public.resources
for each row
execute function public.trg_notify_students_on_approval();

-- Trigger: notify students when an active resource gains grade access
create or replace function public.trg_notify_students_on_grade_access()
returns trigger
language plpgsql
security definer
as $$
declare
  v_published boolean;
begin
  select published into v_published from public.resources where id = new.resource_id;
  if v_published = true then
    perform public.notify_students_for_resource(new.resource_id);
  end if;
  return new;
end;
$$;

create trigger trg_students_on_grade_access
after insert on public.resource_grade_access
for each row
execute function public.trg_notify_students_on_grade_access();

-- Enable realtime on the notifications table
alter publication supabase_realtime add table public.notifications;


-- ===================================================================
-- PART 5 — MANUAL GRADE ADJUSTMENT FUNCTIONS
-- Source: 20260304000010_manual_grade_adjust.sql
-- ===================================================================

create or replace function public.admin_promote_students()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  update public.profiles
  set grade = grade + 1
  where role = 'student'
    and is_active = true
    and grade between 1 and 9;
end;
$$;

create or replace function public.admin_demote_students()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  update public.profiles
  set grade = grade - 1
  where role = 'student'
    and is_active = true
    and grade between 2 and 10;
end;
$$;


-- ===================================================================
-- PART 6 — STUDENT-SIDE RPC FUNCTIONS
-- Source: 20260304000100_student_rpc_functions.sql
-- ===================================================================

-- 1. get_student_library — single-query replacement for 4 sequential fetches
create or replace function public.get_student_library(p_user_id uuid)
returns table (
  id              uuid,
  book_id         text,
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
  v_grade  smallint;
  v_bypass boolean;
begin
  -- Retrieve student grade
  select p.grade into v_grade
  from public.profiles p
  where p.id = p_user_id
    and p.role = 'student'
    and p.is_active = true;

  -- Retrieve global bypass setting (fully qualified table alias to prevent collision with return column 'id')
  select settings.allow_all_grades_access into v_bypass
  from public.app_settings settings
  where settings.id = 1;

  if v_grade is null then
    return;
  end if;

  return query
  select
    r.id,
    r.book_id,
    r.title,
    r.material_type::text,
    r.academic_year,
    r.thumbnail_url,
    r.storage_path,
    r.source_url,
    r.page_count,
    r.created_at,
    s.name                                                     as subject_name,
    coalesce(rp.progress_pct, 0)                               as progress_pct,
    rp.last_page,
    rp.last_viewed_at,
    (bm.resource_id is not null)                               as is_bookmarked,
    coalesce(
      array_agg(distinct rga.grade order by rga.grade)
        filter (where rga.grade is not null),
      array[]::integer[]
    )                                                          as grades
  from public.resources r
  join public.subjects s               on s.id = r.subject_id
  left join public.resource_grade_access rga
       on rga.resource_id = r.id
  left join public.reading_progress rp
       on rp.resource_id = r.id
       and rp.user_id = p_user_id
  left join public.bookmarks bm
       on bm.resource_id = r.id
       and bm.user_id = p_user_id
  where r.published = true
    and r.is_active = true
    and (
      -- Global bypass: show everything
      v_bypass = true
      or
      -- No grade rows at all → unrestricted, show to everyone
      not exists (
        select 1
        from public.resource_grade_access rga_filter
        where rga_filter.resource_id = r.id
      )
      or
      -- Grade rows exist and student's grade matches
      exists (
        select 1
        from public.resource_grade_access rga_filter
        where rga_filter.resource_id = r.id
          and rga_filter.grade = v_grade
      )
    )
  group by
    r.id, r.book_id, r.title, r.material_type, r.academic_year,
    r.thumbnail_url, r.storage_path, r.source_url,
    r.page_count, r.created_at,
    s.name,
    rp.progress_pct, rp.last_page, rp.last_viewed_at,
    bm.resource_id
  order by r.created_at desc;
end;
$$;

-- 2. toggle_bookmark — atomic insert-or-delete
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

-- 3. notify_students_for_resource — fan-out notification on resource publish
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
  select
    r.title,
    replace(r.material_type::text, '_', ' ')
  into v_title, v_type_label
  from public.resources r
  where r.id = p_resource_id;

  if v_title is null then
    raise exception 'Resource % not found', p_resource_id;
  end if;

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
  from target_students ts
  where not exists (
    select 1 from public.notifications n
    where n.user_id = ts.student_id
      and n.resource_id = p_resource_id
      and n.type = 'new_material'
  );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 4. notify_admins_for_upload — fan-out upload notification to all admins
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

-- 5. mark_all_notifications_read — atomic bulk-read for calling user
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

-- Grant execute to authenticated role
grant execute on function public.get_student_library(uuid)          to authenticated;
grant execute on function public.toggle_bookmark(uuid)              to authenticated;
grant execute on function public.notify_students_for_resource(uuid) to authenticated;
grant execute on function public.notify_admins_for_upload(uuid)     to authenticated;
grant execute on function public.mark_all_notifications_read()      to authenticated;


-- ===================================================================
-- PART 7 — SEND ANNOUNCEMENT RPC
-- Source: 20260304000200_send_announcement_rpc.sql
--
-- Allows admins to broadcast a realtime 'general' notification to all
-- active users, or to a specific audience role (student/teacher/admin).
-- Called via the service-role client from the admin server action —
-- no auth.uid() check needed inside the function itself.
-- ===================================================================

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
