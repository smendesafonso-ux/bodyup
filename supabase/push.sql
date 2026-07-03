-- ============================================================
-- BODYUP — notifications push (Web Push / VAPID)
-- À coller dans : Supabase → SQL Editor → New query → Run
-- Stocke les abonnements push de chaque appareil ; l'envoi se fait
-- par la fonction Edge « push » (clé privée VAPID côté serveur).
-- ============================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "own push" on public.push_subscriptions;
create policy "own push" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
