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

revoke all on all functions in schema racing from public, anon, authenticated;
