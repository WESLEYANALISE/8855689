-- Create RPC function to get all flashcard areas with counts
CREATE OR REPLACE FUNCTION public.get_flashcard_areas()
RETURNS TABLE (area text, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT area, COUNT(*)::bigint as count
  FROM public."FLASHCARDS"
  WHERE area IS NOT NULL
  GROUP BY area
  ORDER BY area;
$$;

-- Create RPC function to get themes for a specific area with counts
CREATE OR REPLACE FUNCTION public.get_flashcard_temas(p_area text)
RETURNS TABLE (tema text, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT tema, COUNT(*)::bigint as count
  FROM public."FLASHCARDS"
  WHERE tema IS NOT NULL AND area = p_area
  GROUP BY tema
  ORDER BY tema;
$$;