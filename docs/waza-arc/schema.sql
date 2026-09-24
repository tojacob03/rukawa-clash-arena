-- Waza Arc: Entwurf für das Schema "arc" im Supabase-Projekt "Rukawa Portfolio".
--
-- NOCH NICHT ANGEWENDET. Voraussetzung ist KONZEPT.md Abschnitt 8.3: Bevor
-- sich fremde Personen registrieren können, müssen alle bestehenden Regeln,
-- die "angemeldet" mit "Admin" gleichsetzen, auf is_admin(auth.uid())
-- umgestellt sein.
--
-- Die Tabellen übernehmen die Datenform der App (src/arc/core/types.ts), damit
-- ein späterer Sync die lokalen Daten 1:1 hochladen kann. Nur angemeldete
-- Nutzer sehen etwas, und jeder nur seine eigenen Zeilen. Danach "arc" in den
-- API-Einstellungen als Exposed Schema freischalten.

create schema if not exists arc;
revoke all on schema arc from public, anon;
grant usage on schema arc to authenticated;

create table arc.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  name         text not null check (length(name) between 1 and 32),
  belt         text not null check (belt in ('weiss', 'blau', 'lila', 'braun', 'schwarz')),
  stripes      smallint not null default 0 check (stripes between 0 and 4),
  start_belt   text not null check (start_belt in ('weiss', 'blau', 'lila', 'braun', 'schwarz')),
  start_stripes smallint not null default 0 check (start_stripes between 0 and 4),
  weekly_goal  smallint not null default 2 check (weekly_goal between 1 and 7),
  -- Steckbrief, alles optional
  countries    text[] not null default '{}' check (cardinality(countries) <= 4),
  birth_year   smallint check (birth_year between 1900 and 2100),
  weight_kg    numeric(4, 1) check (weight_kg between 30 and 200),
  training_since text check (training_since ~ '^[0-9]{4}-[0-9]{2}$'),
  cls          text check (cls in ('netzweber', 'druckwalze', 'anker', 'schatten', 'jaeger', 'ferse', 'sturm', 'festung', 'wandler')),
  created_at   date not null default current_date
);

create table arc.onboarding (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  date     date not null,
  known    text[] not null default '{}',
  -- Selbsteinschätzung: { technique_id: 3 | 4 }, 3 = klappt im Roll, 4 = Stärke (höchstens 5)
  claims   jsonb not null default '{}' check (jsonb_typeof(claims) = 'object')
);

-- Aussehen und Ausrüstung. Das Inventar wird nicht gespeichert, es folgt aus den Daten.
create table arc.characters (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  look     jsonb not null default '{}' check (jsonb_typeof(look) = 'object'),
  equipped jsonb not null default '{}' check (jsonb_typeof(equipped) = 'object'),
  mode     text not null default 'gi' check (mode in ('gi', 'nogi')),
  seen     text[] not null default '{}'
);

create table arc.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  format      text not null check (format in ('class', 'open')),
  attire      text not null check (attire in ('gi', 'nogi')),
  taught      text,
  -- [{ belt, size, sf, sa, c }, ...], höchstens 12 Rolls
  rolls       jsonb not null default '[]' check (jsonb_typeof(rolls) = 'array' and jsonb_array_length(rolls) <= 12),
  -- { node, kind, xp, att, succ, done } oder null
  quest       jsonb check (quest is null or jsonb_typeof(quest) = 'object'),
  worked      text,
  stuck       text,
  -- XP vom Talisman, beim Speichern festgeschrieben
  bonus       smallint not null default 0 check (bonus between 0 and 500),
  created_at  timestamptz not null default now()
);
create index sessions_user_date on arc.sessions (user_id, date);

create table arc.pauses (
  user_id  uuid not null references auth.users (id) on delete cascade,
  week     integer not null,
  primary key (user_id, week)
);

create table arc.promotions (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users (id) on delete cascade,
  date     date not null,
  belt     text not null check (belt in ('weiss', 'blau', 'lila', 'braun', 'schwarz')),
  stripes  smallint not null check (stripes between 0 and 4)
);

-- Jede Tabelle: Row Level Security, nur eigene Zeilen.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'onboarding', 'characters', 'sessions', 'pauses', 'promotions'] loop
    execute format('alter table arc.%I enable row level security', t);
    execute format('revoke all on arc.%I from public, anon', t);
    execute format('grant select, insert, update, delete on arc.%I to authenticated', t);
    execute format(
      'create policy own_rows on arc.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
end $$;
