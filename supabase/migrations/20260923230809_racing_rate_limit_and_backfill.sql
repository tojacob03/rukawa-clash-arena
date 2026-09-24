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

revoke all on all functions in schema racing from public, anon, authenticated;

select cron.schedule('racing-backfill', '*/2 * * * *', $job$select racing.backfill(4)$job$);
