-- Recuperação da tabela "CC - Código Civil"

-- 1. Criar a sequence para IDs
CREATE SEQUENCE IF NOT EXISTS "CC - Código Civil_id_seq";

-- 2. Adicionar coluna id com default da sequence
ALTER TABLE "CC - Código Civil" ADD COLUMN id bigint NOT NULL DEFAULT nextval('"CC - Código Civil_id_seq"');

-- 3. Conectar a sequence à coluna
ALTER SEQUENCE "CC - Código Civil_id_seq" OWNED BY "CC - Código Civil".id;

-- 4. Definir id como chave primária
ALTER TABLE "CC - Código Civil" ADD PRIMARY KEY (id);

-- 5. Corrigir tipos das colunas
ALTER TABLE "CC - Código Civil" 
  ALTER COLUMN termos TYPE jsonb USING CASE WHEN termos IS NULL OR termos = '' THEN NULL ELSE termos::jsonb END,
  ALTER COLUMN flashcards TYPE jsonb USING CASE WHEN flashcards IS NULL OR flashcards = '' THEN NULL ELSE flashcards::jsonb END,
  ALTER COLUMN questoes TYPE jsonb USING CASE WHEN questoes IS NULL OR questoes = '' THEN NULL ELSE questoes::jsonb END,
  ALTER COLUMN termos_aprofundados TYPE jsonb USING CASE WHEN termos_aprofundados IS NULL OR termos_aprofundados = '' THEN '{}'::jsonb ELSE termos_aprofundados::jsonb END,
  ALTER COLUMN versao_conteudo TYPE integer USING CASE WHEN versao_conteudo IS NULL OR versao_conteudo = '' THEN 1 ELSE versao_conteudo::integer END,
  ALTER COLUMN visualizacoes TYPE integer USING CASE WHEN visualizacoes IS NULL OR visualizacoes = '' THEN 0 ELSE visualizacoes::integer END,
  ALTER COLUMN ultima_atualizacao TYPE timestamp without time zone USING CASE WHEN ultima_atualizacao IS NULL OR ultima_atualizacao = '' THEN NULL ELSE ultima_atualizacao::timestamp without time zone END,
  ALTER COLUMN ultima_visualizacao TYPE timestamp with time zone USING CASE WHEN ultima_visualizacao IS NULL OR ultima_visualizacao = '' THEN NULL ELSE ultima_visualizacao::timestamp with time zone END;

-- 6. Adicionar defaults
ALTER TABLE "CC - Código Civil" 
  ALTER COLUMN versao_conteudo SET DEFAULT 1,
  ALTER COLUMN visualizacoes SET DEFAULT 0,
  ALTER COLUMN termos_aprofundados SET DEFAULT '{}'::jsonb;

-- 7. Garantir que as políticas RLS estão ativas
ALTER TABLE "CC - Código Civil" ENABLE ROW LEVEL SECURITY;

-- 8. Recriar política de leitura pública (se não existir)
DROP POLICY IF EXISTS "Código Civil é público para leitura" ON "CC - Código Civil";
CREATE POLICY "Código Civil é público para leitura"
  ON "CC - Código Civil"
  FOR SELECT
  USING (true);

-- 9. Recriar política de atualização do sistema (se não existir)
DROP POLICY IF EXISTS "Sistema pode atualizar conteúdo gerado" ON "CC - Código Civil";
CREATE POLICY "Sistema pode atualizar conteúdo gerado"
  ON "CC - Código Civil"
  FOR UPDATE
  USING (true);