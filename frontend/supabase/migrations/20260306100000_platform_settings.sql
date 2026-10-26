create table public.app_settings (
  id integer primary key default 1 check (id = 1),
  platform_name text not null default 'eLibrary'
);

alter table public.app_settings enable row level security;

create policy app_settings_read_all on public.app_settings
  for select to public using (true);

create policy app_settings_update_admin on public.app_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.app_settings (id, platform_name) values (1, 'eLibrary') on conflict do nothing;
