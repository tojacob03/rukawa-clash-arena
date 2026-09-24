-- Race Strategy Lab: Rennstrategie-Analysen aus OpenF1-Daten (historisch, kostenlos).
-- Alles im Schema "racing", von außen nicht erreichbar.
create schema if not exists racing;
revoke all on schema racing from public, anon, authenticated;

create table if not exists racing.races (
  session_key        integer primary key,
  meeting_key        integer not null,
  year               integer not null,
  meeting_name       text,
  circuit_short_name text,
  country_name       text,
  location           text,
  date_start         timestamptz not null,
  date_end           timestamptz,
  is_cancelled       boolean not null default false,
  loaded_at          timestamptz
);

create table if not exists racing.drivers (
  session_key   integer not null references racing.races(session_key) on delete cascade,
  driver_number integer not null,
  full_name     text,
  name_acronym  text,
  team_name     text,
  team_colour   text,
  primary key (session_key, driver_number)
);

create table if not exists racing.laps (
  session_key    integer not null references racing.races(session_key) on delete cascade,
  driver_number  integer not null,
  lap_number     integer not null,
  lap_duration   double precision,
  is_pit_out_lap boolean,
  date_start     timestamptz,
  primary key (session_key, driver_number, lap_number)
);

create table if not exists racing.stints (
  session_key       integer not null references racing.races(session_key) on delete cascade,
  driver_number     integer not null,
  stint_number      integer not null,
  compound          text,
  lap_start         integer,
  lap_end           integer,
  tyre_age_at_start integer,
  primary key (session_key, driver_number, stint_number)
);

create table if not exists racing.pits (
  session_key   integer not null references racing.races(session_key) on delete cascade,
  driver_number integer not null,
  lap_number    integer not null,
  lane_duration double precision,  -- Zeit in der Boxengasse
  stop_duration double precision,  -- Standzeit (nicht immer vorhanden)
  primary key (session_key, driver_number, lap_number)
);

create table if not exists racing.results (
  session_key    integer not null references racing.races(session_key) on delete cascade,
  driver_number  integer not null,
  position       integer,
  points         double precision,
  number_of_laps integer,
  dnf            boolean,
  dns            boolean,
  dsq            boolean,
  gap_to_leader  text,
  primary key (session_key, driver_number)
);

create table if not exists racing.ingest_runs (
  id          bigserial primary key,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  target      text not null,
  status      text,
  detail      text
);

create table if not exists racing.race_cache (
  session_key integer primary key references racing.races(session_key) on delete cascade,
  payload     jsonb not null,
  built_at    timestamptz not null default now()
);

create table if not exists racing.season_cache (
  year     integer primary key,
  payload  jsonb not null,
  built_at timestamptz not null default now()
);

-- Holt eine OpenF1-Adresse als JSON-Array. OpenF1 erlaubt max. 3 Anfragen pro
-- Sekunde, deshalb wird vor jeder Anfrage kurz gewartet. "Keine Ergebnisse"
-- (HTTP 404) gilt als leere Liste.
create or replace function racing.fetch(p_path text)
returns jsonb
language plpgsql
set search_path = racing, extensions, public
as $$
declare
  v_resp extensions.http_response;
  v_try  integer := 0;
begin
  loop
    perform pg_sleep(0.45);
    perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '60');
    v_resp := extensions.http_get('https://api.openf1.org/v1/' || p_path);
    exit when v_resp.status <> 429 or v_try >= 3;
    v_try := v_try + 1;
    perform pg_sleep(2);
  end loop;

  if v_resp.status = 404 then
    return '[]'::jsonb;
  elsif v_resp.status <> 200 then
    raise exception 'OpenF1 % antwortet mit HTTP %', p_path, v_resp.status;
  end if;
  return v_resp.content::jsonb;
end;
$$;

-- Rennkalender eines Jahres aktualisieren (nur Hauptrennen, keine Sprints).
create or replace function racing.sync_calendar(p_year integer)
returns integer
language plpgsql
set search_path = racing, public
as $$
declare
  v_sessions jsonb;
  v_meetings jsonb;
  v_n integer;
begin
  v_sessions := racing.fetch('sessions?year=' || p_year || '&session_name=Race');
  v_meetings := racing.fetch('meetings?year=' || p_year);

  insert into racing.races (session_key, meeting_key, year, meeting_name, circuit_short_name,
                            country_name, location, date_start, date_end, is_cancelled)
  select (s ->> 'session_key')::int,
         (s ->> 'meeting_key')::int,
         (s ->> 'year')::int,
         m ->> 'meeting_name',
         s ->> 'circuit_short_name',
         s ->> 'country_name',
         s ->> 'location',
         (s ->> 'date_start')::timestamptz,
         (s ->> 'date_end')::timestamptz,
         coalesce((s ->> 'is_cancelled')::boolean, false)
  from jsonb_array_elements(v_sessions) s
  left join lateral (
    select mm from jsonb_array_elements(v_meetings) mm
    where (mm ->> 'meeting_key')::int = (s ->> 'meeting_key')::int
    limit 1
  ) x(m) on true
  on conflict (session_key) do update set
    meeting_name = excluded.meeting_name,
    circuit_short_name = excluded.circuit_short_name,
    country_name = excluded.country_name,
    location = excluded.location,
    date_start = excluded.date_start,
    date_end = excluded.date_end,
    is_cancelled = excluded.is_cancelled;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Alle Daten eines Rennens laden (ersetzt vorhandene Daten dieses Rennens).
create or replace function racing.ingest_race(p_session_key integer)
returns text
language plpgsql
set search_path = racing, public
as $$
declare
  k       text := 'session_key=' || p_session_key;
  v_drv   jsonb;
  v_laps  jsonb;
  v_stint jsonb;
  v_pit   jsonb;
  v_res   jsonb;
  v_err   text;
begin
  v_drv   := racing.fetch('drivers?' || k);
  v_laps  := racing.fetch('laps?' || k);
  v_stint := racing.fetch('stints?' || k);
  v_pit   := racing.fetch('pit?' || k);
  v_res   := racing.fetch('session_result?' || k);

  if jsonb_array_length(v_laps) = 0 then
    raise exception 'Noch keine Rundendaten für Rennen %', p_session_key;
  end if;

  delete from racing.drivers where session_key = p_session_key;
  delete from racing.laps    where session_key = p_session_key;
  delete from racing.stints  where session_key = p_session_key;
  delete from racing.pits    where session_key = p_session_key;
  delete from racing.results where session_key = p_session_key;

  insert into racing.drivers
  select distinct on ((d ->> 'driver_number')::int)
         p_session_key, (d ->> 'driver_number')::int, d ->> 'full_name', d ->> 'name_acronym',
         d ->> 'team_name', d ->> 'team_colour'
  from jsonb_array_elements(v_drv) d
  order by (d ->> 'driver_number')::int;

  insert into racing.laps
  select distinct on ((l ->> 'driver_number')::int, (l ->> 'lap_number')::int)
         p_session_key, (l ->> 'driver_number')::int, (l ->> 'lap_number')::int,
         (l ->> 'lap_duration')::double precision, (l ->> 'is_pit_out_lap')::boolean,
         (l ->> 'date_start')::timestamptz
  from jsonb_array_elements(v_laps) l
  order by (l ->> 'driver_number')::int, (l ->> 'lap_number')::int;

  insert into racing.stints
  select distinct on ((s ->> 'driver_number')::int, (s ->> 'stint_number')::int)
         p_session_key, (s ->> 'driver_number')::int, (s ->> 'stint_number')::int,
         upper(s ->> 'compound'), (s ->> 'lap_start')::int, (s ->> 'lap_end')::int,
         (s ->> 'tyre_age_at_start')::int
  from jsonb_array_elements(v_stint) s
  order by (s ->> 'driver_number')::int, (s ->> 'stint_number')::int;

  insert into racing.pits
  select distinct on ((p ->> 'driver_number')::int, (p ->> 'lap_number')::int)
         p_session_key, (p ->> 'driver_number')::int, (p ->> 'lap_number')::int,
         coalesce((p ->> 'lane_duration')::double precision, (p ->> 'pit_duration')::double precision),
         (p ->> 'stop_duration')::double precision
  from jsonb_array_elements(v_pit) p
  where p ->> 'lap_number' is not null
  order by (p ->> 'driver_number')::int, (p ->> 'lap_number')::int;

  insert into racing.results
  select distinct on ((r ->> 'driver_number')::int)
         p_session_key, (r ->> 'driver_number')::int, (r ->> 'position')::int,
         (r ->> 'points')::double precision, (r ->> 'number_of_laps')::int,
         (r ->> 'dnf')::boolean, (r ->> 'dns')::boolean, (r ->> 'dsq')::boolean,
         r ->> 'gap_to_leader'
  from jsonb_array_elements(v_res) r
  order by (r ->> 'driver_number')::int;

  update racing.races set loaded_at = now() where session_key = p_session_key;

  insert into racing.ingest_runs (target, finished_at, status, detail)
  values ('race ' || p_session_key, now(), 'ok', jsonb_array_length(v_laps) || ' Runden');
  return 'ok';

exception when others then
  get stacked diagnostics v_err = message_text;
  insert into racing.ingest_runs (target, finished_at, status, detail)
  values ('race ' || p_session_key, now(), 'error', v_err);
  return 'error: ' || v_err;
end;
$$;

revoke all on all tables in schema racing from public, anon, authenticated;
revoke all on all functions in schema racing from public, anon, authenticated;
