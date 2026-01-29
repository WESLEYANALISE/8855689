-- Adicionar coluna tipo_ato para identificar o tipo de ato normativo
ALTER TABLE public.leis_push 
ADD COLUMN IF NOT EXISTS tipo_ato text DEFAULT 'Lei Ordinária';

-- Adicionar coluna ordem_dou para manter a ordem da resenha diária
ALTER TABLE public.leis_push 
ADD COLUMN IF NOT EXISTS ordem_dou integer;

-- Criar índice para melhor performance nas buscas por tipo
CREATE INDEX IF NOT EXISTS idx_leis_push_tipo_ato ON public.leis_push(tipo_ato);

-- Atualizar leis existentes para ter o tipo correto baseado no numero_lei
UPDATE public.leis_push 
SET tipo_ato = 
  CASE 
    WHEN numero_lei ILIKE '%Lei Complementar%' THEN 'Lei Complementar'
    WHEN numero_lei ILIKE '%Medida Provisória%' OR numero_lei ILIKE '%MP %' THEN 'Medida Provisória'
    WHEN numero_lei ILIKE '%Decreto%' THEN 'Decreto'
    WHEN numero_lei ILIKE '%Emenda Constitucional%' OR numero_lei ILIKE '%EC %' THEN 'Emenda Constitucional'
    WHEN numero_lei ILIKE '%Lei nº%' OR numero_lei ILIKE '%Lei Ordinária%' THEN 'Lei Ordinária'
    ELSE 'Lei Ordinária'
  END
WHERE tipo_ato IS NULL OR tipo_ato = 'Lei Ordinária';