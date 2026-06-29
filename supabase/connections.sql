-- BODYUP — partage entre utilisateurs PAR NOM D'UTILISATEUR (mutuel, validation)
-- À coller dans : Supabase → SQL Editor → New query → Run
-- (remplace l'ancienne version par email)

-- 1) Nom d'utilisateur unique sur les profils
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_uidx on public.profiles (lower(username)) where username is not null;

-- Résout un nom d'utilisateur -> id (SECURITY DEFINER : ne renvoie que l'id)
create or replace function public.find_user_by_username(uname text)
returns uuid language sql security definer set search_path = public stable as $$
  select id from public.profiles where lower(username) = lower(trim(uname)) limit 1;
$$;
grant execute on function public.find_user_by_username(text) to authenticated, anon;

-- 2) Connexions par identifiant
drop table if exists public.connections cascade;
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  requester_username text,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  addressee_username text,
  status text not null default 'pending' check (status in ('pending','accepted')),
  requester_categories text[] not null default array['poids','pas','courses'],
  addressee_categories text[] not null default array['poids','pas','courses'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conn_req_idx on public.connections(requester_id);
create index if not exists conn_addr_idx on public.connections(addressee_id);

alter table public.connections enable row level security;
create policy "conn read"   on public.connections for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "conn insert" on public.connections for insert with check (auth.uid() = requester_id);
create policy "conn update" on public.connections for update using (auth.uid() = requester_id or auth.uid() = addressee_id) with check (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "conn delete" on public.connections for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- 3) Lecture partagée (en plus de l'accès à ses propres lignes)
drop policy if exists "weight shared read" on public.weight_logs;
create policy "weight shared read" on public.weight_logs for select using (
  exists (select 1 from public.connections c where c.status = 'accepted'
    and ((c.requester_id = weight_logs.user_id and c.addressee_id = auth.uid() and 'poids' = any(c.requester_categories))
      or (c.addressee_id = weight_logs.user_id and c.requester_id = auth.uid() and 'poids' = any(c.addressee_categories)))));

drop policy if exists "water shared read" on public.water_logs;
create policy "water shared read" on public.water_logs for select using (
  exists (select 1 from public.connections c where c.status = 'accepted'
    and ((c.requester_id = water_logs.user_id and c.addressee_id = auth.uid() and 'pas' = any(c.requester_categories))
      or (c.addressee_id = water_logs.user_id and c.requester_id = auth.uid() and 'pas' = any(c.addressee_categories)))));

drop policy if exists "pantry shared read" on public.pantry;
create policy "pantry shared read" on public.pantry for select using (
  exists (select 1 from public.connections c where c.status = 'accepted'
    and ((c.requester_id = pantry.user_id and c.addressee_id = auth.uid() and 'courses' = any(c.requester_categories))
      or (c.addressee_id = pantry.user_id and c.requester_id = auth.uid() and 'courses' = any(c.addressee_categories)))));
