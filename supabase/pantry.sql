-- BODYUP — garde-manger + liste de courses
-- À coller dans : Supabase → SQL Editor → New query → Run
create table if not exists public.pantry (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  category   text not null default 'Autre',
  status     text not null default 'buy' check (status in ('have','buy')),
  created_at timestamptz not null default now()
);
create index if not exists pantry_user_idx on public.pantry(user_id, status);

alter table public.pantry enable row level security;
drop policy if exists "own pantry" on public.pantry;
create policy "own pantry" on public.pantry
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
