-- Automatic deletion according to the retention periods promised in the
-- privacy policy (/datenschutz):
--   contact requests            -> after 12 months
--   IP addresses (rate limits)  -> after 24 hours (policy promises max. 30 days)
--   portal login attempts       -> after 30 days
--   expired portal sessions     -> 7 days after expiry (contain IP + user agent)
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.privacy_retention_cleanup()
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from public.contact_submissions
  where created_at < now() - interval '12 months';

  delete from public.contact_rate_limits
  where last_submission < now() - interval '24 hours';

  delete from public.client_login_attempts
  where attempted_at < now() - interval '30 days';

  delete from public.client_sessions
  where expires_at < now() - interval '7 days';
end;
$$;

-- Not callable from the website/API, only by the database itself (cron).
revoke all on function public.privacy_retention_cleanup() from public, anon, authenticated;

comment on function public.privacy_retention_cleanup() is
  'Deletes personal data after the retention periods stated in the privacy policy. Run daily by pg_cron job privacy-retention-cleanup.';

-- Daily at 03:15 UTC. Created INACTIVE on purpose: the first run deletes
-- existing data, so the owner reviews it and switches the job on himself.
select cron.schedule(
  'privacy-retention-cleanup',
  '15 3 * * *',
  $job$select public.privacy_retention_cleanup()$job$
);

select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'privacy-retention-cleanup'),
  active := false
);
