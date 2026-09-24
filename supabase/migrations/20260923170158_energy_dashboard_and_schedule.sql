-- Baut alle Kennzahlen für die Seite /strompreis und legt sie in energy.dashboard_cache ab.
-- Zeiten werden in deutscher Ortszeit (Europe/Berlin) ausgewertet.
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
  -- Viertelstundenpreise der letzten ~100 Tage (inkl. morgen, sobald veröffentlicht)
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
  -- Durchschnittspreis nach Wochentag und Stunde, letzte 90 abgeschlossene Tage
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
  -- Stundenwerte aller Zeitreihen nebeneinander, nur abgeschlossene Tage
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

-- Ein kompletter Durchlauf: alle Zeitreihen in beiden Auflösungen holen,
-- danach Dashboard neu bauen und altes Protokoll aufräumen.
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

-- Die einzige öffentliche Schnittstelle: liefert das fertige Dashboard als JSON.
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

revoke all on function energy.rebuild_dashboard() from public, anon, authenticated;
revoke all on function energy.ingest_all(integer) from public, anon, authenticated;
revoke all on function public.energy_dashboard() from public;
grant execute on function public.energy_dashboard() to anon, authenticated;

comment on function public.energy_dashboard() is
  'Strompreis-Kompass: fertig berechnete Kennzahlen aus SMARD-Daten (Bundesnetzagentur, CC BY 4.0).';

-- Alle 3 Stunden neue Daten holen (Day-Ahead-Preise für morgen erscheinen am frühen Nachmittag).
select cron.schedule('energy-ingest', '10 */3 * * *', $job$select energy.ingest_all(2)$job$);
