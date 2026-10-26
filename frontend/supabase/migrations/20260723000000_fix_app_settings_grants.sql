-- Grant table-level privileges to anon and authenticated roles on app_settings.
-- RLS policies alone are insufficient — PostgreSQL checks GRANT before RLS.
grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;
