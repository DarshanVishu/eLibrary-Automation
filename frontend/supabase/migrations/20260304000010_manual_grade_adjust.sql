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
