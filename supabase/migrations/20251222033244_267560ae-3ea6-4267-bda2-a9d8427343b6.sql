-- Adicionar novas colunas para conteúdo gerado
ALTER TABLE documentarios_juridicos ADD COLUMN IF NOT EXISTS sobre_texto TEXT;
ALTER TABLE documentarios_juridicos ADD COLUMN IF NOT EXISTS questoes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE documentarios_juridicos ADD COLUMN IF NOT EXISTS questoes_dinamicas JSONB DEFAULT '[]'::jsonb;