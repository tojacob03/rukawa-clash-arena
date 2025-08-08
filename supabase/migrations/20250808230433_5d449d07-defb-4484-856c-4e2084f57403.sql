-- Ensure RLS is enabled on analysis_files
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_namespace n ON n.oid = t.schemaname::regnamespace
    WHERE n.nspname = 'public' AND t.tablename = 'analysis_files'
  ) THEN
    RAISE EXCEPTION 'Table public.analysis_files does not exist';
  END IF;
END $$;

ALTER TABLE public.analysis_files ENABLE ROW LEVEL SECURITY;

-- Policies for analysis_files table (admin-only management)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analysis_files' AND policyname='Admins can select analysis files'
  ) THEN
    CREATE POLICY "Admins can select analysis files"
    ON public.analysis_files
    FOR SELECT
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analysis_files' AND policyname='Admins can insert analysis files'
  ) THEN
    CREATE POLICY "Admins can insert analysis files"
    ON public.analysis_files
    FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analysis_files' AND policyname='Admins can update analysis files'
  ) THEN
    CREATE POLICY "Admins can update analysis files"
    ON public.analysis_files
    FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analysis_files' AND policyname='Admins can delete analysis files'
  ) THEN
    CREATE POLICY "Admins can delete analysis files"
    ON public.analysis_files
    FOR DELETE
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Storage policies for 'analysis-files' bucket (admin-only)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can select analysis-files'
  ) THEN
    CREATE POLICY "Admins can select analysis-files"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'analysis-files' AND public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can insert analysis-files'
  ) THEN
    CREATE POLICY "Admins can insert analysis-files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'analysis-files' AND public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can update analysis-files'
  ) THEN
    CREATE POLICY "Admins can update analysis-files"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'analysis-files' AND public.is_admin(auth.uid()))
    WITH CHECK (bucket_id = 'analysis-files' AND public.is_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can delete analysis-files'
  ) THEN
    CREATE POLICY "Admins can delete analysis-files"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'analysis-files' AND public.is_admin(auth.uid()));
  END IF;
END $$;