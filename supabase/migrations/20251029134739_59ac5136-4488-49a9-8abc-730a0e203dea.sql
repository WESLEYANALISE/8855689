-- Adicionar coluna links_relacionados para meu_brasil_sistemas
ALTER TABLE public.meu_brasil_sistemas ADD COLUMN IF NOT EXISTS links_relacionados jsonb DEFAULT '[]'::jsonb;

-- Adicionar coluna links_relacionados para meu_brasil_casos
ALTER TABLE public.meu_brasil_casos ADD COLUMN IF NOT EXISTS links_relacionados jsonb DEFAULT '[]'::jsonb;

-- Comentários
COMMENT ON COLUMN public.meu_brasil_sistemas.links_relacionados IS 'Links relacionados da Wikipedia';
COMMENT ON COLUMN public.meu_brasil_casos.links_relacionados IS 'Links relacionados da Wikipedia';