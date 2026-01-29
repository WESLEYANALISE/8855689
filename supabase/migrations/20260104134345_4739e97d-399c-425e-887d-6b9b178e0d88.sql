-- Criar índice único para permitir upsert por membro_id + titulo
CREATE UNIQUE INDEX IF NOT EXISTS aprofundamento_obras_membro_titulo_unique 
ON aprofundamento_obras (membro_id, titulo);