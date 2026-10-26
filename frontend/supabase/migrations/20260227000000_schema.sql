-- Consolidated baseline migration for fresh deployments
-- Generated from current schema + applied RLS fixes

-- Database Schema Dump
-- Auto-Generated from merging modular migration files

-- ----------
-- Source Migration: 20260225000000_extensions_and_types.sql
-- ----------

-- eLibrary MVP schema: module 1/7
-- Extensions and enum types

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
-- Source Migration: 20260225000001_core_tables.sql
-- ----------

-- eLibrary MVP schema: module 2/7
-- Core tables

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
-- Source Migration: 20260225000002_functions_and_triggers.sql
-- ----------

-- eLibrary MVP schema: module 3/7
-- Helper functions and triggers

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
-- Source Migration: 20260225000003_seed_subjects.sql
-- ----------

-- eLibrary MVP schema: module 4/7
-- Seed base subject catalog

insert into public.subjects (name)
values
  ('Mathematics'),
  ('Science'),
  ('English'),
  ('Hindi'),
  ('Social Science'),
  ('Computer Science'),
  ('Sanskrit'),
  ('EVS')
on conflict (name) do nothing;


-- ----------
-- Source Migration: 20260225000004_indexes.sql
-- ----------

-- eLibrary MVP schema: module 5/7
-- Performance indexes

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
-- Source Migration: 20260225000005_rls_policies.sql
-- ----------

-- eLibrary MVP schema: module 6/7
-- Row-level security and policies

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.resources enable row level security;
alter table public.resource_grade_access enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_progress enable row level security;
alter table public.resource_views enable row level security;

-- Profiles
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Subjects catalog
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
      and exists (
        select 1
        from public.resource_grade_access rga
        where rga.resource_id = id
          and rga.grade = public.current_user_grade()
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

-- Resource grade visibility mapping
drop policy if exists resource_grade_access_read_if_resource_visible on public.resource_grade_access;

create policy resource_grade_access_read_all
on public.resource_grade_access
for select
to authenticated
using (true);

-- Insert policy
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

-- Update policy
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

-- Delete policy
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

-- Resource views (recently viewed + analytics)
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
-- Source Migration: 20260225000006_storage.sql
-- ----------

-- eLibrary MVP schema: module 7/7
-- Supabase Storage bucket and policies

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

