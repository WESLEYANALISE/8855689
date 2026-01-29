-- Adicionar colunas de cache de conteúdo gerado na tabela CP - Código Penal
ALTER TABLE "CP - Código Penal"
ADD COLUMN IF NOT EXISTS explicacao_tecnico TEXT,
ADD COLUMN IF NOT EXISTS explicacao_resumido TEXT,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 TEXT,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 TEXT,
ADD COLUMN IF NOT EXISTS exemplo TEXT,
ADD COLUMN IF NOT EXISTS termos JSONB,
ADD COLUMN IF NOT EXISTS flashcards JSONB,
ADD COLUMN IF NOT EXISTS questoes JSONB,
ADD COLUMN IF NOT EXISTS ultima_atualizacao TIMESTAMP,
ADD COLUMN IF NOT EXISTS versao_conteudo INTEGER DEFAULT 1;

-- Adicionar política RLS para permitir sistema (service_role) atualizar
CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CP - Código Penal"
  FOR UPDATE 
  USING (true);

-- Garantir que SELECT continua público
DROP POLICY IF EXISTS "w" ON "CP - Código Penal";
CREATE POLICY "Código Penal é público para leitura" ON "CP - Código Penal"
  FOR SELECT 
  USING (true);

-- Criar índice para busca rápida por artigo
CREATE INDEX IF NOT EXISTS idx_cp_numero_artigo ON "CP - Código Penal"("Número do Artigo");