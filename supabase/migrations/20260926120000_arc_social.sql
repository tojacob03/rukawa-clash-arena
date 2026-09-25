-- Waza Arc: friends, pirate crews and gyms.
--
-- Everything social is opt-in. A player who switches it on publishes a
-- profile: a display name, a friend code and a "card" with game values (belt,
-- level, power level, flame, avatar, ship, position on the sea chart). Nothing
-- from the training log itself leaves the device this way.
--
-- Who sees a card:
--   * accepted friends,
--   * members of the same pirate crew,
--   * members of the same gym, if both chose to be visible there.
-- Training times (from the weekly plan) only if the owner turned that on.
--
-- Friends come by code (no global user search). Crews and gyms are separate:
-- a crew is a group of friends that sail together (at most 12), a gym is the
-- place you train at; everyone who has its code can join it.
--
-- As with the other arc tables, nobody reads the tables directly: all access
-- goes through the functions below, which check auth.uid().

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists arc.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  name text not null check (length(name) between 1 and 32),
  card jsonb not null default '{}'::jsonb check (jsonb_typeof(card) = 'object' and pg_column_size(card) <= 16384),
  slots jsonb check (slots is null or (jsonb_typeof(slots) = 'array' and pg_column_size(slots) <= 4096)),
  share_times boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arc.friendships (
  a uuid not null references arc.profiles (user_id) on delete cascade,
  b uuid not null references arc.profiles (user_id) on delete cascade,
  requested_by uuid not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (a, b),
  check (a < b),
  check (requested_by in (a, b))
);
create index if not exists friendships_b_idx on arc.friendships (b);

create table if not exists arc.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 40),
  flag jsonb not null default '{}'::jsonb check (jsonb_typeof(flag) = 'object' and pg_column_size(flag) <= 1024),
  code text not null unique check (code ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  created_at timestamptz not null default now()
);

create table if not exists arc.crew_members (
  user_id uuid primary key references arc.profiles (user_id) on delete cascade,
  crew_id uuid not null references arc.crews (id) on delete cascade,
  captain boolean not null default false,
  joined_at timestamptz not null default now()
);
create index if not exists crew_members_crew_idx on arc.crew_members (crew_id);

create table if not exists arc.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 60),
  city text not null default '' check (length(city) <= 40),
  code text not null unique check (code ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists gyms_name_idx on arc.gyms (lower(name));

create table if not exists arc.gym_members (
  user_id uuid primary key references arc.profiles (user_id) on delete cascade,
  gym_id uuid not null references arc.gyms (id) on delete cascade,
  visible boolean not null default true,
  joined_at timestamptz not null default now()
);
create index if not exists gym_members_gym_idx on arc.gym_members (gym_id);

alter table arc.profiles enable row level security;
alter table arc.friendships enable row level security;
alter table arc.crews enable row level security;
alter table arc.crew_members enable row level security;
alter table arc.gyms enable row level security;
alter table arc.gym_members enable row level security;
revoke all on arc.profiles, arc.friendships, arc.crews, arc.crew_members, arc.gyms, arc.gym_members from public, anon, authenticated;

-- ── Helpers (not callable from outside) ─────────────────────────────────────

-- XXXX-XXXX from an alphabet without look-alikes (no 0/O, 1/I/L).
create or replace function arc.new_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(8);
  s text := '';
begin
  for i in 0..7 loop
    s := s || substr(alphabet, (get_byte(b, i) % length(alphabet)) + 1, 1);
    if i = 3 then
      s := s || '-';
    end if;
  end loop;
  return s;
end;
$$;

-- The signed-in player, with a published profile. Raises otherwise.
create or replace function arc.social_me()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'arc_not_signed_in' using errcode = '28000';
  end if;
  if not arc.mfa_satisfied() then
    raise exception 'arc_mfa_required' using errcode = '28000';
  end if;
  if not exists (select 1 from arc.profiles where user_id = uid) then
    raise exception 'arc_social_off' using errcode = '22023';
  end if;
  return uid;
end;
$$;

-- Normalises a typed code: upper case, without spaces, with the dash.
create or replace function arc.clean_code(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when length(c) = 8 then substr(c, 1, 4) || '-' || substr(c, 5, 4) else c end
  from (select regexp_replace(upper(coalesce(p, '')), '[^A-Z0-9]', '', 'g') as c) t;
$$;

-- One card as others see it: training times only if shared.
create or replace function arc.card_json(p arc.profiles)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.user_id,
    'name', p.name,
    'card', p.card,
    'slots', case when p.share_times then coalesce(p.slots, '[]'::jsonb) else null end,
    'updated', p.updated_at
  );
$$;

-- A crew with its last member gone disappears; a crew without captain gets
-- the longest-serving member as captain.
create or replace function arc.crew_after_leave()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from arc.crew_members where crew_id = old.crew_id) then
    delete from arc.crews where id = old.crew_id;
  elsif old.captain and not exists (select 1 from arc.crew_members where crew_id = old.crew_id and captain) then
    update arc.crew_members set captain = true
    where user_id = (select user_id from arc.crew_members where crew_id = old.crew_id order by joined_at, user_id limit 1);
  end if;
  return null;
end;
$$;
drop trigger if exists crew_after_leave on arc.crew_members;
create trigger crew_after_leave after delete on arc.crew_members for each row execute function arc.crew_after_leave();

-- ── Profile ─────────────────────────────────────────────────────────────────

-- Switch on or update: name, card, training times. Returns the friend code.
-- With p_create false only an existing profile is updated (the app's
-- automatic card updates), so a device that has not heard yet that social was
-- switched off elsewhere cannot switch it back on. A null name keeps the name.
create or replace function public.arc_social_publish(p_name text, p_card jsonb, p_slots jsonb default null, p_share_times boolean default null, p_create boolean default true)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_name text := btrim(p_name);
  v_code text;
begin
  if uid is null then
    raise exception 'arc_not_signed_in' using errcode = '28000';
  end if;
  if not arc.mfa_satisfied() then
    raise exception 'arc_mfa_required' using errcode = '28000';
  end if;
  if v_name is not null and (length(v_name) < 1 or length(v_name) > 32) then
    raise exception 'arc_bad_name' using errcode = '22023';
  end if;
  if p_card is null or jsonb_typeof(p_card) <> 'object' or pg_column_size(p_card) > 16384 then
    raise exception 'arc_bad_card' using errcode = '22023';
  end if;
  update arc.profiles
  set name = coalesce(v_name, name), card = p_card,
      slots = case when p_slots is not null and jsonb_typeof(p_slots) = 'array' then p_slots else slots end,
      share_times = coalesce(p_share_times, share_times),
      updated_at = now()
  where user_id = uid
  returning code into v_code;
  if v_code is null and not coalesce(p_create, true) then
    raise exception 'arc_social_off' using errcode = '22023';
  end if;
  if v_code is null and v_name is null then
    raise exception 'arc_bad_name' using errcode = '22023';
  end if;
  while v_code is null loop
    begin
      insert into arc.profiles (user_id, code, name, card, slots, share_times)
      values (uid, arc.new_code(), v_name, p_card, case when jsonb_typeof(p_slots) = 'array' then p_slots end, coalesce(p_share_times, false))
      on conflict (user_id) do nothing
      returning code into v_code;
      -- A second call won the race: take its code.
      if v_code is null then
        select code into v_code from arc.profiles where user_id = uid;
      end if;
    exception when unique_violation then
      -- The random code is taken: the loop draws another one.
      null;
    end;
  end loop;
  return v_code;
end;
$$;

-- Switch off: the profile goes, and with it friendships and memberships.
create or replace function public.arc_social_disable()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'arc_not_signed_in' using errcode = '28000';
  end if;
  delete from arc.profiles where user_id = auth.uid();
end;
$$;

-- Everything the player may see, in one call.
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
    'id', c.id, 'name', c.name, 'flag', c.flag, 'code', c.code, 'captain', m.captain,
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

-- ── Friends ─────────────────────────────────────────────────────────────────

-- By friend code. If the other side already asked, this accepts.
create or replace function public.arc_friend_add(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
  other uuid;
  lo uuid;
  hi uuid;
  f arc.friendships;
begin
  select user_id into other from arc.profiles where code = arc.clean_code(p_code);
  if other is null then
    raise exception 'arc_code_unknown' using errcode = '22023';
  end if;
  if other = uid then
    raise exception 'arc_code_self' using errcode = '22023';
  end if;
  lo := least(uid, other);
  hi := greatest(uid, other);
  select * into f from arc.friendships where a = lo and b = hi;
  if f.a is not null then
    if f.accepted_at is not null then
      return 'friends';
    elsif f.requested_by = other then
      update arc.friendships set accepted_at = now() where a = lo and b = hi;
      return 'accepted';
    end if;
    return 'pending';
  end if;
  if (select count(*) from arc.friendships where (a = uid or b = uid) and requested_by = uid and accepted_at is null) >= 50 then
    raise exception 'arc_friend_limit' using errcode = '22023';
  end if;
  if (select count(*) from arc.friendships where (a = uid or b = uid) and accepted_at is not null) >= 300 then
    raise exception 'arc_friend_limit' using errcode = '22023';
  end if;
  insert into arc.friendships (a, b, requested_by) values (lo, hi, uid);
  return 'requested';
end;
$$;

create or replace function public.arc_friend_answer(p_user uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
begin
  if p_accept then
    update arc.friendships set accepted_at = now()
    where a = least(uid, p_user) and b = greatest(uid, p_user) and requested_by = p_user and accepted_at is null;
  else
    delete from arc.friendships
    where a = least(uid, p_user) and b = greatest(uid, p_user) and requested_by = p_user and accepted_at is null;
  end if;
end;
$$;

-- Unfriend, or take back a request.
create or replace function public.arc_friend_remove(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
begin
  delete from arc.friendships where a = least(uid, p_user) and b = greatest(uid, p_user);
end;
$$;

-- ── Crews ───────────────────────────────────────────────────────────────────

create or replace function public.arc_crew_create(p_name text, p_flag jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
  v_name text := btrim(coalesce(p_name, ''));
  v_id uuid;
  v_code text;
begin
  if exists (select 1 from arc.crew_members where user_id = uid) then
    raise exception 'arc_in_crew' using errcode = '22023';
  end if;
  if length(v_name) < 2 or length(v_name) > 40 then
    raise exception 'arc_bad_name' using errcode = '22023';
  end if;
  if p_flag is null or jsonb_typeof(p_flag) <> 'object' or pg_column_size(p_flag) > 1024 then
    raise exception 'arc_bad_card' using errcode = '22023';
  end if;
  loop
    begin
      insert into arc.crews (name, flag, code) values (v_name, p_flag, arc.new_code()) returning id, code into v_id, v_code;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;
  insert into arc.crew_members (user_id, crew_id, captain) values (uid, v_id, true);
  return v_code;
end;
$$;

create or replace function public.arc_crew_join(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
  v_crew arc.crews;
begin
  select * into v_crew from arc.crews where code = arc.clean_code(p_code);
  if v_crew.id is null then
    raise exception 'arc_code_unknown' using errcode = '22023';
  end if;
  if exists (select 1 from arc.crew_members where user_id = uid and crew_id = v_crew.id) then
    return v_crew.name;
  end if;
  if exists (select 1 from arc.crew_members where user_id = uid) then
    raise exception 'arc_in_crew' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext(v_crew.id::text));
  if (select count(*) from arc.crew_members where crew_id = v_crew.id) >= 12 then
    raise exception 'arc_crew_full' using errcode = '22023';
  end if;
  insert into arc.crew_members (user_id, crew_id) values (uid, v_crew.id);
  return v_crew.name;
end;
$$;

create or replace function public.arc_crew_leave()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from arc.crew_members where user_id = arc.social_me();
end;
$$;

-- Captain only: rename, change the flag, send someone off the ship.
create or replace function public.arc_crew_edit(p_name text, p_flag jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
  v_crew uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  select crew_id into v_crew from arc.crew_members where user_id = uid and captain;
  if v_crew is null then
    raise exception 'arc_not_captain' using errcode = '42501';
  end if;
  if length(v_name) < 2 or length(v_name) > 40 then
    raise exception 'arc_bad_name' using errcode = '22023';
  end if;
  if p_flag is null or jsonb_typeof(p_flag) <> 'object' or pg_column_size(p_flag) > 1024 then
    raise exception 'arc_bad_card' using errcode = '22023';
  end if;
  update arc.crews set name = v_name, flag = p_flag where id = v_crew;
end;
$$;

create or replace function public.arc_crew_kick(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
  v_crew uuid;
begin
  select crew_id into v_crew from arc.crew_members where user_id = uid and captain;
  if v_crew is null then
    raise exception 'arc_not_captain' using errcode = '42501';
  end if;
  if p_user = uid then
    raise exception 'arc_code_self' using errcode = '22023';
  end if;
  delete from arc.crew_members where user_id = p_user and crew_id = v_crew;
end;
$$;

-- ── Gyms ────────────────────────────────────────────────────────────────────

-- Find a gym by name. Shows name, city and head count; the code stays with members.
create or replace function public.arc_gym_find(p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  q text := btrim(coalesce(p_query, ''));
begin
  perform arc.social_me();
  if length(q) < 2 then
    return '[]'::jsonb;
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'city', g.city, 'count', (select count(*) from arc.gym_members m where m.gym_id = g.id)) order by g.name), '[]'::jsonb)
    from (
      select * from arc.gyms
      where lower(name) like '%' || lower(replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_')) || '%'
         or lower(city) like '%' || lower(replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_')) || '%'
      order by name
      limit 12
    ) g
  );
end;
$$;

create or replace function public.arc_gym_create(p_name text, p_city text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
  v_name text := btrim(coalesce(p_name, ''));
  v_city text := btrim(coalesce(p_city, ''));
  v_id uuid;
  v_code text;
begin
  if length(v_name) < 2 or length(v_name) > 60 or length(v_city) > 40 then
    raise exception 'arc_bad_name' using errcode = '22023';
  end if;
  if (select count(*) from arc.gyms where created_by = uid and created_at > now() - interval '1 day') >= 3 then
    raise exception 'arc_gym_limit' using errcode = '22023';
  end if;
  loop
    begin
      insert into arc.gyms (name, city, code, created_by) values (v_name, v_city, arc.new_code(), uid) returning id, code into v_id, v_code;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;
  insert into arc.gym_members (user_id, gym_id) values (uid, v_id)
  on conflict (user_id) do update set gym_id = excluded.gym_id, joined_at = now();
  return v_code;
end;
$$;

-- Join with the gym's code (it hangs on the gym wall or comes from someone
-- who trains there). One gym per player; joining another one moves you.
create or replace function public.arc_gym_join(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := arc.social_me();
  v_gym arc.gyms;
begin
  select * into v_gym from arc.gyms where code = arc.clean_code(p_code);
  if v_gym.id is null then
    raise exception 'arc_code_unknown' using errcode = '22023';
  end if;
  insert into arc.gym_members (user_id, gym_id) values (uid, v_gym.id)
  on conflict (user_id) do update set gym_id = excluded.gym_id, joined_at = case when arc.gym_members.gym_id = excluded.gym_id then arc.gym_members.joined_at else now() end;
  return v_gym.name;
end;
$$;

create or replace function public.arc_gym_leave()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from arc.gym_members where user_id = arc.social_me();
end;
$$;

create or replace function public.arc_gym_visible(p_visible boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update arc.gym_members set visible = coalesce(p_visible, true) where user_id = arc.social_me();
end;
$$;

-- ── Rights ──────────────────────────────────────────────────────────────────

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.arc_social_publish(text, jsonb, jsonb, boolean, boolean)',
    'public.arc_social_disable()',
    'public.arc_social_state()',
    'public.arc_friend_add(text)',
    'public.arc_friend_answer(uuid, boolean)',
    'public.arc_friend_remove(uuid)',
    'public.arc_crew_create(text, jsonb)',
    'public.arc_crew_join(text)',
    'public.arc_crew_leave()',
    'public.arc_crew_edit(text, jsonb)',
    'public.arc_crew_kick(uuid)',
    'public.arc_gym_find(text)',
    'public.arc_gym_create(text, text)',
    'public.arc_gym_join(text)',
    'public.arc_gym_leave()',
    'public.arc_gym_visible(boolean)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  foreach f in array array['arc.new_code()', 'arc.social_me()', 'arc.clean_code(text)', 'arc.card_json(arc.profiles)', 'arc.crew_after_leave()'] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
end;
$$;
