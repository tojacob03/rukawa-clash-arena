-- Off the clock: Duft-Tagebuch. Ein Eintrag pro Tag, per Handy mit einem Tipp.
-- Schema "personal" ist von außen nicht erreichbar; nach außen gibt es nur
-- eine Lesefunktion (öffentlich) und eine Schreibfunktion (mit Token).
create extension if not exists pgcrypto with schema extensions;

create schema if not exists personal;
revoke all on schema personal from public, anon, authenticated;

create table if not exists personal.fragrances (
  id         serial primary key,
  name       text not null check (length(name) between 1 and 80),
  house      text check (house is null or length(house) <= 80),
  created_at timestamptz not null default now()
);
create unique index if not exists fragrances_name_key on personal.fragrances (lower(name));

create table if not exists personal.fragrance_log (
  worn_on      date primary key,
  fragrance_id integer not null references personal.fragrances(id) on delete cascade,
  logged_at    timestamptz not null default now()
);

create table if not exists personal.settings (
  key   text primary key,
  value text not null
);

-- Token zum Eintragen setzen (nur im SQL Editor ausführbar, nie über die API).
-- Gespeichert wird nur ein bcrypt-Hash, nie der Token selbst.
create or replace function personal.set_log_token(p_token text)
returns void
language plpgsql
set search_path = personal, extensions, public
as $$
begin
  if length(coalesce(p_token, '')) < 16 then
    raise exception 'Der Token muss mindestens 16 Zeichen lang sein.';
  end if;
  insert into personal.settings (key, value)
  values ('fragrance_token', extensions.crypt(p_token, extensions.gen_salt('bf', 10)))
  on conflict (key) do update set value = excluded.value;
end;
$$;

-- Öffentliche Lesefunktion für die Seite /off-the-clock
create or replace function public.fragrance_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with
  today as (select (now() at time zone 'Europe/Berlin')::date as d),
  recent as (
    select l.worn_on, l.fragrance_id
    from personal.fragrance_log l, today
    where l.worn_on > today.d - 35
  ),
  latest as (
    select l.worn_on, f.id, f.name, f.house
    from personal.fragrance_log l
    join personal.fragrances f on f.id = l.fragrance_id
    order by l.worn_on desc
    limit 1
  ),
  counts as (
    select f.id, f.name, f.house,
           (select count(*) from personal.fragrance_log l where l.fragrance_id = f.id) as worn_total,
           (select count(*) from recent r where r.fragrance_id = f.id) as worn_recent
    from personal.fragrances f
  )
  select jsonb_build_object(
    'today', (select d from today),
    'latest', (select jsonb_build_object('worn_on', worn_on, 'id', id, 'name', name, 'house', house) from latest),
    'recent', coalesce((select jsonb_agg(jsonb_build_array(worn_on, fragrance_id) order by worn_on) from recent), '[]'::jsonb),
    'collection', coalesce((select jsonb_agg(jsonb_build_object(
                      'id', id, 'name', name, 'house', house,
                      'worn_total', worn_total, 'worn_recent', worn_recent)
                    order by worn_recent desc, worn_total desc, name) from counts), '[]'::jsonb),
    'days_logged', (select count(*) from personal.fragrance_log)
  );
$$;

-- Eintragen: Duft für heute setzen (legt ihn an, falls neu). Nur mit gültigem Token.
create or replace function public.log_fragrance(p_token text, p_name text, p_house text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash  text;
  v_name  text := btrim(coalesce(p_name, ''));
  v_house text := nullif(btrim(coalesce(p_house, '')), '');
  v_id    integer;
begin
  select value into v_hash from personal.settings where key = 'fragrance_token';
  if v_hash is null or p_token is null or extensions.crypt(p_token, v_hash) <> v_hash then
    raise exception 'Invalid token' using errcode = '28000';
  end if;
  if length(v_name) = 0 or length(v_name) > 80 or length(coalesce(v_house, '')) > 80 then
    raise exception 'Invalid name';
  end if;

  select id into v_id from personal.fragrances where lower(name) = lower(v_name);
  if v_id is null then
    insert into personal.fragrances (name, house) values (v_name, v_house) returning id into v_id;
  elsif v_house is not null then
    update personal.fragrances set house = v_house where id = v_id and house is null;
  end if;

  insert into personal.fragrance_log (worn_on, fragrance_id, logged_at)
  values ((now() at time zone 'Europe/Berlin')::date, v_id, now())
  on conflict (worn_on) do update set fragrance_id = excluded.fragrance_id, logged_at = excluded.logged_at;

  return public.fragrance_status();
end;
$$;

revoke all on all tables in schema personal from public, anon, authenticated;
revoke all on function personal.set_log_token(text) from public, anon, authenticated;
revoke all on function public.fragrance_status() from public;
revoke all on function public.log_fragrance(text, text, text) from public;
grant execute on function public.fragrance_status() to anon, authenticated;
grant execute on function public.log_fragrance(text, text, text) to anon, authenticated;
