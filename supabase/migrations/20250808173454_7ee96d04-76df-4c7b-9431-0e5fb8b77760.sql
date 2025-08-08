-- Convert the scientific notation data that's still in the array format
-- We need to update the existing arrays with scientific notation values

UPDATE public.deck_files 
SET card_ids = ARRAY(
    SELECT ROUND(unnest_val::numeric)::integer
    FROM UNNEST(card_ids) AS unnest_val
)
WHERE array_length(card_ids, 1) = 8;