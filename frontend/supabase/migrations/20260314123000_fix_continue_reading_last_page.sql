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
  select p.grade into v_grade
  from public.profiles p
  where p.id = p_user_id
    and p.role = 'student'
    and p.is_active = true;

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
    coalesce(
      array_agg(rga.grade order by rga.grade)
        filter (where rga.grade is not null),
      array[]::integer[]
    )                                                        as grades
  from public.resources r
  join public.subjects s          on s.id = r.subject_id
  join public.resource_grade_access rga_filter
       on rga_filter.resource_id = r.id
       and rga_filter.grade = v_grade
  left join public.resource_grade_access rga
       on rga.resource_id = r.id
  left join public.reading_progress rp
       on rp.resource_id = r.id
       and rp.user_id = p_user_id
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
