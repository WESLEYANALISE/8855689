-- Adicionar colunas para sistema de fila na tabela oab_trilhas_topicos
ALTER TABLE public.oab_trilhas_topicos 
ADD COLUMN IF NOT EXISTS posicao_fila INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tentativas INTEGER DEFAULT 0;

-- Índice para consultas de fila eficientes
CREATE INDEX IF NOT EXISTS idx_oab_trilhas_topicos_fila 
ON public.oab_trilhas_topicos (status, posicao_fila) 
WHERE status = 'na_fila';

-- Comentários para documentação
COMMENT ON COLUMN public.oab_trilhas_topicos.posicao_fila IS 'Posição na fila de geração (NULL = não enfileirado)';
COMMENT ON COLUMN public.oab_trilhas_topicos.tentativas IS 'Número de tentativas de geração (máximo 3)';