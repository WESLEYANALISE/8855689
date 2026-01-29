-- Corrigir função para adicionar search_path
CREATE OR REPLACE FUNCTION public.update_noticias_cache_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;