-- Create admin role enum
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin');

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin (no policy dependency)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE admin_users.user_id = $1
  );
$$;

-- Create function to get admin role (no policy dependency)
CREATE OR REPLACE FUNCTION public.get_admin_role(user_id UUID)
RETURNS admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.admin_users 
  WHERE admin_users.user_id = $1
  LIMIT 1;
$$;

-- Now create policies using the functions
CREATE POLICY "Admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (public.get_admin_role(auth.uid()) = 'super_admin');

-- Update existing table policies to use admin check
DROP POLICY IF EXISTS "Admin can manage all clients" ON public.clients;
CREATE POLICY "Admin can manage all clients" 
ON public.clients 
FOR ALL 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage all deck sets" ON public.deck_sets;
CREATE POLICY "Admin can manage all deck sets" 
ON public.deck_sets 
FOR ALL 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage all deck files" ON public.deck_files;
CREATE POLICY "Admin can manage all deck files" 
ON public.deck_files 
FOR ALL 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage all opponents" ON public.opponents;
CREATE POLICY "Admin can manage all opponents" 
ON public.opponents 
FOR ALL 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage all analysis files" ON public.analysis_files;
CREATE POLICY "Admin can manage all analysis files" 
ON public.analysis_files 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();