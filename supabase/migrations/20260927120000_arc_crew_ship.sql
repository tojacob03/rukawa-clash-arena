-- Waza Arc: the crew ship keeps the miles of members who leave.
--
-- A crew sails one ship: every member's card carries the sea miles they
-- logged on board since joining (card.aboard = {id, miles}). When a member
-- leaves or is put ashore, those miles stay with the ship: they are added to
-- arc.crews.banked before the membership row goes, so the ship never sails
-- backwards. arc_social_state returns banked with the crew.
--
-- The value comes from the member's own card, like everything else a card
-- shows; it is clamped here as a second line after the app's checks.

alter table arc.crews add column if not exists banked numeric not null default 0;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'crews_banked_range') then
    alter table arc.crews add constraint crews_banked_range check (banked >= 0 and banked <= 10000000);
  end if;
end;
$$;

create or replace function arc.crew_bank()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  select p.card -> 'aboard' into v from arc.profiles p where p.user_id = old.user_id;
  if v is not null and jsonb_typeof(v) = 'object' and v ->> 'id' = old.crew_id::text and jsonb_typeof(v -> 'miles') = 'number' then
    update arc.crews
    set banked = least(banked + least(greatest((v ->> 'miles')::numeric, 0), 1000000), 10000000)
    where id = old.crew_id;
  end if;
  return old;
end;
$$;
revoke all on function arc.crew_bank() from public, anon, authenticated;
drop trigger if exists crew_members_bank on arc.crew_members;
create trigger crew_members_bank before delete on arc.crew_members for each row execute function arc.crew_bank();

-- Same as in 20260926120000_arc_social.sql, with 'banked' in the crew.
create or replace function public.arc_social_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  me arc.profiles;
  v_crew jsonb;
  v_gym jsonb;
  v_visible boolean;
begin
  if uid is null then
    raise exception 'arc_not_signed_in' using errcode = '28000';
  end if;
  if not arc.mfa_satisfied() then
    raise exception 'arc_mfa_required' using errcode = '28000';
  end if;
  select * into me from arc.profiles where user_id = uid;
  if me.user_id is null then
    return jsonb_build_object('me', null);
  end if;

  select jsonb_build_object(
    'id', c.id, 'name', c.name, 'flag', c.flag, 'code', c.code, 'captain', m.captain, 'banked', c.banked,
    'members', (
      select coalesce(jsonb_agg(arc.card_json(p) || jsonb_build_object('captain', cm.captain, 'joined', cm.joined_at) order by cm.joined_at), '[]'::jsonb)
      from arc.crew_members cm join arc.profiles p on p.user_id = cm.user_id
      where cm.crew_id = c.id))
  into v_crew
  from arc.crew_members m join arc.crews c on c.id = m.crew_id
  where m.user_id = uid;

  select gm.visible into v_visible from arc.gym_members gm where gm.user_id = uid;
  select jsonb_build_object(
    'id', g.id, 'name', g.name, 'city', g.city, 'code', g.code, 'visible', gm.visible,
    'count', (select count(*) from arc.gym_members x where x.gym_id = g.id),
    'members', case when gm.visible then (
      select coalesce(jsonb_agg(arc.card_json(p) order by p.name), '[]'::jsonb)
      from arc.gym_members x join arc.profiles p on p.user_id = x.user_id
      where x.gym_id = g.id and x.visible) else '[]'::jsonb end)
  into v_gym
  from arc.gym_members gm join arc.gyms g on g.id = gm.gym_id
  where gm.user_id = uid;

  return jsonb_build_object(
    'me', jsonb_build_object('id', me.user_id, 'code', me.code, 'name', me.name, 'share_times', me.share_times),
    'friends', (
      select coalesce(jsonb_agg(arc.card_json(p) || jsonb_build_object('since', f.accepted_at) order by p.name), '[]'::jsonb)
      from arc.friendships f join arc.profiles p on p.user_id = case when f.a = uid then f.b else f.a end
      where (f.a = uid or f.b = uid) and f.accepted_at is not null),
    'incoming', (
      select coalesce(jsonb_agg(arc.card_json(p) || jsonb_build_object('at', f.created_at) order by f.created_at desc), '[]'::jsonb)
      from arc.friendships f join arc.profiles p on p.user_id = f.requested_by
      where (f.a = uid or f.b = uid) and f.accepted_at is null and f.requested_by <> uid),
    'outgoing', (
      select coalesce(jsonb_agg(jsonb_build_object('id', p.user_id, 'name', p.name, 'at', f.created_at) order by f.created_at desc), '[]'::jsonb)
      from arc.friendships f join arc.profiles p on p.user_id = case when f.a = uid then f.b else f.a end
      where (f.a = uid or f.b = uid) and f.accepted_at is null and f.requested_by = uid),
    'crew', v_crew,
    'gym', v_gym
  );
end;
$$;
