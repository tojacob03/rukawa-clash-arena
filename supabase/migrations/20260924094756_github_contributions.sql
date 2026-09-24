-- GitHub contribution graph for the homepage ("How I build").
-- Once a day the database fetches the contribution calendar from the GitHub
-- GraphQL API (token from Vault secret "github_token") and caches it. The
-- website only reads the cached JSON through public.github_contributions().
create schema if not exists github;
revoke all on schema github from public, anon, authenticated;

create table if not exists github.contribution_cache (
  id          integer primary key default 1 check (id = 1),
  payload     jsonb,
  built_at    timestamptz,
  last_run_at timestamptz not null default now(),
  last_error  text
);
alter table github.contribution_cache enable row level security;

create or replace function github.refresh(p_login text default 'tojacob03')
returns text
language plpgsql
set search_path = github, extensions, public
as $$
declare
  v_token text;
  v_resp  extensions.http_response;
  v_body  jsonb;
  v_cal   jsonb;
  v_err   text;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'github_token' limit 1;
  if v_token is null then
    raise exception 'Vault secret github_token is missing';
  end if;

  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '30');
  v_resp := extensions.http((
    'POST',
    'https://api.github.com/graphql',
    array[
      extensions.http_header('Authorization', 'bearer ' || v_token),
      extensions.http_header('User-Agent', 'rukawa-analytics')
    ],
    'application/json',
    jsonb_build_object(
      'query', 'query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }',
      'variables', jsonb_build_object('login', p_login)
    )::text
  )::extensions.http_request);

  if v_resp.status <> 200 then
    raise exception 'GitHub answered HTTP %', v_resp.status;
  end if;
  v_body := v_resp.content::jsonb;
  if v_body ? 'errors' then
    raise exception 'GitHub: %', v_body -> 'errors' -> 0 ->> 'message';
  end if;
  v_cal := v_body #> '{data,user,contributionsCollection,contributionCalendar}';

  insert into github.contribution_cache (id, payload, built_at, last_run_at, last_error)
  values (
    1,
    jsonb_build_object(
      'login', p_login,
      'total', v_cal -> 'totalContributions',
      'days', (
        select jsonb_agg(jsonb_build_array(d ->> 'date', (d ->> 'contributionCount')::int) order by d ->> 'date')
        from jsonb_array_elements(v_cal -> 'weeks') w,
             jsonb_array_elements(w -> 'contributionDays') d
      )
    ),
    now(), now(), null
  )
  on conflict (id) do update
    set payload = excluded.payload, built_at = excluded.built_at, last_run_at = now(), last_error = null;
  return 'ok';

exception when others then
  -- Keep the last good payload; only record what went wrong.
  get stacked diagnostics v_err = message_text;
  insert into github.contribution_cache (id, last_run_at, last_error)
  values (1, now(), v_err)
  on conflict (id) do update set last_run_at = now(), last_error = excluded.last_error;
  return 'error: ' || v_err;
end;
$$;

revoke all on all tables in schema github from public, anon, authenticated;
revoke all on function github.refresh(text) from public, anon, authenticated;

-- The only public interface: the cached calendar, no token, no raw response.
create or replace function public.github_contributions()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select c.payload || jsonb_build_object('built_at', c.built_at)
  from github.contribution_cache c
  where c.id = 1 and c.payload is not null;
$$;

revoke all on function public.github_contributions() from public;
grant execute on function public.github_contributions() to anon, authenticated;

-- Daily at 04:15 UTC: one GitHub API call per day.
select cron.schedule('github-contributions', '15 4 * * *', $job$select github.refresh()$job$);
