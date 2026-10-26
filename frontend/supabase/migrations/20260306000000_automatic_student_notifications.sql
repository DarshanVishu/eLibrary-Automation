-- Modify notify_students_for_resource to be idempotent
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

-- Trigger 1: On Resources UPDATE to published=true
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

drop trigger if exists trg_students_on_resource_approval on public.resources;
create trigger trg_students_on_resource_approval
after update on public.resources
for each row
execute function public.trg_notify_students_on_approval();

-- Trigger 2: On resource_grade_access INSERT (if resources.published=true)
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

drop trigger if exists trg_students_on_grade_access on public.resource_grade_access;
create trigger trg_students_on_grade_access
after insert on public.resource_grade_access
for each row
execute function public.trg_notify_students_on_grade_access();
