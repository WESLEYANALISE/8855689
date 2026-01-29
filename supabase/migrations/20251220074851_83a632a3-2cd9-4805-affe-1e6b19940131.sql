-- Adicionar colunas separadas para data do DOU e data do ato
ALTER TABLE public.leis_push_2025 
ADD COLUMN IF NOT EXISTS data_dou DATE,
ADD COLUMN IF NOT EXISTS data_ato DATE;

-- Migrar dados existentes: data_publicacao vai para data_ato (era a data da lei)
UPDATE public.leis_push_2025 
SET data_ato = data_publicacao 
WHERE data_ato IS NULL AND data_publicacao IS NOT NULL;

-- Criar índice para busca por data do DOU
CREATE INDEX IF NOT EXISTS idx_leis_push_2025_data_dou ON public.leis_push_2025(data_dou DESC);

-- Comentários para documentação
COMMENT ON COLUMN public.leis_push_2025.data_dou IS 'Data de publicação no Diário Oficial da União';
COMMENT ON COLUMN public.leis_push_2025.data_ato IS 'Data oficial do ato jurídico (assinatura da lei)';