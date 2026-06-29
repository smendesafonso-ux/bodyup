-- BODYUP — partage entre utilisateurs (par email, validation, mutuel)
-- À coller dans : Supabase → SQL Editor → New query → Run

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  requester_email text not null,
  addressee_email text not null,
  addressee_id uuid references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  requester_categories text[] not null default array['poids','pas','courses'],
  addressee_categories text[] not null default array['poids','pas','courses'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conn_req_idx on public.connections(requester_id);
create index if not exists conn_addr_email_idx on public.connections(lower(addressee_email));
create index if not exists conn_addr_idx on public.connections(addressee_id);

alter table public.connections enable row level security;

-- Une connexion est visible par le demandeur ET par le destinataire (par email ou id)
drop policy if exists "conn read" on public.connections;
create policy "conn read" on public.connections for select using (
  auth.uid() = requester_id
  or auth.uid() = addressee_id
  or lower(addressee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);
drop policy if exists "conn insert" on public.connections;
create policy "conn insert" on public.connections for insert with check (auth.uid() = requester_id);
drop policy if exists "conn update" on public.connections;
create policy "conn update" on public.connections for update using (
  auth.uid() = requester_id or auth.uid() = addressee_id
  or lower(addressee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
) with check (
  auth.uid() = requester_id or auth.uid() = addressee_id
  or lower(addressee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);
drop policy if exists "conn delete" on public.connections;
create policy "conn delete" on public.connections for delete using (
  auth.uid() = requester_id or auth.uid() = addressee_id
  or lower(addressee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- ===== Lecture partagée des données (en plus de l'accès à ses propres lignes) =====
drop policy if exists "weight shared read" on public.weight_logs;
create policy "weight shared read" on public.weight_logs for select using (
  exists (select 1 from public.connections c where c.status = 'accepted'
    and ((c.requester_id = weight_logs.user_id and c.addressee_id = auth.uid() and 'poids' = any(c.requester_categories))
      or (c.addressee_id = weight_logs.user_id and c.requester_id = auth.uid() and 'poids' = any(c.addressee_categories))))
);

drop policy if exists "water shared read" on public.water_logs;
create policy "water shared read" on public.water_logs for select using (
  exists (select 1 from public.connections c where c.status = 'accepted'
    and ((c.requester_id = water_logs.user_id and c.addressee_id = auth.uid() and 'pas' = any(c.requester_categories))
      or (c.addressee_id = water_logs.user_id and c.requester_id = auth.uid() and 'pas' = any(c.addressee_categories))))
);

drop policy if exists "pantry shared read" on public.pantry;
create policy "pantry shared read" on public.pantry for select using (
  exists (select 1 from public.connections c where c.status = 'accepted'
    and ((c.requester_id = pantry.user_id and c.addressee_id = auth.uid() and 'courses' = any(c.requester_categories))
      or (c.addressee_id = pantry.user_id and c.requester_id = auth.uid() and 'courses' = any(c.addressee_categories))))
);
