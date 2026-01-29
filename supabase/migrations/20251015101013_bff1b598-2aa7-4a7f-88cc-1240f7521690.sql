-- Fix search_path for flashcard RPC functions
CREATE OR REPLACE FUNCTION public.get_flashcard_areas()
RETURNS TABLE (area text, count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT area, COUNT(*)::bigint as count
  FROM public."FLASHCARDS"
  WHERE area IS NOT NULL
  GROUP BY area
  ORDER BY area;
$$;

CREATE OR REPLACE FUNCTION public.get_flashcard_temas(p_area text)
RETURNS TABLE (tema text, count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT tema, COUNT(*)::bigint as count
  FROM public."FLASHCARDS"
  WHERE tema IS NOT NULL AND area = p_area
  GROUP BY tema
  ORDER BY tema;
$$;