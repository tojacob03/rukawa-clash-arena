-- Off the clock: Sammlung (aus Parfumo, Stand 24.09.2026) und Wetter pro Tag.
-- Beantwortet die Frage aus dem Seitentext: Hängt der Duft am Wetter?

-- 1) Konzentration (Eau de Parfum, Perfume Oil, ...) - bestimmt auf der
--    Seite die Flakonform im Regal.
alter table personal.fragrances
  add column if not exists concentration text check (concentration is null or length(concentration) <= 40);

-- 2) Die Sammlung. Vorhandene Einträge (gleicher Name) bleiben unverändert.
insert into personal.fragrances (name, house, concentration) values
  ('Muschio Bianco', 'Acca Kappa', 'Eau de Cologne'),
  ('Boussa', 'ADN Paris', 'Extrait de Parfum'),
  ('Bakhour', 'Al Rehab', 'Perfume Oil'),
  ('Balkis', 'Al Rehab', 'Perfume Oil'),
  ('Classic', 'Al Rehab', 'Perfume Oil'),
  ('Dalal', 'Al Rehab', 'Eau de Parfum'),
  ('Dalal (Perfume Oil)', 'Al Rehab', 'Perfume Oil'),
  ('Diamond', 'Al Rehab', 'Perfume Oil'),
  ('Golden Sand', 'Al Rehab', 'Perfume Oil'),
  ('Inspiration', 'Al Rehab', 'Perfume Oil'),
  ('Nebras', 'Al Rehab', 'Perfume Oil'),
  ('Oud & Rose', 'Al Rehab', 'Concentrated Perfume'),
  ('Soft', 'Al Rehab', 'Perfume Oil'),
  ('Sultan', 'Al Rehab', 'Perfume Oil'),
  ('Sultan Al Oud', 'Al Rehab', 'Perfume Oil'),
  ('Amber Sogara', 'Amouage', null),
  ('Interlude 53', 'Amouage', null),
  ('Oud Fazza', 'Ard Al Zaafaran', 'Eau de Parfum'),
  ('Satwa', 'Ard Al Zaafaran', null),
  ('Club de Nuit Intense Man', 'Armaf', 'Eau de Toilette'),
  ('Wanted by Night', 'Azzaro', null),
  ('Jump Up and Kiss Me Hedonistic', 'Clive Christian', null),
  ('The One', 'Dolce & Gabbana', 'Eau de Parfum'),
  ('Portrait of a Lady', 'Frédéric Malle', 'Eau de Parfum'),
  ('Amber of Yemen', 'El Nabil', null),
  ('Fruit d''Orient', 'El Nabil', null),
  ('Musc Bella', 'El Nabil', 'Extrait de Parfum'),
  ('Musc Blanc', 'El Nabil', 'Extrait de Parfum'),
  ('Musc Imran', 'El Nabil', 'Extrait de Parfum'),
  ('Musc Ismael', 'El Nabil', null),
  ('Musc Makkah', 'El Nabil', 'Extrait de Parfum'),
  ('Musc Velvet', 'El Nabil', 'Extrait de Parfum'),
  ('Oud Orient', 'El Nabil', null),
  ('Royal Gold', 'El Nabil', 'Extrait de Parfum'),
  ('Acqua di Giò Profondo', 'Giorgio Armani', 'Eau de Parfum'),
  ('Stronger with You Intensely', 'Emporio Armani', null),
  ('Terre d''Hermès', 'Hermès', 'Eau de Toilette'),
  ('Le Mâle Le Parfum', 'Jean Paul Gaultier', null),
  ('Omar', 'Karamat Collection', null),
  ('Baccarat Rouge 540', 'Maison Francis Kurkdjian', 'Eau de Parfum'),
  ('masculin Pluriel', 'Maison Francis Kurkdjian', null),
  ('Beach Walk', 'Maison Margiela', null),
  ('By the Fireplace', 'Maison Margiela', null),
  ('Jazz Club', 'Maison Margiela', null),
  ('Springtime in a Park', 'Maison Margiela', null),
  ('Whispers in the Library', 'Maison Margiela', null),
  ('Toy Boy', 'Moschino', null),
  ('Nefs', 'Nishane', null),
  ('Layton', 'Parfums de Marly', null),
  ('Amaani', 'Swiss Arabian', null),
  ('Hayaa', 'Swiss Arabian', null),
  ('Au Coeur du Désert', 'Tauer Perfumes', null),
  ('Arabesque', 'The Merchant of Venice', null),
  ('Bitter Peach', 'Tom Ford', 'Eau de Parfum'),
  ('Lost Cherry', 'Tom Ford', 'Eau de Parfum'),
  ('Oud Wood', 'Tom Ford', 'Eau de Parfum'),
  ('Rose Prick', 'Tom Ford', 'Eau de Parfum'),
  ('Tuscan Leather', 'Tom Ford', 'Eau de Parfum'),
  ('Valentino Uomo Intense', 'Valentino', null),
  ('Eros', 'Versace', 'Eau de Toilette'),
  ('The Dreamer', 'Versace', 'Eau de Toilette'),
  ('Dylan Blue', 'Versace', 'Eau de Toilette'),
  ('Spicebomb Extreme', 'Viktor & Rolf', null),
  ('Erba Pura', 'Xerjoff', null),
  ('Naxos', 'Xerjoff', null),
  ('Y', 'Yves Saint Laurent', 'Eau de Parfum'),
  ('Sunrise on the Red Sand Dunes', 'Zara', 'Eau de Parfum'),
  ('Sharaf Blend', 'Zimaya', null)
on conflict ((lower(name))) do nothing;

-- Portrait of a Lady war schon per Handy eingetragen: Haus vereinheitlichen,
-- Konzentration ergänzen.
update personal.fragrances
set house = 'Frédéric Malle', concentration = 'Eau de Parfum'
where lower(name) = 'portrait of a lady';

-- 3) Wetter in Oldenburg, ein Wert pro Tag (Open-Meteo, frei, ohne Schlüssel)
create table if not exists personal.weather_daily (
  day          date primary key,
  temp_mean    numeric(4,1),
  temp_min     numeric(4,1),
  temp_max     numeric(4,1),
  precip_mm    numeric(5,1),
  weather_code smallint,
  fetched_at   timestamptz not null default now()
);

create table if not exists personal.weather_runs (
  id            bigserial primary key,
  ran_at        timestamptz not null default now(),
  rows_upserted integer,
  status        text,
  error         text
);

-- Holt die letzten p_past_days Tage plus heute (Vorhersage, wird beim
-- nächsten Lauf durch die gemessenen Werte ersetzt). -1 bei Fehler.
create or replace function personal.fetch_weather(p_past_days integer default 7)
returns integer
language plpgsql
set search_path = personal, extensions, public
as $$
declare
  v_resp  extensions.http_response;
  v_daily jsonb;
  v_rows  integer := 0;
  v_err   text;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '30');
  v_resp := extensions.http_get(format(
    'https://api.open-meteo.com/v1/forecast?latitude=53.1435&longitude=8.2146'
    '&daily=temperature_2m_mean,temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code'
    '&timezone=Europe%%2FBerlin&past_days=%s&forecast_days=1',
    least(greatest(coalesce(p_past_days, 7), 0), 92)
  ));
  if v_resp.status <> 200 then
    raise exception 'Open-Meteo antwortet mit HTTP %', v_resp.status;
  end if;

  v_daily := v_resp.content::jsonb -> 'daily';
  insert into personal.weather_daily (day, temp_mean, temp_min, temp_max, precip_mm, weather_code, fetched_at)
  select (v_daily -> 'time' ->> i)::date,
         (v_daily -> 'temperature_2m_mean' ->> i)::numeric,
         (v_daily -> 'temperature_2m_min' ->> i)::numeric,
         (v_daily -> 'temperature_2m_max' ->> i)::numeric,
         (v_daily -> 'precipitation_sum' ->> i)::numeric,
         (v_daily -> 'weather_code' ->> i)::smallint,
         now()
  from generate_series(0, jsonb_array_length(v_daily -> 'time') - 1) as i
  where v_daily -> 'temperature_2m_mean' ->> i is not null
  on conflict (day) do update
    set temp_mean = excluded.temp_mean, temp_min = excluded.temp_min, temp_max = excluded.temp_max,
        precip_mm = excluded.precip_mm, weather_code = excluded.weather_code, fetched_at = now();
  get diagnostics v_rows = row_count;

  delete from personal.weather_runs where ran_at < now() - interval '90 days';
  insert into personal.weather_runs (rows_upserted, status) values (v_rows, 'ok');
  return v_rows;

exception when others then
  get stacked diagnostics v_err = message_text;
  insert into personal.weather_runs (rows_upserted, status, error) values (0, 'error', v_err);
  return -1;
end;
$$;

-- 4) Öffentliche Lesefunktion: zusätzlich Konzentration, zuletzt getragen
--    und das Wetter an jedem eingetragenen Tag.
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
    select f.id, f.name, f.house, f.concentration,
           (select count(*) from personal.fragrance_log l where l.fragrance_id = f.id) as worn_total,
           (select count(*) from recent r where r.fragrance_id = f.id) as worn_recent,
           (select max(l.worn_on) from personal.fragrance_log l where l.fragrance_id = f.id) as last_worn
    from personal.fragrances f
  ),
  worn_weather as (
    select l.worn_on, l.fragrance_id, w.temp_mean, w.precip_mm
    from personal.fragrance_log l
    join personal.weather_daily w on w.day = l.worn_on
    where w.temp_mean is not null
  )
  select jsonb_build_object(
    'today', (select d from today),
    'latest', (select jsonb_build_object('worn_on', worn_on, 'id', id, 'name', name, 'house', house) from latest),
    'recent', coalesce((select jsonb_agg(jsonb_build_array(worn_on, fragrance_id) order by worn_on) from recent), '[]'::jsonb),
    'collection', coalesce((select jsonb_agg(jsonb_build_object(
                      'id', id, 'name', name, 'house', house, 'concentration', concentration,
                      'worn_total', worn_total, 'worn_recent', worn_recent, 'last_worn', last_worn)
                    order by worn_recent desc, worn_total desc, name) from counts), '[]'::jsonb),
    'days_logged', (select count(*) from personal.fragrance_log),
    'weather', coalesce((select jsonb_agg(jsonb_build_array(worn_on, fragrance_id, temp_mean, precip_mm) order by worn_on)
                         from worn_weather), '[]'::jsonb),
    'weather_place', 'Oldenburg'
  );
$$;

revoke all on all tables in schema personal from public, anon, authenticated;
revoke all on all sequences in schema personal from public, anon, authenticated;
revoke all on function personal.fetch_weather(integer) from public, anon, authenticated;
revoke all on function public.fragrance_status() from public;
grant execute on function public.fragrance_status() to anon, authenticated;

-- 5) Zweimal täglich (06:20 und 18:20 deutscher Sommerzeit) und einmal
--    rückwirkend für die letzten drei Monate.
select cron.schedule('fragrance-weather', '20 4,16 * * *', $job$select personal.fetch_weather(7)$job$);
select personal.fetch_weather(92);
