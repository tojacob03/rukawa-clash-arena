-- Convert card_ids from JSON to integer array and fix scientific notation

-- First, create a temporary function to convert scientific notation to integers
CREATE OR REPLACE FUNCTION convert_scientific_to_int(val text)
RETURNS integer AS $$
BEGIN
    -- Handle scientific notation like 2.600004e+07 -> 26000040
    IF val ~ 'e\+' THEN
        RETURN ROUND(val::numeric)::integer;
    ELSE
        RETURN val::integer;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a new column with the correct type
ALTER TABLE public.deck_files ADD COLUMN card_ids_temp integer[];

-- Migrate existing data from JSON to integer array
UPDATE public.deck_files 
SET card_ids_temp = ARRAY(
    SELECT convert_scientific_to_int(value::text)
    FROM json_array_elements_text(card_ids::json)
)
WHERE card_ids IS NOT NULL;

-- Drop the old column and rename the new one
ALTER TABLE public.deck_files DROP COLUMN card_ids;
ALTER TABLE public.deck_files RENAME COLUMN card_ids_temp TO card_ids;

-- Clean up the temporary function
DROP FUNCTION convert_scientific_to_int(text);