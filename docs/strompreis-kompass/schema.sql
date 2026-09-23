-- Strompreis-Kompass: komplettes SQL (Referenz)
-- Wurde als drei Migrationen in der Datenbank "Rukawa Portfolio" angewendet:
--   energy_enable_http, energy_schema_and_ingest, energy_dashboard_and_schedule
-- Diese Datei ist zum Lesen und Nachvollziehen gedacht, nicht zum erneuten Ausführen.

-- ---------------------------------------------------------------------------
-- Erweiterung und Schema
-- ---------------------------------------------------------------------------
create extension if not exists http with schema extensions;   -- HTTP-Abrufe aus der Datenbank
create schema if not exists energy;
revoke all on schema energy from public, anon, authenticated;  -- von außen nicht erreichbar

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------
create table if not exists energy.series (
  key        text primary key,
  filter_id  integer not null,
  region     text    not null,
  name       text    not null,
  unit       text    not null
);

insert into energy.series (key, filter_id, region, name, unit) values
  ('price',         4169, 'DE-LU', 'Großhandelspreis Day-Ahead (DE/LU)', '€/MWh'),
  ('solar',         4068, 'DE',    'Erzeugung Photovoltaik',             'MWh'),
  ('wind_onshore',  4067, 'DE',    'Erzeugung Wind an Land',             'MWh'),
  ('wind_offshore', 1225, 'DE',    'Erzeugung Wind auf See',             'MWh'),
  ('load',           410, 'DE',    'Stromverbrauch (Netzlast)',          'MWh'),
  ('residual_load', 4359, 'DE',    'Residuallast',                       'MWh')
on conflict (key) do update
  set filter_id = excluded.filter_id, region = excluded.region, name = excluded.name, unit = excluded.unit;

create table if not exists energy.observations (
  series_key  text        not null references energy.series(key),
  resolution  text        not null check (resolution in ('quarterhour', 'hour')),
  ts          timestamptz not null,
  value       double precision not null,
  fetched_at  timestamptz not null default now(),
  primary key (series_key, resolution, ts)
);
create index if not exists observations_res_ts_idx on energy.observations (resolution, ts);

create table if not exists energy.ingest_runs (
  id            bigserial primary key,
  series_key    text not null,
  resolution    text not null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  chunks        integer,
  rows_upserted integer,
  status        text,
  error         text
);

create table if not exists energy.dashboard_cache (
  id        integer primary key default 1 check (id = 1),
  payload   jsonb not null,
  built_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Abruf einer Zeitreihe von SMARD
-- SMARD liefert Daten in Wochen-Paketen. Erst wird die Liste der Pakete
-- (index_*.json) geholt, dann die gewünschten Pakete selbst.
-- ---------------------------------------------------------------------------
create or replace function energy.ingest(
  p_series text,
  p_resolution text,
  p_chunks integer default 2,         -- laufender Betrieb: die neuesten N Pakete
  p_since timestamptz default null    -- Nachladen: alles ab diesem Zeitpunkt
) returns integer
language plpgsql
set search_path = energy, extensions, public
as $$
declare
  s        energy.series%rowtype;
  v_base   text := 'https://www.smard.de/app/chart_data/';
  v_resp   extensions.http_response;
  v_ts     bigint;
  v_n      integer;
  v_rows   integer := 0;
  v_chunks integer := 0;
  v_err    text;
begin
  select * into s from energy.series where key = p_series;
  if not found then
    raise exception 'Unbekannte Zeitreihe: %', p_series;
  end if;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '30');

  v_resp := extensions.http_get(v_base || s.filter_id || '/' || s.region || '/index_' || p_resolution || '.json');
  if v_resp.status <> 200 then
    raise exception 'Index-Abruf fehlgeschlagen (HTTP %)', v_resp.status;
  end if;

  for v_ts in
    select t
    from (
      select x::bigint as t
      from jsonb_array_elements_text(v_resp.content::jsonb -> 'timestamps') as x
    ) idx
    where p_since is null or to_timestamp(t / 1000.0) >= p_since - interval '7 days'
    order by t desc
    limit case when p_since is null then p_chunks end
  loop
    v_resp := extensions.http_get(
      v_base || s.filter_id || '/' || s.region || '/'
      || s.filter_id || '_' || s.region || '_' || p_resolution || '_' || v_ts || '.json'
    );
    if v_resp.status <> 200 then
      raise exception 'Paket % fehlgeschlagen (HTTP %)', v_ts, v_resp.status;
    end if;

    -- Upsert: neue Werte einfügen, geänderte aktualisieren, gleiche überspringen
    insert into energy.observations (series_key, resolution, ts, value)
    select p_series, p_resolution, to_timestamp((e ->> 0)::bigint / 1000.0), (e ->> 1)::double precision
    from jsonb_array_elements(v_resp.content::jsonb -> 'series') as e
    where jsonb_typeof(e -> 1) = 'number'
    on conflict (series_key, resolution, ts) do update
      set value = excluded.value, fetched_at = now()
      where energy.observations.value is distinct from excluded.value;

    get diagnostics v_n = row_count;
    v_rows   := v_rows + v_n;
    v_chunks := v_chunks + 1;
  end loop;

  insert into energy.ingest_runs (series_key, resolution, finished_at, chunks, rows_upserted, status)
  values (p_series, p_resolution, now(), v_chunks, v_rows, 'ok');
  return v_rows;

exception when others then
  get stacked diagnostics v_err = message_text;
  insert into energy.ingest_runs (series_key, resolution, finished_at, chunks, rows_upserted, status, error)
  values (p_series, p_resolution, now(), v_chunks, 0, 'error', v_err);
  return -1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Kennzahlen für die Seite /strompreis berechnen und zwischenspeichern
-- ---------------------------------------------------------------------------
create or replace function energy.rebuild_dashboard()
returns void
language plpgsql
set search_path = energy, public
as $$
declare
  v_today   date := (now() at time zone 'Europe/Berlin')::date;
  v_payload jsonb;
begin
  with
  qh as (
    select ts, value, (ts at time zone 'Europe/Berlin') as lt
    from energy.observations
    where series_key = 'price' and resolution = 'quarterhour'
      and ts >= now() - interval '100 days'
  ),
  days as (
    select d.d,
      (select jsonb_agg(jsonb_build_array((extract(epoch from q.ts) * 1000)::bigint, q.value) order by q.ts)
         from qh q where q.lt::date = d.d) as pts,
      (select jsonb_build_object(
                'avg', round(avg(q.value)::numeric, 2),
                'min', min(q.value),
                'max', max(q.value),
                'negative_qh', count(*) filter (where q.value < 0),
                'n', count(*))
         from qh q where q.lt::date = d.d) as stats
    from (values (v_today), (v_today + 1)) as d(d)
  ),
  heat as (
    select jsonb_agg(jsonb_build_array(dow, h, avg_p) order by dow, h) as cells
    from (
      select extract(isodow from lt)::int as dow,
             extract(hour from lt)::int as h,
             round(avg(value)::numeric, 1) as avg_p
      from qh
      where lt::date >= v_today - 90 and lt::date < v_today
      group by 1, 2
    ) x
  ),
  hourly as (
    select ts,
           (ts at time zone 'Europe/Berlin') as lt,
           max(value) filter (where series_key = 'price')         as price,
           max(value) filter (where series_key = 'solar')         as solar,
           max(value) filter (where series_key = 'wind_onshore')  as won,
           max(value) filter (where series_key = 'wind_offshore') as woff,
           max(value) filter (where series_key = 'load')          as load
    from energy.observations
    where resolution = 'hour'
      and ts >= date_trunc('month', now() - interval '36 months')
    group by ts
  ),
  h as (
    select *,
           (solar is not null and won is not null and woff is not null and load is not null) as complete
    from hourly
    where lt::date < v_today and price is not null
  ),
  monthly as (
    select jsonb_agg(jsonb_build_object(
             'month', m, 'avg_price', avg_price, 'neg_hours', neg_hours,
             're_share', re_share, 'solar_share', solar_share, 'hours', hours) order by m) as arr
    from (
      select to_char(date_trunc('month', lt), 'YYYY-MM') as m,
             round(avg(price)::numeric, 2) as avg_price,
             count(*) filter (where price < 0) as neg_hours,
             round((sum(solar + won + woff) filter (where complete)
                    / nullif(sum(load) filter (where complete), 0))::numeric, 4) as re_share,
             round((sum(solar) filter (where complete)
                    / nullif(sum(load) filter (where complete), 0))::numeric, 4) as solar_share,
             count(*) as hours
      from h
      group by 1
    ) x
  ),
  daily_all as (
    select lt::date as d,
           avg(price) as avg_price,
           max(price) - min(price) as spread,
           count(*) filter (where price < 0) as neg_hours,
           sum(solar + won + woff) filter (where complete) / nullif(sum(load) filter (where complete), 0) as re_share
    from h
    where lt::date >= v_today - 365
    group by 1
  ),
  daily as (
    select jsonb_agg(jsonb_build_object(
             'date', d, 'avg_price', round(avg_price::numeric, 2),
             're_share', round(re_share::numeric, 4), 'spread', round(spread::numeric, 2)) order by d) as arr
    from daily_all
    where d >= v_today - 180
  ),
  summary as (
    select jsonb_build_object(
             'days', count(*),
             'avg_price', round(avg(avg_price)::numeric, 2),
             'avg_spread', round(avg(spread)::numeric, 2),
             'neg_hours', sum(neg_hours),
             'days_with_negative', count(*) filter (where neg_hours > 0),
             'corr_price_re', round(corr(avg_price, re_share)::numeric, 3)
           ) as obj
    from daily_all
  )
  select jsonb_build_object(
    'meta', jsonb_build_object(
      'source', 'Bundesnetzagentur | SMARD.de',
      'license', 'CC BY 4.0',
      'last_ingest_at', (select max(finished_at) from energy.ingest_runs where status = 'ok'),
      'errors_24h', (select count(*) from energy.ingest_runs where status = 'error' and started_at > now() - interval '24 hours'),
      'latest_price_at', (select max(ts) from energy.observations where series_key = 'price' and resolution = 'quarterhour'),
      'today', v_today
    ),
    'days', coalesce((select jsonb_agg(jsonb_build_object('date', d, 'points', pts, 'stats', stats) order by d)
                      from days where pts is not null), '[]'::jsonb),
    'heatmap', coalesce((select cells from heat), '[]'::jsonb),
    'monthly', coalesce((select arr from monthly), '[]'::jsonb),
    'daily', coalesce((select arr from daily), '[]'::jsonb),
    'summary_365', (select obj from summary)
  ) into v_payload;

  insert into energy.dashboard_cache (id, payload, built_at)
  values (1, v_payload, now())
  on conflict (id) do update set payload = excluded.payload, built_at = excluded.built_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ein kompletter Durchlauf (wird vom Cron-Job aufgerufen)
-- ---------------------------------------------------------------------------
create or replace function energy.ingest_all(p_chunks integer default 2)
returns jsonb
language plpgsql
set search_path = energy, public
as $$
declare
  k text;
  r text;
  v_result jsonb := '{}'::jsonb;
begin
  for k in select key from energy.series order by key loop
    foreach r in array array['quarterhour', 'hour'] loop
      v_result := v_result || jsonb_build_object(k || ':' || r, energy.ingest(k, r, p_chunks));
    end loop;
  end loop;

  perform energy.rebuild_dashboard();
  delete from energy.ingest_runs where started_at < now() - interval '60 days';
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Einzige öffentliche Schnittstelle für die Website
-- ---------------------------------------------------------------------------
create or replace function public.energy_dashboard()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select c.payload || jsonb_build_object('built_at', c.built_at)
  from energy.dashboard_cache c
  where c.id = 1;
$$;

revoke all on all tables in schema energy from public, anon, authenticated;
revoke all on function energy.ingest(text, text, integer, timestamptz) from public, anon, authenticated;
revoke all on function energy.rebuild_dashboard() from public, anon, authenticated;
revoke all on function energy.ingest_all(integer) from public, anon, authenticated;
revoke all on function public.energy_dashboard() from public;
grant execute on function public.energy_dashboard() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Zeitplan: alle 3 Stunden, Minute 10
-- ---------------------------------------------------------------------------
select cron.schedule('energy-ingest', '10 */3 * * *', $job$select energy.ingest_all(2)$job$);

-- Einmaliges Nachladen der Historie (so wurde der Bestand aufgebaut):
-- select energy.ingest(k, 'quarterhour', null, '2025-10-01+02')
--   from unnest(array['price','solar','wind_onshore','wind_offshore','load','residual_load']) k;
-- select energy.ingest(k, 'hour', null, '2023-01-01+01')
--   from unnest(array['price','solar','wind_onshore','wind_offshore','load','residual_load']) k;
