-- Adicionar coluna subtopicos para armazenar sub-seções agrupadas
ALTER TABLE conceitos_livro_temas 
ADD COLUMN IF NOT EXISTS subtopicos JSONB DEFAULT '[]';

-- Adicionar coluna para URL do PDF fonte
ALTER TABLE conceitos_trilhas 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN conceitos_livro_temas.subtopicos IS 'Lista de sub-tópicos agrupados (ex: Perfil Histórico I, II, III)';
COMMENT ON COLUMN conceitos_trilhas.pdf_url IS 'URL do PDF fonte no Google Drive';