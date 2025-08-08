-- Fix the data type conversion issue properly
-- The previous migration didn't work correctly, so let's do it step by step

-- First, check if we still have the wrong data type
DO $$
BEGIN
    -- If card_ids is still json type, convert it properly
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deck_files' 
        AND column_name = 'card_ids' 
        AND data_type = 'json'
    ) THEN
        -- Create conversion function
        CREATE OR REPLACE FUNCTION safe_convert_scientific(val text)
        RETURNS integer AS $func$
        BEGIN
            IF val ~ 'e\+' THEN
                RETURN ROUND(val::numeric)::integer;
            ELSE
                RETURN val::integer;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RETURN 0; -- fallback for invalid data
        END;
        $func$ LANGUAGE plpgsql;

        -- Add new column
        ALTER TABLE public.deck_files ADD COLUMN card_ids_new integer[];

        -- Convert existing data properly
        UPDATE public.deck_files 
        SET card_ids_new = ARRAY(
            SELECT safe_convert_scientific(trim(both '"' from value::text))
            FROM json_array_elements_text(
                CASE 
                    WHEN jsonb_typeof(card_ids::jsonb) = 'array' THEN card_ids::jsonb
                    ELSE '[]'::jsonb
                END
            ) AS value
        )
        WHERE card_ids IS NOT NULL;

        -- Drop old column and rename new one
        ALTER TABLE public.deck_files DROP COLUMN card_ids CASCADE;
        ALTER TABLE public.deck_files RENAME COLUMN card_ids_new TO card_ids;

        -- Clean up function
        DROP FUNCTION safe_convert_scientific(text);
        
        RAISE NOTICE 'Successfully converted card_ids from json to integer array';
    ELSE
        RAISE NOTICE 'card_ids column is already the correct type';
    END IF;
END
$$;