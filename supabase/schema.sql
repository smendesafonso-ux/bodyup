-- ============================================================
-- BODYUP — schéma Supabase (PostgreSQL)
-- À coller dans : Supabase → SQL Editor → New query → Run
-- Crée les tables, la sécurité par utilisateur (RLS) et le
-- profil automatique à l'inscription.
-- ============================================================

-- ---------- PROFILS ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  sexe          text check (sexe in ('homme','femme')),
  age           int,
  height_cm     int,
  weight_kg     numeric(5,1),
  target_kg     numeric(5,1),
  goal          text check (goal in ('perte','maintien','masse')),
  activity      numeric(4,3),     -- facteur TDEE (1.2 … 1.9)
  pace          numeric(4,2),     -- kg / semaine
  bmr           int,
  tdee          int,
  calorie_target int,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- REPAS DU JOURNAL ----------
create table if not exists public.food_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null default current_date,
  meal_type  text not null check (meal_type in ('petit-dej','dejeuner','collation','diner')),
  name       text not null,
  qty        text,
  kcal       int not null default 0,
  protein    int not null default 0,
  carbs      int not null default 0,
  fat        int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists food_entries_user_date_idx on public.food_entries(user_id, date);

-- ---------- HYDRATATION ----------
create table if not exists public.water_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date    date not null default current_date,
  glasses int not null default 0,
  primary key (user_id, date)
);

-- ---------- POIDS ----------
create table if not exists public.weight_logs (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date    date not null default current_date,
  weight_kg numeric(5,1) not null
);
create index if not exists weight_logs_user_date_idx on public.weight_logs(user_id, date);

-- ---------- SÉANCES RÉALISÉES ----------
create table if not exists public.workout_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null default current_date,
  name       text not null,
  kcal       int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists workout_logs_user_date_idx on public.workout_logs(user_id, date);

-- ============================================================
-- SÉCURITÉ : Row Level Security — chaque user ne voit que ses lignes
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.food_entries  enable row level security;
alter table public.water_logs    enable row level security;
alter table public.weight_logs   enable row level security;
alter table public.workout_logs  enable row level security;

-- profiles
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- food_entries
drop policy if exists "own food" on public.food_entries;
create policy "own food" on public.food_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- water_logs
drop policy if exists "own water" on public.water_logs;
create policy "own water" on public.water_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- weight_logs
drop policy if exists "own weight" on public.weight_logs;
create policy "own weight" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- workout_logs
drop policy if exists "own workout" on public.workout_logs;
create policy "own workout" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Création automatique d'un profil vide à chaque inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
