-- Adicionar colunas para extração de texto
ALTER TABLE public.peticoes_modelos 
ADD COLUMN IF NOT EXISTS texto_extraido TEXT,
ADD COLUMN IF NOT EXISTS texto_extraido_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS texto_extraido_status TEXT;

-- Índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_peticoes_texto_status ON public.peticoes_modelos(texto_extraido_status);