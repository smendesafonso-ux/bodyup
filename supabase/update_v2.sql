-- ============================================================
-- BODYUP — mise à jour v2
-- À coller dans : Supabase → SQL Editor → New query → Run
-- Ajoute : aliments favoris, répartition macros personnalisée,
-- jeûne intermittent, messagerie entre proches (+ temps réel),
-- photos de progression (+ bucket Storage), comparaison enrichie.
-- ============================================================

-- ---------- ALIMENTS FAVORIS ----------
create table if not exists public.favorite_foods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  kcal100    int  not null default 0,
  p100       numeric(5,1) not null default 0,
  c100       numeric(5,1) not null default 0,
  f100       numeric(5,1) not null default 0,
  unit       text not null default 'g' check (unit in ('g','ml')),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
alter table public.favorite_foods enable row level security;
drop policy if exists "own favorites" on public.favorite_foods;
create policy "own favorites" on public.favorite_foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- RÉPARTITION MACROS PERSONNALISÉE (en % des calories) ----------
alter table public.profiles add column if not exists macro_p int not null default 30;
alter table public.profiles add column if not exists macro_c int not null default 40;
alter table public.profiles add column if not exists macro_f int not null default 30;

-- ---------- JEÛNE INTERMITTENT ----------
create table if not exists public.fasting_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  target_h   int not null default 16,
  created_at timestamptz not null default now()
);
create index if not exists fasting_user_idx on public.fasting_logs(user_id, started_at desc);
alter table public.fasting_logs enable row level security;
drop policy if exists "own fasting" on public.fasting_logs;
create policy "own fasting" on public.fasting_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- MESSAGERIE ENTRE PROCHES ----------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);
create index if not exists messages_thread_idx on public.messages(sender_id, recipient_id, created_at);
create index if not exists messages_unread_idx on public.messages(recipient_id) where read_at is null;
alter table public.messages enable row level security;

drop policy if exists "read own threads" on public.messages;
create policy "read own threads" on public.messages
  for select using (auth.uid() in (sender_id, recipient_id));

-- envoi possible uniquement vers un proche CONNECTÉ (partage accepté)
drop policy if exists "send to connected" on public.messages;
create policy "send to connected" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and ((c.requester_id = sender_id and c.addressee_id = recipient_id)
          or (c.addressee_id = sender_id and c.requester_id = recipient_id))
    )
  );

-- le destinataire peut marquer lu
drop policy if exists "mark read" on public.messages;
create policy "mark read" on public.messages
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- temps réel : notifie l'app à chaque nouveau message
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

-- ---------- PHOTOS DE PROGRESSION ----------
create table if not exists public.progress_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null default current_date,
  path       text not null,
  created_at timestamptz not null default now()
);
create index if not exists progress_user_idx on public.progress_photos(user_id, date);
alter table public.progress_photos enable row level security;
drop policy if exists "own progress" on public.progress_photos;
create policy "own progress" on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- bucket privé ; chaque utilisateur ne voit que son dossier (user_id/...)
insert into storage.buckets (id, name, public) values ('progress', 'progress', false)
on conflict (id) do nothing;

drop policy if exists "progress read own" on storage.objects;
create policy "progress read own" on storage.objects
  for select using (bucket_id = 'progress' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "progress write own" on storage.objects;
create policy "progress write own" on storage.objects
  for insert with check (bucket_id = 'progress' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "progress delete own" on storage.objects;
create policy "progress delete own" on storage.objects
  for delete using (bucket_id = 'progress' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- COMPARAISON ENRICHIE (défi entre proches) ----------
-- Renvoie un aperçu agrégé du proche `other` pour la date locale `d`,
-- limité aux catégories qu'il partage. Aucune donnée alimentaire détaillée
-- n'est exposée : seul un compteur « objectifs atteints » est renvoyé.
create or replace function public.connected_overview(other uuid, d date)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  cats  text[];
  res   jsonb := '{}'::jsonb;
  w_start numeric; w_cur numeric; tkg numeric; pkg numeric;
  st int := 0; sl int := 0; gl int := 0;
  pts int := 0; ct int; cons int := 0;
  goals int := 0;
begin
  select case when c.requester_id = auth.uid() then c.addressee_categories else c.requester_categories end
    into cats
  from public.connections c
  where c.status = 'accepted'
    and ((c.requester_id = auth.uid() and c.addressee_id = other)
      or (c.addressee_id = auth.uid() and c.requester_id = other));
  if cats is null then return null; end if;

  select coalesce(points, 0), target_kg, weight_kg, calorie_target
    into pts, tkg, pkg, ct from public.profiles where id = other;
  res := res || jsonb_build_object('points', pts, 'categories', to_jsonb(cats));

  if 'poids' = any(cats) then
    select weight_kg into w_start from public.weight_logs where user_id = other order by date asc  limit 1;
    select weight_kg into w_cur   from public.weight_logs where user_id = other order by date desc limit 1;
    res := res || jsonb_build_object('weight_start', w_start, 'weight_current', coalesce(w_cur, pkg), 'target_kg', tkg);
  end if;

  if 'pas' = any(cats) then
    select coalesce(steps, 0), coalesce(sleep_min, 0), coalesce(glasses, 0)
      into st, sl, gl from public.water_logs where user_id = other and date = d;
    select coalesce(sum(kcal), 0) into cons from public.food_entries where user_id = other and date = d;
    if coalesce(st, 0) >= 8000 then goals := goals + 1; end if;
    if coalesce(gl, 0) >= 8 then goals := goals + 1; end if;
    if ct is not null and cons > 0 and cons <= ct then goals := goals + 1; end if;
    res := res || jsonb_build_object('steps', coalesce(st, 0), 'sleep_min', coalesce(sl, 0), 'glasses', coalesce(gl, 0), 'goals_met', goals);
  end if;

  return res;
end $$;
