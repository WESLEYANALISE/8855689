-- Adicionar colunas para exemplo prático no dicionário
ALTER TABLE "DICIONARIO" 
ADD COLUMN IF NOT EXISTS exemplo_pratico text,
ADD COLUMN IF NOT EXISTS exemplo_pratico_gerado_em timestamp with time zone;

-- Permitir sistema atualizar exemplo prático
CREATE POLICY "Sistema pode atualizar exemplo pratico" 
ON "DICIONARIO" 
FOR UPDATE 
USING (true);

-- Criar índice para melhorar performance de busca por palavra
CREATE INDEX IF NOT EXISTS idx_dicionario_palavra ON "DICIONARIO" ("Palavra");