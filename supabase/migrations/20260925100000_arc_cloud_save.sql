-- Waza Arc: cloud save for signed-in players (docs/waza-arc/KONZEPT.md 8.2).
--
-- One table of records per player: the root record (profile, character,
-- onboarding, pauses, UI state) and one record per session, competition,
-- other-sport session and promotion. The app works offline first and syncs in
-- both directions: every write gets a new revision number from a sequence,
-- and a device pulls everything above the last revision it has seen.
-- Deletions stay as tombstones so the other devices learn about them.
--
-- The schema "arc" is not exposed to the Data API. The app only talks to
-- three functions in public:
--   arc_pull(since, limit)  rows above a revision, oldest first
--   arc_push(rows)          upsert up to 500 records
--   arc_delete_account()    delete the account and all its records
-- arc_pull and arc_push run with the caller's rights, so the row level
-- security below applies on top of their own checks. Anonymous (guest)
-- accounts use the same path; they are signed in as "authenticated" too.

create schema if not exists arc;
revoke all on schema arc from public;
grant usage on schema arc to authenticated;

create sequence if not exists arc.records_rev as bigint;
revoke all on sequence arc.records_rev from public, anon, authenticated;

create table if not exists arc.records (
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('root', 'session', 'comp', 'cross', 'promo')),
  id         text not null check (id ~ '^[A-Za-z0-9._:-]{1,80}$'),
  data       jsonb,
  deleted    boolean not null default false,
  rev        bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id),
  constraint records_tombstone check (deleted = (data is null)),
  constraint records_size check (data is null or octet_length(data::text) <= 32768)
);
create index if not exists records_user_rev on arc.records (user_id, rev);

-- Second factor: once a player has a verified factor (authenticator app),
-- their data needs a session that passed it (aal2).
create or replace function arc.mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      );
$$;
revoke all on function arc.mfa_satisfied() from public, anon;
grant execute on function arc.mfa_satisfied() to authenticated;

-- Revision and timestamp come from the database, never from the client. Key
-- columns cannot be changed by an update.
create or replace function arc.records_stamp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.kind := old.kind;
    new.id := old.id;
  end if;
  new.rev := nextval('arc.records_rev');
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function arc.records_stamp() from public, anon, authenticated;
drop trigger if exists records_stamp on arc.records;
create trigger records_stamp
  before insert or update on arc.records
  for each row execute function arc.records_stamp();

-- Quota: 5000 records per player, checked once per statement. That is about
-- 30 years of three trainings a week.
create or replace function arc.records_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from (select distinct i.user_id from inserted i) u
    where (select count(*) from arc.records r where r.user_id = u.user_id) > 5000
  ) then
    raise exception 'arc_quota_exceeded' using errcode = '54000';
  end if;
  return null;
end;
$$;
revoke all on function arc.records_quota() from public, anon, authenticated;
drop trigger if exists records_quota on arc.records;
create trigger records_quota
  after insert on arc.records
  referencing new table as inserted
  for each statement execute function arc.records_quota();

alter table arc.records enable row level security;
drop policy if exists records_own_select on arc.records;
drop policy if exists records_own_insert on arc.records;
drop policy if exists records_own_update on arc.records;
create policy records_own_select on arc.records
  for select to authenticated
  using (user_id = (select auth.uid()) and (select arc.mfa_satisfied()));
create policy records_own_insert on arc.records
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select arc.mfa_satisfied()));
create policy records_own_update on arc.records
  for update to authenticated
  using (user_id = (select auth.uid()) and (select arc.mfa_satisfied()))
  with check (user_id = (select auth.uid()));
-- No delete policy: records become tombstones. Deleting the account removes
-- them through the foreign key.
revoke all on arc.records from public, anon, authenticated;
grant select, insert, update on arc.records to authenticated;

-- Rows above a revision, oldest first.
create or replace function public.arc_pull(p_since bigint default 0, p_limit integer default 1000)
returns table (kind text, id text, data jsonb, deleted boolean, rev bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  if auth.uid() is null then
    raise exception 'arc_not_signed_in' using errcode = '28000';
  end if;
  if not arc.mfa_satisfied() then
    raise exception 'arc_mfa_required' using errcode = '42501';
  end if;
  return query
    select r.kind, r.id, r.data, r.deleted, r.rev
    from arc.records r
    where r.user_id = auth.uid() and r.rev > coalesce(p_since, 0)
    order by r.rev
    limit least(greatest(coalesce(p_limit, 1000), 1), 2000);
end;
$$;
revoke all on function public.arc_pull(bigint, integer) from public, anon;
grant execute on function public.arc_pull(bigint, integer) to authenticated;

-- Upsert up to 500 records: [{ kind, id, data, deleted }, ...].
create or replace function public.arc_push(p_rows jsonb)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  if auth.uid() is null then
    raise exception 'arc_not_signed_in' using errcode = '28000';
  end if;
  if not arc.mfa_satisfied() then
    raise exception 'arc_mfa_required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) > 500 then
    raise exception 'arc_bad_batch' using errcode = '22023';
  end if;
  insert into arc.records as r (user_id, kind, id, data, deleted)
  select auth.uid(),
         x.kind,
         x.id,
         case when coalesce(x.deleted, false) then null else x.data end,
         coalesce(x.deleted, false)
  from jsonb_to_recordset(p_rows) as x(kind text, id text, data jsonb, deleted boolean)
  on conflict (user_id, kind, id) do update
    set data = excluded.data, deleted = excluded.deleted;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.arc_push(jsonb) from public, anon;
grant execute on function public.arc_push(jsonb) to authenticated;

-- Delete the signed-in account with all its records (GDPR Art. 17). Portfolio
-- admins use the same project and are never deleted from here.
create or replace function public.arc_delete_account()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'arc_not_signed_in' using errcode = '28000';
  end if;
  if exists (select 1 from public.admin_users a where a.user_id = uid) then
    raise exception 'arc_admin_account' using errcode = '42501';
  end if;
  if not arc.mfa_satisfied() then
    raise exception 'arc_mfa_required' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.arc_delete_account() from public, anon;
grant execute on function public.arc_delete_account() to authenticated;
