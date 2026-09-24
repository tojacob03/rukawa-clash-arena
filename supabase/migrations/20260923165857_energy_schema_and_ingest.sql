-- Strompreis-Kompass: Strommarktdaten der Bundesnetzagentur (SMARD, CC BY 4.0)
-- Alles liegt im Schema "energy" (nicht über die API erreichbar).
-- Nach außen gibt es nur die Funktion public.energy_dashboard().

-- 1) Welche Zeitreihen wir sammeln
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

-- 2) Die Messwerte (ein Wert pro Zeitreihe, Auflösung und Zeitpunkt)
create table if not exists energy.observations (
  series_key  text        not null references energy.series(key),
  resolution  text        not null check (resolution in ('quarterhour', 'hour')),
  ts          timestamptz not null,
  value       double precision not null,
  fetched_at  timestamptz not null default now(),
  primary key (series_key, resolution, ts)
);
create index if not exists observations_res_ts_idx on energy.observations (resolution, ts);

-- 3) Protokoll jedes Abrufs (für Überwachung und Fehlersuche)
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

-- 4) Fertig berechnetes Dashboard (wird nach jedem Abruf neu gebaut)
create table if not exists energy.dashboard_cache (
  id        integer primary key default 1 check (id = 1),
  payload   jsonb not null,
  built_at  timestamptz not null default now()
);

-- Holt Daten für eine Zeitreihe von SMARD.
--   p_chunks: wie viele der neuesten Wochen-Pakete (für den laufenden Betrieb)
--   p_since:  alternativ alles ab diesem Zeitpunkt (für das Nachladen der Historie)
-- Gibt die Zahl der neuen/geänderten Werte zurück, -1 bei Fehler.
create or replace function energy.ingest(
  p_series text,
  p_resolution text,
  p_chunks integer default 2,
  p_since timestamptz default null
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

revoke all on all tables in schema energy from public, anon, authenticated;
revoke all on function energy.ingest(text, text, integer, timestamptz) from public, anon, authenticated;
