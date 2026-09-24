-- Strompreis-Kompass: die Abfragen hinter der Case Study
-- "Wann Strom am günstigsten ist" (src/content/case-studies/strompreis-kompass.md)
--
-- Alle Abfragen sind reine SELECTs auf energy.observations (siehe schema.sql).
-- Die Zeiträume sind fest eingetragen, damit die Zahlen reproduzierbar bleiben.
-- Die Ergebnisse unter jeder Abfrage sind vom 24.09.2026. SMARD korrigiert
-- einzelne Werte gelegentlich nachträglich, dann können Nachkommastellen abweichen.
--
-- Uhrzeiten immer in deutscher Ortszeit auswerten: ts at time zone 'Europe/Berlin'.
-- Sonst sind bei Sommerzeit alle Stunden um eine verschoben.
-- Preise sind Großhandelspreise (Day-Ahead, DE-LU) in €/MWh, ohne Steuern,
-- Umlagen und Netzentgelte. 10 €/MWh = 1 ct/kWh.


-- ---------------------------------------------------------------------------
-- 1) Durchschnittspreis nach Uhrzeit: Jahr, Sommer und Winter
-- ---------------------------------------------------------------------------
with p as (
  select ts at time zone 'Europe/Berlin' as lt, value as price
  from energy.observations
  where series_key = 'price' and resolution = 'hour'
)
select extract(hour from lt)::int as stunde,
       round(avg(price) filter (where lt >= '2025-09-01' and lt < '2026-09-01')::numeric, 1) as jahr_sep25_aug26,
       round(avg(price) filter (where lt >= '2026-06-01' and lt < '2026-09-01')::numeric, 1) as sommer_2026,
       round(avg(price) filter (where lt >= '2025-12-01' and lt < '2026-03-01')::numeric, 1) as winter_25_26
from p
group by 1
order by 1;

-- Ergebnis (Auszug, €/MWh):
--   stunde | jahr_sep25_aug26 | sommer_2026 | winter_25_26
--        3 |             93.4 |       126.1 |         78.5   <- Winter: günstigste Stunde
--       13 |             47.0 |        28.4 |         95.7   <- Jahr und Sommer: günstigste Stunde
--       17 |            110.3 |        94.3 |        129.7   <- Winter: teuerste Stunde
--       19 |            150.7 |       176.3 |        116.5   <- Jahr: teuerste Stunde
--       20 |            146.6 |       203.4 |        105.4   <- Sommer: teuerste Stunde
-- 19 Uhr gegenüber 13 Uhr im Jahresmittel: 150.7 / 47.0 = 3.2-mal so teuer.


-- ---------------------------------------------------------------------------
-- 2) Das günstigste 2-Stunden-Fenster jedes Tages und das Rechenbeispiel
--    "10 kWh pro Tag nicht um 18-20 Uhr, sondern im günstigsten Fenster"
-- ---------------------------------------------------------------------------
with h as (
  select ts at time zone 'Europe/Berlin' as lt, value as price
  from energy.observations
  where series_key = 'price' and resolution = 'hour'
    and ts >= '2025-08-31 00:00+00' and ts < '2026-09-02 00:00+00'
),
d as (
  -- Durchschnitt aus dieser und der nächsten Stunde = ein 2-Stunden-Fenster.
  -- n = 2 stellt sicher, dass das Fenster nicht über Mitternacht hinausläuft.
  select lt::date as tag, lt, price,
         avg(price) over w as fenster_2h,
         count(*)   over w as n
  from h
  where lt >= '2025-09-01' and lt < '2026-09-01'
  window w as (partition by lt::date order by lt rows between current row and 1 following)
),
tage as (
  select tag,
         avg(price) filter (where extract(hour from lt) in (18, 19)) as abend,
         min(fenster_2h) filter (where n = 2) as guenstigstes_fenster,
         (array_agg(extract(hour from lt)::int order by fenster_2h) filter (where n = 2))[1] as fenster_start
  from d
  group by tag
)
select count(*) as tage,
       round(avg(abend)::numeric, 1) as abend_18_20,
       round(avg(guenstigstes_fenster)::numeric, 1) as guenstigstes_2h_fenster,
       round(avg(abend - guenstigstes_fenster)::numeric, 1) as differenz_eur_mwh,
       round(sum((abend - guenstigstes_fenster) * 10 / 1000)::numeric, 0) as ersparnis_eur_bei_10_kwh_pro_tag,
       count(*) filter (where fenster_start between 9 and 15) as tage_fenster_mittags,
       count(*) filter (where fenster_start between 0 and 5 or fenster_start >= 22) as tage_fenster_nachts,
       count(*) filter (where extract(month from tag) in (4,5,6,7,8,9) and fenster_start between 9 and 15) as mittags_apr_sep,
       count(*) filter (where extract(month from tag) in (4,5,6,7,8,9)) as tage_apr_sep,
       count(*) filter (where extract(month from tag) in (11,12,1,2) and (fenster_start between 0 and 5 or fenster_start >= 22)) as nachts_nov_feb,
       count(*) filter (where extract(month from tag) in (11,12,1,2)) as tage_nov_feb
from tage;

-- Ergebnis:
--   tage 365 | abend_18_20 142.3 | guenstigstes_2h_fenster 38.2 | differenz_eur_mwh 104.0
--   ersparnis_eur_bei_10_kwh_pro_tag 380
--   tage_fenster_mittags 241 | tage_fenster_nachts 120
--   mittags_apr_sep 181 von 183 | nachts_nov_feb 100 von 120
-- 104.0 €/MWh = 10.4 ct/kWh; 10 kWh x 365 Tage x 10.4 ct = rund 380 € im Jahr.


-- ---------------------------------------------------------------------------
-- 3) Wind- und Solaranteil am Verbrauch, Werktag gegen Wochenende
-- ---------------------------------------------------------------------------
with h as (
  -- Zeitreihen nebeneinander: eine Zeile pro Stunde
  select ts at time zone 'Europe/Berlin' as lt,
         max(value) filter (where series_key = 'price')         as price,
         max(value) filter (where series_key = 'solar')         as solar,
         max(value) filter (where series_key = 'wind_onshore')  as won,
         max(value) filter (where series_key = 'wind_offshore') as woff,
         max(value) filter (where series_key = 'load')          as load
  from energy.observations
  where resolution = 'hour'
    and ts >= '2025-08-31 00:00+00' and ts < '2026-09-02 00:00+00'
  group by ts
),
t as (
  select lt::date as tag,
         avg(price) as preis,
         sum(solar + won + woff) / nullif(sum(load), 0) as ee_anteil,
         extract(isodow from lt::date) >= 6 as wochenende
  from h
  where lt >= '2025-09-01' and lt < '2026-09-01'
    and price is not null and solar is not null and won is not null and woff is not null and load is not null
  group by 1
)
select
  count(*) as tage,
  round(avg(preis) filter (where not wochenende)::numeric, 1) as werktag,
  round(avg(preis) filter (where wochenende)::numeric, 1) as wochenende,
  round(corr(preis, ee_anteil)::numeric, 3) as korrelation,
  round(avg(preis) filter (where ee_anteil < 0.3)::numeric, 1) as preis_ee_unter_30,
  count(*) filter (where ee_anteil < 0.3) as tage_ee_unter_30,
  round(avg(preis) filter (where ee_anteil >= 0.3 and ee_anteil < 0.5)::numeric, 1) as preis_ee_30_50,
  count(*) filter (where ee_anteil >= 0.3 and ee_anteil < 0.5) as tage_ee_30_50,
  round(avg(preis) filter (where ee_anteil >= 0.5 and ee_anteil < 0.7)::numeric, 1) as preis_ee_50_70,
  count(*) filter (where ee_anteil >= 0.5 and ee_anteil < 0.7) as tage_ee_50_70,
  round(avg(preis) filter (where ee_anteil >= 0.7)::numeric, 1) as preis_ee_ab_70,
  count(*) filter (where ee_anteil >= 0.7) as tage_ee_ab_70
from t;

-- Ergebnis:
--   tage 365 | werktag 106.9 | wochenende 79.1 (26 % günstiger) | korrelation -0.714
--   Wind- und Solaranteil unter 30 %:  127.8 €/MWh an  58 Tagen
--                          30-50 %:    112.0 €/MWh an 135 Tagen
--                          50-70 %:     90.1 €/MWh an 128 Tagen
--                          ab 70 %:     47.2 €/MWh an  44 Tagen (63 % günstiger als unter 30 %)


-- ---------------------------------------------------------------------------
-- 4) Negative Preise und Jahresdurchschnitt pro Jahr
--    Jan-Aug separat, damit 2026 (Daten bis September) fair vergleichbar ist.
-- ---------------------------------------------------------------------------
with p as (
  select ts at time zone 'Europe/Berlin' as lt, value as price
  from energy.observations
  where series_key = 'price' and resolution = 'hour'
)
select extract(year from lt)::int as jahr,
       count(*) as stunden,
       round(avg(price)::numeric, 2) as durchschnitt,
       count(*) filter (where price < 0) as negative_stunden_gesamt,
       count(*) filter (where price < 0 and extract(month from lt) <= 8) as negative_stunden_jan_aug,
       count(distinct lt::date) filter (where price < 0 and extract(month from lt) <= 8) as tage_mit_negativ_jan_aug,
       round(avg(price) filter (where extract(month from lt) <= 8)::numeric, 2) as durchschnitt_jan_aug,
       min(price) as min_preis,
       max(price) as max_preis
from p
where lt >= '2023-01-01'
group by 1
order by 1;

-- Ergebnis:
--   jahr | negative_stunden_gesamt | negative_stunden_jan_aug | tage_mit_negativ_jan_aug | durchschnitt
--   2023 |                     301 |                      166 |                       27 |        95.18
--   2024 |                     457 |                      373 |                       68 |        78.51
--   2025 |                     573 |                      465 |                       85 |        89.32
--   2026 |          (unvollständig) |                      424 |                       80 |  (unvollst.)


-- ---------------------------------------------------------------------------
-- 5) Extremwerte seit dem Start des Viertelstundenhandels (1. Oktober 2025)
-- ---------------------------------------------------------------------------
(select 'teuerste' as art, ts at time zone 'Europe/Berlin' as zeit, value
 from energy.observations
 where series_key = 'price' and resolution = 'quarterhour' and ts >= '2025-10-01 00:00+02' and ts < '2026-09-23 00:00+02'
 order by value desc limit 3)
union all
(select 'guenstigste', ts at time zone 'Europe/Berlin', value
 from energy.observations
 where series_key = 'price' and resolution = 'quarterhour' and ts >= '2025-10-01 00:00+02' and ts < '2026-09-23 00:00+02'
 order by value asc limit 3);

-- Ergebnis:
--   teuerste    | 2026-06-24 20:45 |  747.10
--   teuerste    | 2026-09-14 19:45 |  740.01
--   teuerste    | 2026-09-14 20:00 |  704.41
--   guenstigste | 2026-05-01 13:15 | -499.99   (und weitere Viertelstunden am selben Tag, siehe 6)


-- ---------------------------------------------------------------------------
-- 6) Der 1. Mai 2026 im Detail
-- ---------------------------------------------------------------------------
with q as (
  select ts at time zone 'Europe/Berlin' as lt,
         max(value) filter (where series_key = 'price') as price,
         max(value) filter (where series_key = 'solar') as solar,
         max(value) filter (where series_key = 'wind_onshore') + max(value) filter (where series_key = 'wind_offshore') as wind,
         max(value) filter (where series_key = 'load') as load
  from energy.observations
  where resolution = 'quarterhour'
    and ts >= '2026-05-01 00:00+02' and ts < '2026-05-02 00:00+02'
  group by ts
)
select
  (select count(*) from q where price <= -499) as viertelstunden_minus_499,
  (select min(lt)::time from q where price <= -499) as von,
  (select max(lt)::time from q where price <= -499) as bis,
  (select count(*) from q where price < 0) as viertelstunden_negativ,
  (select round((sum(solar + wind) / nullif(sum(load), 0))::numeric, 2) from q where extract(hour from lt) between 12 and 14) as ee_anteil_mittags,
  (select round(avg(price)::numeric, 1) from q) as tagesdurchschnitt;

-- Ergebnis:
--   6 Viertelstunden bei -499.99 €/MWh, Beginn 13:15 bis Beginn 14:30 (also bis 14:45 Uhr)
--   32 Viertelstunden (8 Stunden) mit negativem Preis
--   Wind und Solar zwischen 12 und 15 Uhr: 120 % des Verbrauchs
--   Tagesdurchschnitt: -2.1 €/MWh
