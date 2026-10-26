do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_settings'
      and policyname = 'app_settings_insert_admin'
  ) then
    create policy app_settings_insert_admin on public.app_settings
      for insert to authenticated
      with check (public.is_admin());
  end if;
end
$$;

