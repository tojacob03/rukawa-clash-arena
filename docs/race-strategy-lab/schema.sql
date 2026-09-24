-- Race Strategy Lab: komplettes SQL (Referenz, Stand der Datenbank)
-- Wurde als vier Migrationen in der Datenbank "Rukawa Portfolio" angewendet
-- (supabase/migrations/20260923230453 bis 20260923230809):
--   racing_schema_and_ingest, racing_analysis_and_schedule,
--   racing_fix_nested_aggregates, racing_rate_limit_and_backfill
-- Hier steht jede Funktion nur einmal, in ihrer aktuellen Fassung.
-- Diese Datei ist zum Lesen und Nachvollziehen gedacht, nicht zum erneuten Ausführen.

-- ---------------------------------------------------------------------------
-- Schema (von außen nicht erreichbar)
-- ---------------------------------------------------------------------------

create schema if not exists racing;
revoke all on schema racing from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Abruf: OpenF1 -> Rohdaten
-- ---------------------------------------------------------------------------

-- OpenF1 begrenzt kostenlose Abrufe auf 3 pro Sekunde UND 30 pro Minute.
-- Deshalb 2,1 s Pause vor jeder Anfrage; bei HTTP 429 bis zu 3-mal 20 s warten.
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
    perform pg_sleep(2.1);
    perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '60');
    v_resp := extensions.http_get('https://api.openf1.org/v1/' || p_path);
    exit when v_resp.status <> 429 or v_try >= 3;
    v_try := v_try + 1;
    perform pg_sleep(20);
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

-- ---------------------------------------------------------------------------
-- Auswertung: Rohdaten -> fertige JSON-Caches
-- ---------------------------------------------------------------------------

-- Auswertung eines Rennens. Kernideen:
--  * "Saubere" Runden: ab Runde 2, keine Out- und In-Laps, höchstens 107 % des
--    Rennmedians (filtert Safety-Car-Phasen, Dreher und Ähnliches heraus).
--  * Kraftstoffkorrektur: Ein Auto wird pro Runde ca. 0,06 s schneller, weil
--    Sprit verbrannt wird. Ohne Korrektur sähe Reifenverschleiß zu klein aus.
--  * Reifenverschleiß: Steigung (Regression) der korrigierten Rundenzeit über
--    das Reifenalter, je Fahrer-Stint gerechnet und dann je Mischung gemittelt.
create or replace function racing.build_race(p_session_key integer)
returns void
language plpgsql
set search_path = racing, public
as $$
declare
  c_fuel constant double precision := 0.06;
  v_payload jsonb;
begin
  with
  total as (
    select max(lap_number) as n from racing.laps where session_key = p_session_key
  ),
  lap_ctx as (
    select l.driver_number, l.lap_number, l.lap_duration,
           s.compound, s.stint_number,
           s.tyre_age_at_start + (l.lap_number - s.lap_start) as age,
           l.lap_duration - c_fuel * ((select n from total) - l.lap_number) as fc,
           (l.lap_number > 1
            and not coalesce(l.is_pit_out_lap, false)
            and l.lap_duration is not null
            and not exists (select 1 from racing.pits p
                            where p.session_key = l.session_key
                              and p.driver_number = l.driver_number
                              and p.lap_number = l.lap_number)) as candidate
    from racing.laps l
    left join racing.stints s
      on s.session_key = l.session_key and s.driver_number = l.driver_number
     and l.lap_number between s.lap_start and s.lap_end
    where l.session_key = p_session_key
  ),
  med as (
    select percentile_cont(0.5) within group (order by lap_duration) as m from lap_ctx where candidate
  ),
  clean as (
    select c.* from lap_ctx c, med
    where c.candidate and c.lap_duration <= med.m * 1.07 and c.compound is not null
  ),
  pace as (
    select driver_number, percentile_cont(0.5) within group (order by fc) as med_fc, count(*) as n
    from clean group by driver_number having count(*) >= 10
  ),
  best as (select min(med_fc) as b from pace),
  stint_deg as (
    select driver_number, stint_number, compound, regr_slope(fc, age) as slope, count(*) as n
    from clean group by 1, 2, 3 having count(*) >= 6
  ),
  deg_by_compound as (
    select compound, avg(slope) as s, count(*) as stints, sum(n) as laps
    from stint_deg group by compound
  ),
  deg as (
    select jsonb_agg(jsonb_build_object(
             'compound', compound, 'sec_per_lap', round(s::numeric, 3),
             'stints', stints, 'laps', laps) order by compound) as arr
    from deg_by_compound
  ),
  curve_rows as (
    select c.compound, c.age,
           percentile_cont(0.5) within group (order by c.fc - p.med_fc) as d, count(*) as n
    from clean c join pace p using (driver_number)
    group by 1, 2 having count(*) >= 4
  ),
  curve as (
    select jsonb_object_agg(compound, pts) as obj
    from (select compound, jsonb_agg(jsonb_build_array(age, round(d::numeric, 3)) order by age) as pts
          from curve_rows group by compound) x
  ),
  drivers as (
    select jsonb_agg(jsonb_build_object(
      'number', d.driver_number,
      'code', d.name_acronym,
      'name', d.full_name,
      'team', d.team_name,
      'colour', d.team_colour,
      'position', res.position,
      'status', case when res.dsq then 'DSQ' when res.dns then 'DNS' when res.dnf then 'DNF' end,
      'points', res.points,
      'gap', res.gap_to_leader,
      'laps', coalesce(res.number_of_laps,
                       (select max(lap_number) from racing.laps l
                        where l.session_key = d.session_key and l.driver_number = d.driver_number)),
      'stints', (select jsonb_agg(jsonb_build_array(s.compound, s.lap_start, s.lap_end, s.tyre_age_at_start)
                                  order by s.stint_number)
                 from racing.stints s where s.session_key = d.session_key and s.driver_number = d.driver_number),
      'pits', (select jsonb_agg(jsonb_build_array(p.lap_number, round(p.lane_duration::numeric, 1),
                                                  round(p.stop_duration::numeric, 1)) order by p.lap_number)
               from racing.pits p where p.session_key = d.session_key and p.driver_number = d.driver_number),
      'pace_delta', (select round((pc.med_fc - best.b)::numeric, 3) from pace pc, best
                     where pc.driver_number = d.driver_number)
    ) order by res.position nulls last, d.driver_number) as arr
    from racing.drivers d
    left join racing.results res on res.session_key = d.session_key and res.driver_number = d.driver_number
    where d.session_key = p_session_key
  )
  select jsonb_build_object(
    'race', (select jsonb_build_object(
               'session_key', r.session_key, 'year', r.year, 'name', r.meeting_name,
               'circuit', r.circuit_short_name, 'country', r.country_name, 'date', r.date_start,
               'total_laps', (select n from total), 'clean_laps', (select count(*) from clean),
               'fuel_correction', c_fuel)
             from racing.races r where r.session_key = p_session_key),
    'drivers', coalesce((select arr from drivers), '[]'::jsonb),
    'degradation', coalesce((select arr from deg), '[]'::jsonb),
    'tyre_curve', coalesce((select obj from curve), '{}'::jsonb)
  ) into v_payload;

  insert into racing.race_cache (session_key, payload, built_at)
  values (p_session_key, v_payload, now())
  on conflict (session_key) do update set payload = excluded.payload, built_at = excluded.built_at;
end;
$$;

-- Saisonübersicht: Rennen mit Siegern, Boxenstopps je Team, Verschleiß je Mischung, Stopps je Rennen.
create or replace function racing.build_season(p_year integer)
returns void
language plpgsql
set search_path = racing, public
as $$
declare
  v_payload jsonb;
begin
  with
  yr as (select * from racing.races where year = p_year and not is_cancelled),
  winners as (
    select res.session_key, d.name_acronym, d.team_name, d.team_colour
    from racing.results res
    join racing.drivers d using (session_key, driver_number)
    where res.position = 1 and res.session_key in (select session_key from yr)
  ),
  races as (
    select jsonb_agg(jsonb_build_object(
      'session_key', y.session_key, 'name', y.meeting_name, 'circuit', y.circuit_short_name,
      'date', y.date_start, 'loaded', exists (select 1 from racing.race_cache c where c.session_key = y.session_key),
      'winner', case when w.session_key is null then null
                     else jsonb_build_object('code', w.name_acronym, 'team', w.team_name, 'colour', w.team_colour) end
    ) order by y.date_start) as arr
    from yr y left join winners w using (session_key)
  ),
  stops as (
    select d.team_name, max(d.team_colour) as colour,
           percentile_cont(0.5) within group (order by p.stop_duration) as med_stop,
           min(p.stop_duration) as best_stop,
           percentile_cont(0.5) within group (order by p.lane_duration) as med_lane,
           count(*) as n
    from racing.pits p
    join racing.drivers d using (session_key, driver_number)
    where p.session_key in (select session_key from yr)
      and p.stop_duration between 1.5 and 10
    group by d.team_name
    having count(*) >= 5
  ),
  pit_crews as (
    select jsonb_agg(jsonb_build_object(
      'team', team_name, 'colour', colour, 'median_stop', round(med_stop::numeric, 2),
      'best_stop', round(best_stop::numeric, 1), 'median_lane', round(med_lane::numeric, 1), 'stops', n
    ) order by med_stop) as arr
    from stops
  ),
  deg_rows as (
    select e ->> 'compound' as compound, (e ->> 'sec_per_lap')::numeric as s
    from racing.race_cache c
    cross join lateral jsonb_array_elements(c.payload -> 'degradation') e
    where c.session_key in (select session_key from yr)
  ),
  deg_by_compound as (
    select compound, avg(s) as s, count(*) as races from deg_rows group by compound
  ),
  deg as (
    select jsonb_agg(jsonb_build_object('compound', compound, 'sec_per_lap', round(s, 3), 'races', races)
                     order by compound) as arr
    from deg_by_compound
  ),
  finisher_stops as (
    select res.session_key,
           (select count(*) from racing.pits p
            where p.session_key = res.session_key and p.driver_number = res.driver_number) as n
    from racing.results res
    where res.session_key in (select session_key from yr)
      and res.position is not null and not coalesce(res.dnf, false)
  ),
  stops_per_race as (
    select jsonb_agg(jsonb_build_object('session_key', f.session_key, 'circuit', y.circuit_short_name,
                                        'avg_stops', round(f.avg_n, 2)) order by y.date_start) as arr
    from (select session_key, avg(n)::numeric as avg_n from finisher_stops group by session_key) f
    join yr y using (session_key)
  )
  select jsonb_build_object(
    'year', p_year,
    'races', coalesce((select arr from races), '[]'::jsonb),
    'pit_crews', coalesce((select arr from pit_crews), '[]'::jsonb),
    'degradation', coalesce((select arr from deg), '[]'::jsonb),
    'stops_per_race', coalesce((select arr from stops_per_race), '[]'::jsonb)
  ) into v_payload;

  insert into racing.season_cache (year, payload, built_at)
  values (p_year, v_payload, now())
  on conflict (year) do update set payload = excluded.payload, built_at = excluded.built_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Betrieb: laufende Aktualisierung und einmaliges Nachladen
-- ---------------------------------------------------------------------------

-- Laufender Betrieb: Kalender aktualisieren, beendete Rennen laden, Caches neu bauen.
-- Ein Rennen gilt 2 Stunden nach Ende als abrufbar (OpenF1 wertet Daten bis
-- 30 Minuten nach Ende als "live", und live ist kostenpflichtig). In den ersten
-- Tagen danach wird einmal täglich nachgeladen, um Strafen/Korrekturen zu erfassen.
create or replace function racing.refresh(p_max integer default 3)
returns jsonb
language plpgsql
set search_path = racing, public
as $$
declare
  v_year integer := extract(year from now())::int;
  v_race record;
  v_done jsonb := '[]'::jsonb;
  v_status text;
begin
  perform racing.sync_calendar(v_year);

  for v_race in
    select session_key, year from racing.races
    where not is_cancelled
      and date_end < now() - interval '2 hours'
      and (loaded_at is null
           or (now() < date_end + interval '4 days' and loaded_at < now() - interval '20 hours'))
    order by date_start
    limit p_max
  loop
    v_status := racing.ingest_race(v_race.session_key);
    if v_status = 'ok' then
      perform racing.build_race(v_race.session_key);
    end if;
    v_done := v_done || jsonb_build_object('session_key', v_race.session_key, 'status', v_status);
  end loop;

  perform racing.build_season(v_year);
  delete from racing.ingest_runs where started_at < now() - interval '90 days';
  return v_done;
end;
$$;

-- Einmaliges Nachladen der Historie im Hintergrund: pro Lauf ein paar Rennen,
-- danach Caches bauen. Wenn nichts mehr offen ist, beendet sich der Job selbst.
create or replace function racing.backfill(p_max integer default 4)
returns jsonb
language plpgsql
set search_path = racing, public
as $$
declare
  v_race record;
  v_done jsonb := '[]'::jsonb;
  v_status text;
  v_year integer;
begin
  for v_race in
    select session_key from racing.races
    where loaded_at is null and not is_cancelled and date_end < now() - interval '2 hours'
    order by date_start
    limit p_max
  loop
    v_status := racing.ingest_race(v_race.session_key);
    v_done := v_done || jsonb_build_object('session_key', v_race.session_key, 'status', v_status);
  end loop;

  -- Caches für alle geladenen Rennen ohne Cache
  for v_race in
    select r.session_key from racing.races r
    where r.loaded_at is not null
      and not exists (select 1 from racing.race_cache c where c.session_key = r.session_key)
  loop
    perform racing.build_race(v_race.session_key);
  end loop;

  for v_year in select distinct year from racing.races loop
    perform racing.build_season(v_year);
  end loop;

  if not exists (select 1 from racing.races
                 where loaded_at is null and not is_cancelled and date_end < now() - interval '2 hours') then
    perform cron.unschedule('racing-backfill');
  end if;
  return v_done;
end;
$$;

-- ---------------------------------------------------------------------------
-- Öffentliche Schnittstellen (nur fertige Ergebnisse, keine Rohdaten)
-- ---------------------------------------------------------------------------

create or replace function public.racing_index()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'seasons', coalesce((
      select jsonb_agg(jsonb_build_object('year', s.year, 'races', s.payload -> 'races') order by s.year desc)
      from racing.season_cache s), '[]'::jsonb),
    'latest_session_key', (
      select r.session_key from racing.races r
      join racing.race_cache c on c.session_key = r.session_key
      order by r.date_start desc limit 1)
  );
$$;

create or replace function public.racing_race(p_session_key integer)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select c.payload || jsonb_build_object('built_at', c.built_at)
  from racing.race_cache c where c.session_key = p_session_key;
$$;

create or replace function public.racing_season(p_year integer)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select s.payload || jsonb_build_object('built_at', s.built_at)
  from racing.season_cache s where s.year = p_year;
$$;

-- ---------------------------------------------------------------------------
-- Rechte
-- ---------------------------------------------------------------------------

revoke all on all tables in schema racing from public, anon, authenticated;
revoke all on all functions in schema racing from public, anon, authenticated;
revoke all on function public.racing_index() from public;
revoke all on function public.racing_race(integer) from public;
revoke all on function public.racing_season(integer) from public;
grant execute on function public.racing_index() to anon, authenticated;
grant execute on function public.racing_race(integer) to anon, authenticated;
grant execute on function public.racing_season(integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Zeitpläne (pg_cron)
-- ---------------------------------------------------------------------------

-- Alle 6 Stunden nach neuen Rennen sehen
select cron.schedule('racing-refresh', '20 */6 * * *', $job$select racing.refresh(3)$job$);

-- Einmaliges Nachladen der Historie; racing.backfill() entfernt diesen Job
-- selbst, sobald alle Rennen geladen sind (in der Datenbank bereits erledigt).
select cron.schedule('racing-backfill', '*/2 * * * *', $job$select racing.backfill(4)$job$);
