-- Grade promotion configuration and yearly bump function

create table if not exists public.grade_promotion_config (
  id integer primary key check (id = 1),
  promotion_month smallint not null check (promotion_month between 1 and 12),
  promotion_day smallint not null check (promotion_day between 1 and 31),
  last_run_year integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_grade_promotion_config_updated_at on public.grade_promotion_config;

create trigger trg_grade_promotion_config_updated_at
before update on public.grade_promotion_config
for each row execute function public.set_updated_at();

insert into public.grade_promotion_config (id, promotion_month, promotion_day)
values (1, 4, 1)
on conflict (id) do nothing;

alter table public.grade_promotion_config enable row level security;

-- "if not exists" is not legal here, so split create policy for idempotency
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'grade_promotion_config'
      and policyname = 'grade_promotion_config_admin_only'
  ) then
    execute $policy$
      create policy grade_promotion_config_admin_only
      on public.grade_promotion_config
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $policy$;
  end if;
end
$$;

create or replace function public.run_grade_promotion_if_due()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg record;
  today date := timezone('utc', now())::date;
  current_year integer := extract(year from today);
  promotion_this_year date;
begin
  select *
  into cfg
  from public.grade_promotion_config
  where id = 1
  for update;

  if not found then
    return;
  end if;

  promotion_this_year := make_date(current_year, cfg.promotion_month, cfg.promotion_day);

  if cfg.last_run_year is not null and cfg.last_run_year >= current_year then
    return;
  end if;

  if today < promotion_this_year then
    return;
  end if;

  update public.profiles
  set grade = case
    when grade is null then null
    when grade between 1 and 9 then grade + 1
    else grade
  end
  where role = 'student'
    and is_active = true
    and grade is not null
    and grade between 1 and 10;

  update public.grade_promotion_config
  set last_run_year = current_year
  where id = cfg.id;
end;
$$;

