-- Create client portal database structure

-- Client types enum
CREATE TYPE public.client_type AS ENUM ('player', 'team');

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.client_type NOT NULL,
  login_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage all clients" 
ON public.clients 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Deck sets for individual players
CREATE TABLE public.deck_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deck_sets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage all deck sets" 
ON public.deck_sets 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Files for deck sets (4 decks per set)
CREATE TABLE public.deck_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_set_id UUID NOT NULL REFERENCES public.deck_sets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  deck_number INTEGER NOT NULL CHECK (deck_number >= 1 AND deck_number <= 4),
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(deck_set_id, deck_number)
);

-- Enable RLS
ALTER TABLE public.deck_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage all deck files" 
ON public.deck_files 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Opponents for team analysis
CREATE TABLE public.opponents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.opponents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage all opponents" 
ON public.opponents 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Analysis files for teams (match and player analysis)
CREATE TABLE public.analysis_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_id UUID NOT NULL REFERENCES public.opponents(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('match_analysis', 'player_analysis')),
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage all analysis files" 
ON public.analysis_files 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Client sessions for tracking access
CREATE TABLE public.client_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  login_code TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can view all sessions" 
ON public.client_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Storage buckets for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('deck-files', 'deck-files', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('analysis-files', 'analysis-files', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

-- Storage policies for deck files
CREATE POLICY "Admin can upload deck files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'deck-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin can view all deck files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'deck-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete deck files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'deck-files' AND auth.uid() IS NOT NULL);

-- Storage policies for analysis files
CREATE POLICY "Admin can upload analysis files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'analysis-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin can view all analysis files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'analysis-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete analysis files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'analysis-files' AND auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deck_sets_updated_at
  BEFORE UPDATE ON public.deck_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opponents_updated_at
  BEFORE UPDATE ON public.opponents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();