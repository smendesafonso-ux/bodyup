-- BODYUP — partage de recettes entre amis connectés
-- À coller dans : Supabase → SQL Editor → New query → Run
create table if not exists public.shared_recipes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  from_username text,
  to_user uuid not null references auth.users(id) on delete cascade,
  recipe jsonb not null,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.shared_recipes enable row level security;

-- Lecture : l'expéditeur et le destinataire voient l'entrée
drop policy if exists "shared_recipes read" on public.shared_recipes;
create policy "shared_recipes read" on public.shared_recipes for select
  using (auth.uid() = to_user or auth.uid() = from_user);

-- Envoi : seulement vers un AMI connecté (connexion acceptée), en son propre nom
drop policy if exists "shared_recipes insert" on public.shared_recipes;
create policy "shared_recipes insert" on public.shared_recipes for insert
  with check (
    auth.uid() = from_user and exists (
      select 1 from public.connections c where c.status = 'accepted'
        and ((c.requester_id = auth.uid() and c.addressee_id = to_user)
          or (c.addressee_id = auth.uid() and c.requester_id = to_user))
    )
  );

-- Le destinataire peut marquer comme vue ; chacun peut supprimer son lien
drop policy if exists "shared_recipes update" on public.shared_recipes;
create policy "shared_recipes update" on public.shared_recipes for update using (auth.uid() = to_user);
drop policy if exists "shared_recipes delete" on public.shared_recipes;
create policy "shared_recipes delete" on public.shared_recipes for delete using (auth.uid() = to_user or auth.uid() = from_user);

create index if not exists shared_recipes_to_idx on public.shared_recipes(to_user, created_at desc);
