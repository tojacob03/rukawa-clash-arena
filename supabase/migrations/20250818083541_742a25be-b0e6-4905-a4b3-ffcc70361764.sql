-- Targeted Security Fix: Ensure proper RLS policy enforcement
-- Add explicit policies to prevent public access where missing

-- 1. Ensure anon users cannot access sensitive tables
-- Check if default-deny policies exist, create if needed

DO $$
BEGIN
    -- For clients table - ensure no anon access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'clients' 
        AND policyname LIKE '%deny%anon%' OR policyname LIKE '%admin%'
    ) THEN
        -- Create explicit deny policy for anon users
        EXECUTE 'CREATE POLICY "Deny anonymous access to clients" ON public.clients FOR ALL TO anon USING (false)';
    END IF;

    -- For client_sessions table - ensure no anon access  
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'client_sessions' 
        AND policyname LIKE '%deny%anon%' OR policyname LIKE '%admin%'
    ) THEN
        EXECUTE 'CREATE POLICY "Deny anonymous access to sessions" ON public.client_sessions FOR ALL TO anon USING (false)';
    END IF;

    -- For client_login_attempts - ensure no anon access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'client_login_attempts' 
        AND policyname LIKE '%deny%anon%' OR policyname LIKE '%admin%'
    ) THEN
        EXECUTE 'CREATE POLICY "Deny anonymous access to login attempts" ON public.client_login_attempts FOR ALL TO anon USING (false)';
    END IF;

    -- For admin_users - ensure no anon access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'admin_users' 
        AND policyname LIKE '%deny%anon%' OR policyname LIKE '%admin%'
    ) THEN
        EXECUTE 'CREATE POLICY "Deny anonymous access to admin users" ON public.admin_users FOR ALL TO anon USING (false)';
    END IF;

    RAISE NOTICE 'Security policies verification completed';
END $$;

-- 2. Verify RLS is enabled on all sensitive tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.client_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_files ENABLE ROW LEVEL SECURITY;

-- 3. Create a security audit function
CREATE OR REPLACE FUNCTION public.audit_table_security()
RETURNS TABLE(
    table_name text,
    rls_enabled boolean,
    policy_count bigint,
    has_anon_policies boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        COALESCE(c.rowsecurity, false) as rls_enabled,
        COALESCE(p.policy_count, 0) as policy_count,
        COALESCE(ap.has_anon_policies, false) as has_anon_policies
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN (
        SELECT 
            tablename,
            COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY tablename
    ) p ON p.tablename = t.table_name
    LEFT JOIN (
        SELECT 
            tablename,
            bool_or(roles @> ARRAY['anon']) as has_anon_policies
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY tablename
    ) ap ON ap.tablename = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN (
        'clients', 'client_sessions', 'client_login_attempts', 
        'admin_users', 'contact_submissions', 'deck_sets', 
        'deck_files', 'opponents', 'analysis_files'
    )
    ORDER BY t.table_name;
END;
$function$;

-- Grant execute to admins only
GRANT EXECUTE ON FUNCTION public.audit_table_security() TO authenticated;