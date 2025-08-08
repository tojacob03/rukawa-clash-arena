-- Rename and restructure deck_files table for Clash Royale deck links
ALTER TABLE public.deck_files 
RENAME COLUMN file_path TO deck_link;

ALTER TABLE public.deck_files 
RENAME COLUMN file_name TO deck_name;

-- Remove unnecessary columns for file handling
ALTER TABLE public.deck_files 
DROP COLUMN IF EXISTS file_size,
DROP COLUMN IF EXISTS mime_type;

-- Add column for storing parsed card IDs as JSON array
ALTER TABLE public.deck_files 
ADD COLUMN card_ids JSON;