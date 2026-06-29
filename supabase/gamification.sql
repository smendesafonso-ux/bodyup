-- BODYUP — points & niveau (gamification)
-- À coller dans : Supabase → SQL Editor → New query → Run
alter table public.profiles add column if not exists points int not null default 0;
alter table public.profiles add column if not exists level  int not null default 1;

-- Points d'un proche CONNECTÉ (pour le défi). N'expose que les points.
create or replace function public.connected_points(other uuid)
returns int language sql security definer set search_path = public stable as $$
  select p.points from public.profiles p
  where p.id = other and exists (
    select 1 from public.connections c where c.status = 'accepted'
      and ((c.requester_id = auth.uid() and c.addressee_id = other)
        or (c.addressee_id = auth.uid() and c.requester_id = other))
  );
$$;
grant execute on function public.connected_points(uuid) to authenticated;
