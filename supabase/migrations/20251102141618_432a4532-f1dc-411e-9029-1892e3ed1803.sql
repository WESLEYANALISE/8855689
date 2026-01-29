-- FASE 1: Corrigir estrutura da CLT (Consolidação das Leis do Trabalho)

-- 1.1. Criar a sequence para IDs da CLT
CREATE SEQUENCE IF NOT EXISTS "CLT - Consolidação das Leis do Trabalho_id_seq";

-- 1.2. Adicionar coluna id com default da sequence
ALTER TABLE "CLT - Consolidação das Leis do Trabalho" 
ADD COLUMN id bigint NOT NULL DEFAULT nextval('"CLT - Consolidação das Leis do Trabalho_id_seq"');

-- 1.3. Conectar a sequence à coluna
ALTER SEQUENCE "CLT - Consolidação das Leis do Trabalho_id_seq" 
OWNED BY "CLT - Consolidação das Leis do Trabalho".id;

-- 1.4. Definir id como chave primária
ALTER TABLE "CLT - Consolidação das Leis do Trabalho" 
ADD PRIMARY KEY (id);

-- 1.5. Corrigir tipos das colunas da CLT
ALTER TABLE "CLT - Consolidação das Leis do Trabalho" 
  ALTER COLUMN termos TYPE jsonb USING CASE 
    WHEN termos IS NULL OR termos = '' THEN NULL 
    ELSE termos::jsonb 
  END,
  ALTER COLUMN flashcards TYPE jsonb USING CASE 
    WHEN flashcards IS NULL OR flashcards = '' THEN NULL 
    ELSE flashcards::jsonb 
  END,
  ALTER COLUMN questoes TYPE jsonb USING CASE 
    WHEN questoes IS NULL OR questoes = '' THEN NULL 
    ELSE questoes::jsonb 
  END,
  ALTER COLUMN termos_aprofundados TYPE jsonb USING CASE 
    WHEN termos_aprofundados IS NULL OR termos_aprofundados = '' THEN '{}'::jsonb 
    ELSE termos_aprofundados::jsonb 
  END,
  ALTER COLUMN versao_conteudo TYPE integer USING CASE 
    WHEN versao_conteudo IS NULL OR versao_conteudo = '' THEN 1 
    ELSE versao_conteudo::integer 
  END,
  ALTER COLUMN visualizacoes TYPE integer USING CASE 
    WHEN visualizacoes IS NULL OR visualizacoes = '' THEN 0 
    ELSE visualizacoes::integer 
  END,
  ALTER COLUMN ultima_atualizacao TYPE timestamp without time zone USING CASE 
    WHEN ultima_atualizacao IS NULL OR ultima_atualizacao = '' THEN NULL 
    ELSE ultima_atualizacao::timestamp without time zone 
  END,
  ALTER COLUMN ultima_visualizacao TYPE timestamp with time zone USING CASE 
    WHEN ultima_visualizacao IS NULL OR ultima_visualizacao = '' THEN NULL 
    ELSE ultima_visualizacao::timestamp with time zone 
  END;

-- 1.6. Adicionar defaults à CLT
ALTER TABLE "CLT - Consolidação das Leis do Trabalho" 
  ALTER COLUMN versao_conteudo SET DEFAULT 1,
  ALTER COLUMN visualizacoes SET DEFAULT 0,
  ALTER COLUMN termos_aprofundados SET DEFAULT '{}'::jsonb;

-- 1.7. Garantir RLS ativo na CLT
ALTER TABLE "CLT - Consolidação das Leis do Trabalho" ENABLE ROW LEVEL SECURITY;

-- 1.8. Recriar políticas RLS da CLT
DROP POLICY IF EXISTS "CLT é público para leitura" ON "CLT - Consolidação das Leis do Trabalho";
CREATE POLICY "CLT é público para leitura"
  ON "CLT - Consolidação das Leis do Trabalho"
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sistema pode atualizar conteúdo gerado" ON "CLT - Consolidação das Leis do Trabalho";
CREATE POLICY "Sistema pode atualizar conteúdo gerado"
  ON "CLT - Consolidação das Leis do Trabalho"
  FOR UPDATE
  USING (true);

-- FASE 2: Corrigir estrutura do CPC (Código de Processo Civil)

-- 2.1. Criar a sequence para IDs do CPC
CREATE SEQUENCE IF NOT EXISTS "CPC – Código de Processo Civil_id_seq";

-- 2.2. Adicionar coluna id com default da sequence
ALTER TABLE "CPC – Código de Processo Civil" 
ADD COLUMN id bigint NOT NULL DEFAULT nextval('"CPC – Código de Processo Civil_id_seq"');

-- 2.3. Conectar a sequence à coluna
ALTER SEQUENCE "CPC – Código de Processo Civil_id_seq" 
OWNED BY "CPC – Código de Processo Civil".id;

-- 2.4. IMPORTANTE: Remover duplicata do artigo 485 ANTES de criar a chave primária
-- Manter apenas o primeiro registro (menor rowid implícito)
DELETE FROM "CPC – Código de Processo Civil" 
WHERE ctid NOT IN (
  SELECT MIN(ctid) 
  FROM "CPC – Código de Processo Civil" 
  GROUP BY "Número do Artigo"
) AND "Número do Artigo" = '485';

-- 2.5. Definir id como chave primária
ALTER TABLE "CPC – Código de Processo Civil" 
ADD PRIMARY KEY (id);

-- 2.6. Corrigir tipos das colunas do CPC
ALTER TABLE "CPC – Código de Processo Civil" 
  ALTER COLUMN termos TYPE jsonb USING CASE 
    WHEN termos IS NULL OR termos = '' THEN NULL 
    ELSE termos::jsonb 
  END,
  ALTER COLUMN flashcards TYPE jsonb USING CASE 
    WHEN flashcards IS NULL OR flashcards = '' THEN NULL 
    ELSE flashcards::jsonb 
  END,
  ALTER COLUMN questoes TYPE jsonb USING CASE 
    WHEN questoes IS NULL OR questoes = '' THEN NULL 
    ELSE questoes::jsonb 
  END,
  ALTER COLUMN termos_aprofundados TYPE jsonb USING CASE 
    WHEN termos_aprofundados IS NULL OR termos_aprofundados = '' THEN '{}'::jsonb 
    ELSE termos_aprofundados::jsonb 
  END,
  ALTER COLUMN versao_conteudo TYPE integer USING CASE 
    WHEN versao_conteudo IS NULL OR versao_conteudo = '' THEN 1 
    ELSE versao_conteudo::integer 
  END,
  ALTER COLUMN visualizacoes TYPE integer USING CASE 
    WHEN visualizacoes IS NULL OR visualizacoes = '' THEN 0 
    ELSE visualizacoes::integer 
  END,
  ALTER COLUMN ultima_atualizacao TYPE timestamp without time zone USING CASE 
    WHEN ultima_atualizacao IS NULL OR ultima_atualizacao = '' THEN NULL 
    ELSE ultima_atualizacao::timestamp without time zone 
  END,
  ALTER COLUMN ultima_visualizacao TYPE timestamp with time zone USING CASE 
    WHEN ultima_visualizacao IS NULL OR ultima_visualizacao = '' THEN NULL 
    ELSE ultima_visualizacao::timestamp with time zone 
  END;

-- 2.7. Adicionar defaults ao CPC
ALTER TABLE "CPC – Código de Processo Civil" 
  ALTER COLUMN versao_conteudo SET DEFAULT 1,
  ALTER COLUMN visualizacoes SET DEFAULT 0,
  ALTER COLUMN termos_aprofundados SET DEFAULT '{}'::jsonb;

-- 2.8. Garantir RLS ativo no CPC
ALTER TABLE "CPC – Código de Processo Civil" ENABLE ROW LEVEL SECURITY;

-- 2.9. Recriar políticas RLS do CPC
DROP POLICY IF EXISTS "CPC é público para leitura" ON "CPC – Código de Processo Civil";
CREATE POLICY "CPC é público para leitura"
  ON "CPC – Código de Processo Civil"
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sistema pode atualizar conteúdo gerado" ON "CPC – Código de Processo Civil";
CREATE POLICY "Sistema pode atualizar conteúdo gerado"
  ON "CPC – Código de Processo Civil"
  FOR UPDATE
  USING (true);