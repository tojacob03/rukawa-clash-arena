-- Lock down direct access to the client portal tables and storage buckets.
--
-- The client portal never touches these tables or buckets with the public
-- key: it goes through SECURITY DEFINER functions (owned by postgres, the
-- table owner, so row level security does not apply to them) and through the
-- get-client-file edge function, which uses the service role. The policies
-- removed here were left over from earlier iterations and granted direct
-- access to every visitor or every signed-in account. Permissive policies are
-- OR-ed, so the stricter is_admin() policies next to them did not help.
--
-- This is also the precondition for open sign-ups (Waza Arc, KONZEPT.md 8.3):
-- after it, a signed-in account that is not in admin_users sees nothing here.

-- Client sessions and login attempts: only the portal functions and the
-- service role work with them. Admins keep their read policies.
drop policy if exists "Allow functions to manage client_sessions" on public.client_sessions;
drop policy if exists "Allow functions to manage client_login_attempts" on public.client_login_attempts;
revoke all on public.client_sessions, public.client_login_attempts from anon;
revoke insert, update, delete, truncate, references, trigger on public.client_sessions, public.client_login_attempts from authenticated;

-- Contact form rate limits: only submit_contact_form_secure() and the
-- maintenance job write them.
drop policy if exists "Allow anon to manage rate limits for contact form" on public.contact_rate_limits;
drop policy if exists "Allow authenticated users to manage rate limits" on public.contact_rate_limits;
drop policy if exists "Allow secure contact function access" on public.contact_rate_limits;
revoke all on public.contact_rate_limits from anon, authenticated;

-- Storage: files reach clients as signed URLs from the edge function. The
-- is_admin() policies for the admin panel stay.
drop policy if exists "Public read analysis files" on storage.objects;
drop policy if exists "Admin can view all analysis files" on storage.objects;
drop policy if exists "Admin can view all deck files" on storage.objects;
drop policy if exists "Admin can upload analysis files" on storage.objects;
drop policy if exists "Admin can upload deck files" on storage.objects;
drop policy if exists "Admin can delete analysis files" on storage.objects;
drop policy if exists "Admin can delete deck files" on storage.objects;

-- Maintenance and audit helpers are not part of the public API. Scheduled
-- jobs run as postgres and are not affected. admin_security_audit() checks
-- is_admin() itself and keeps working for admins.
revoke execute on function public.audit_table_security() from public, anon, authenticated;
revoke execute on function public.security_maintenance() from public, anon, authenticated;
revoke execute on function public.cleanup_expired_sessions() from public, anon, authenticated;
