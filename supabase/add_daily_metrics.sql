-- BODYUP — ajoute pas + sommeil aux données journalières
-- À coller dans : Supabase → SQL Editor → New query → Run
alter table public.water_logs add column if not exists steps     int not null default 0;
alter table public.water_logs add column if not exists sleep_min  int not null default 0;
