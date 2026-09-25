-- Waza Arc: reminders before each planned training.
--
-- The plan itself is part of the synced root record (arc.records, kind 'root',
-- data->'plan'), written by the app. This migration adds what the server needs
-- to act on it:
--   * arc.push_subscriptions  one row per device that wants notifications
--   * arc.reminder_log        one row per sent reminder, so none goes out twice
--   * arc.settings            public VAPID key and whether mail is configured
--   * functions for the app (config, subscribe, unsubscribe) and for the
--     arc-reminders Edge Function (targets, claim, results, keys)
--   * a cron job that calls the Edge Function every five minutes
-- The VAPID private key and the cron secret live in Vault.

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists arc.push_subscriptions (
  endpoint text primary key
    check (length(endpoint) <= 1000
      and endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/'),
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null check (p256dh ~ '^[A-Za-z0-9_-]{80,100}$'),
  auth text not null check (auth ~ '^[A-Za-z0-9_-]{16,30}$'),
  created_at timestamptz not null default now(),
  last_ok_at timestamptz,
  failures int not null default 0
);
create index if not exists push_subscriptions_user_idx on arc.push_subscriptions (user_id);
alter table arc.push_subscriptions enable row level security;

create table if not exists arc.reminder_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  slot_id text not null check (length(slot_id) <= 80),
  day date not null,
  channel text not null check (channel in ('push', 'email')),
  sent_at timestamptz not null default now(),
  primary key (user_id, slot_id, day, channel)
);
alter table arc.reminder_log enable row level security;

create table if not exists arc.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table arc.settings enable row level security;

-- No policies: nobody reads or writes these tables directly, only through the
-- functions below.
revoke all on arc.push_subscriptions, arc.reminder_log, arc.settings from public, anon, authenticated;

-- ── For the app ─────────────────────────────────────────────────────────────

create or replace function public.arc_reminder_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'vapid', (select s.value ->> 'public' from arc.settings s where s.key = 'vapid'),
    'email', coalesce((select (s.value ->> 'ready')::boolean from arc.settings s where s.key = 'email'), false)
  );
$$;

create or replace function public.arc_push_subscribe(p_endpoint text, p_p256dh text, p_auth text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'arc_not_signed_in' using errcode = '28000';
  end if;
  if not arc.mfa_satisfied() then
    raise exception 'arc_mfa_required' using errcode = '28000';
  end if;
  -- The endpoint is the device's own address at its push service; whoever
  -- holds it may move it to their account (a device signs in with someone else).
  insert into arc.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (p_endpoint, uid, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        created_at = now(), failures = 0;
  -- At most ten devices per account: the oldest go first.
  delete from arc.push_subscriptions
  where user_id = uid
    and endpoint in (
      select endpoint from arc.push_subscriptions where user_id = uid order by created_at desc offset 10
    );
exception
  when check_violation then
    raise exception 'arc_push_bad_subscription' using errcode = '22023';
end;
$$;

create or replace function public.arc_push_unsubscribe(p_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from arc.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;

revoke all on function public.arc_reminder_config() from public, anon;
revoke all on function public.arc_push_subscribe(text, text, text) from public, anon;
revoke all on function public.arc_push_unsubscribe(text) from public, anon;
grant execute on function public.arc_reminder_config() to authenticated;
grant execute on function public.arc_push_subscribe(text, text, text) to authenticated;
grant execute on function public.arc_push_unsubscribe(text) to authenticated;

-- ── For the arc-reminders Edge Function (service role only) ─────────────────

-- Everyone whose plan asks for push or mail, with their devices and, if
-- confirmed, their address. p_user limits it to one account (test message).
create or replace function public.arc_reminder_targets(p_user uuid default null)
returns table (user_id uuid, email text, plan jsonb, pauses jsonb, subs jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    case when u.email_confirmed_at is not null then u.email::text end,
    r.data -> 'plan',
    coalesce(r.data -> 'pauses', '[]'::jsonb),
    coalesce(
      (select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
       from arc.push_subscriptions s where s.user_id = u.id),
      '[]'::jsonb)
  from auth.users u
  left join arc.records r on r.user_id = u.id and r.kind = 'root' and not r.deleted
  where (p_user is not null and u.id = p_user)
     or (p_user is null
         and r.user_id is not null
         and jsonb_typeof(r.data -> 'plan' -> 'slots') = 'array'
         and jsonb_array_length(r.data -> 'plan' -> 'slots') > 0
         and (coalesce((r.data -> 'plan' ->> 'push')::boolean, false)
              or coalesce((r.data -> 'plan' ->> 'email')::boolean, false)));
$$;

-- Reserve one reminder before sending it: true exactly once per user, slot, day and channel.
create or replace function public.arc_reminder_claim(p_user uuid, p_slot text, p_day date, p_channel text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into arc.reminder_log (user_id, slot_id, day, channel)
  values (p_user, p_slot, p_day, p_channel)
  on conflict do nothing;
  return found;
end;
$$;

-- Outcome of one push: gone subscriptions are dropped, five failures in a row too.
create or replace function public.arc_push_result(p_endpoint text, p_ok boolean, p_gone boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_gone then
    delete from arc.push_subscriptions where endpoint = p_endpoint;
  elsif p_ok then
    update arc.push_subscriptions set last_ok_at = now(), failures = 0 where endpoint = p_endpoint;
  else
    update arc.push_subscriptions set failures = failures + 1 where endpoint = p_endpoint;
    delete from arc.push_subscriptions where endpoint = p_endpoint and failures >= 5;
  end if;
end;
$$;

-- VAPID keys: created once by the Edge Function, the private half kept in Vault.
create or replace function public.arc_vapid_keys()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when s.value ? 'public' then
    jsonb_build_object(
      'public', s.value ->> 'public',
      'private', (select d.decrypted_secret from vault.decrypted_secrets d where d.name = 'arc_vapid_private'))
  end
  from arc.settings s where s.key = 'vapid';
$$;

create or replace function public.arc_vapid_init(p_public text, p_private text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('arc_vapid_init'));
  if not exists (select 1 from arc.settings where key = 'vapid') then
    if p_public !~ '^[A-Za-z0-9_-]{87}$' or p_private !~ '^[A-Za-z0-9_-]{43}$' then
      raise exception 'arc_vapid_bad_key' using errcode = '22023';
    end if;
    -- A leftover private key without a public one (an aborted first run) is replaced.
    select id into v_id from vault.secrets where name = 'arc_vapid_private';
    if v_id is null then
      perform vault.create_secret(p_private, 'arc_vapid_private', 'Waza Arc: VAPID private key for web push');
    else
      perform vault.update_secret(v_id, p_private);
    end if;
    insert into arc.settings (key, value) values ('vapid', jsonb_build_object('public', p_public));
  end if;
  return public.arc_vapid_keys();
end;
$$;

create or replace function public.arc_set_email_ready(p_ready boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into arc.settings (key, value) values ('email', jsonb_build_object('ready', p_ready))
  on conflict (key) do update set value = excluded.value, updated_at = now()
  where arc.settings.value is distinct from excluded.value;
$$;

-- The cron job proves itself with a secret only the database knows.
create or replace function public.arc_cron_check(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select d.decrypted_secret = p_secret from vault.decrypted_secrets d where d.name = 'arc_reminders_cron'),
    false) and p_secret is not null;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.arc_reminder_targets(uuid)',
    'public.arc_reminder_claim(uuid, text, date, text)',
    'public.arc_push_result(text, boolean, boolean)',
    'public.arc_vapid_keys()',
    'public.arc_vapid_init(text, text)',
    'public.arc_set_email_ready(boolean)',
    'public.arc_cron_check(text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end;
$$;

-- ── Every five minutes ──────────────────────────────────────────────────────

-- A random secret, generated here and never shown anywhere.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'arc_reminders_cron') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'arc_reminders_cron', 'Waza Arc: header secret for the reminder cron job');
  end if;
end;
$$;

create or replace function arc.reminders_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_resp extensions.http_response;
begin
  delete from arc.reminder_log where day < current_date - 30;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'arc_reminders_cron';
  if v_secret is null then
    return;
  end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '50');
  v_resp := extensions.http((
    'POST',
    'https://jtpiybdcuawhnfibrdho.supabase.co/functions/v1/arc-reminders',
    array[extensions.http_header('x-arc-cron', v_secret)],
    'application/json',
    '{"action":"tick"}'
  )::extensions.http_request);
  if v_resp.status <> 200 then
    -- Shows up as a failed run in cron.job_run_details.
    raise exception 'arc-reminders answered HTTP %: %', v_resp.status, left(v_resp.content, 300);
  end if;
end;
$$;
revoke all on function arc.reminders_tick() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'arc-reminders';
select cron.schedule('arc-reminders', '*/5 * * * *', 'select arc.reminders_tick()');
