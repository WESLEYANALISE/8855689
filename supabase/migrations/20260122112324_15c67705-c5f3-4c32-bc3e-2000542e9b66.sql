-- Adicionar coluna para salvar o índice bruto do PDF para debug e referência
ALTER TABLE conceitos_materias 
ADD COLUMN IF NOT EXISTS indice_bruto TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN conceitos_materias.indice_bruto IS 'Índice/sumário extraído do PDF para referência e debug';