-- Adicionar colunas para conteúdo descomplicado e áudios separados
ALTER TABLE lei_seca_explicacoes
ADD COLUMN IF NOT EXISTS conteudo_descomplicado TEXT,
ADD COLUMN IF NOT EXISTS cache_descomplicado TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS url_audio_descomplicado TEXT;