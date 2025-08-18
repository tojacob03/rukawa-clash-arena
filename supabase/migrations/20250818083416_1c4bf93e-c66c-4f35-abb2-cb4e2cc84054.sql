-- Fix Public Data Exposure Security Issues
-- Ensure all sensitive tables have proper RLS policies that explicitly deny public access

-- 1. Fix contact_submissions - currently publicly readable
DROP POLICY IF EXISTS "Anyone can submit contact forms" ON public.contact_submissions;
DROP POLICY IF EXISTS "Only admins can view contact submissions" ON public.contact_submissions;

-- Recreate with explicit restrictions
CREATE POLICY "Public can submit contact forms"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Only admins can view contact submissions"
ON public.contact_submissions  
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- 2. Fix clients table - currently publicly readable
DROP POLICY IF EXISTS "Admin can manage all clients" ON public.clients;

-- Recreate with explicit admin-only access
CREATE POLICY "Only admins can view clients"
ON public.clients
FOR SELECT  
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage clients"
ON public.clients
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 3. Fix client_login_attempts - currently publicly readable  
DROP POLICY IF EXISTS "Admins can view login attempts" ON public.client_login_attempts;

CREATE POLICY "Only admins can view login attempts"
ON public.client_login_attempts
FOR SELECT
TO authenticated  
USING (is_admin(auth.uid()));

-- 4. Fix client_sessions - currently publicly readable
DROP POLICY IF EXISTS "Admins can view client sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Only admins can view client sessions" ON public.client_sessions;

CREATE POLICY "Only admins can view client sessions"
ON public.client_sessions
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- 5. Fix admin_users - currently publicly readable
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Recreate with proper restrictions
CREATE POLICY "Only admins can view admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Only super admins can manage admin users"
ON public.admin_users  
FOR ALL
TO authenticated
USING (get_admin_role(auth.uid()) = 'super_admin'::admin_role)
WITH CHECK (get_admin_role(auth.uid()) = 'super_admin'::admin_role);

-- 6. Ensure all other tables have proper restrictions
-- Fix deck_sets
DROP POLICY IF EXISTS "Admin can manage all deck sets" ON public.deck_sets;
CREATE POLICY "Only admins can manage deck sets"
ON public.deck_sets
FOR ALL
TO authenticated  
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix deck_files  
DROP POLICY IF EXISTS "Admin can manage all deck files" ON public.deck_files;
CREATE POLICY "Only admins can manage deck files"
ON public.deck_files
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix opponents
DROP POLICY IF EXISTS "Admin can manage all opponents" ON public.opponents;
CREATE POLICY "Only admins can manage opponents"  
ON public.opponents
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Fix analysis_files
DROP POLICY IF EXISTS "Admin can manage all analysis files" ON public.analysis_files;
CREATE POLICY "Only admins can manage analysis files"
ON public.analysis_files
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));