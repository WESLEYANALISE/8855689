-- Corrigir search_path da função update_cache_pesquisas_updated_at
-- Primeiro remover o trigger
DROP TRIGGER IF EXISTS trigger_update_cache_pesquisas_updated_at ON public.cache_pesquisas;

-- Remover a função
DROP FUNCTION IF EXISTS public.update_cache_pesquisas_updated_at();

-- Recriar a função com search_path
CREATE OR REPLACE FUNCTION public.update_cache_pesquisas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.versao = OLD.versao + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Recriar o trigger
CREATE TRIGGER trigger_update_cache_pesquisas_updated_at
BEFORE UPDATE ON public.cache_pesquisas
FOR EACH ROW
EXECUTE FUNCTION public.update_cache_pesquisas_updated_at();