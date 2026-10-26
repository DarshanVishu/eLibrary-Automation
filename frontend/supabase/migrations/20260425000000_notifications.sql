-- Notifications table + minimal RPCs for notification center

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  link text not null default '',
  resource_id uuid references public.resources(id) on delete set null,
  type text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_user_created_idx
on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

-- Owner can read their notifications
drop policy if exists notifications_owner_read on public.notifications;
create policy notifications_owner_read
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

-- Owner can update read flag on their notifications
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Owner can delete their notifications
drop policy if exists notifications_owner_delete on public.notifications;
create policy notifications_owner_delete
on public.notifications
for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.notifications
  set is_read = true
  where user_id = auth.uid()
    and is_read = false;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

