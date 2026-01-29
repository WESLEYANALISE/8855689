-- FASE 1: Corrigir ESTATUTO - IDOSO
-- 1. Criar sequence
CREATE SEQUENCE IF NOT EXISTS "ESTATUTO - IDOSO_id_seq";

-- 2. Adicionar coluna id
ALTER TABLE "ESTATUTO - IDOSO" 
ADD COLUMN IF NOT EXISTS id bigint NOT NULL DEFAULT nextval('"ESTATUTO - IDOSO_id_seq"');

-- 3. Deletar registros vazios
DELETE FROM "ESTATUTO - IDOSO"
WHERE "Número do Artigo" IS NULL OR "Número do Artigo" = '';

-- 4. Corrigir tipos de colunas (apenas se ainda forem text)
DO $$
BEGIN
  -- termos
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ESTATUTO - IDOSO' 
             AND column_name = 'termos' 
             AND data_type = 'text') THEN
    ALTER TABLE "ESTATUTO - IDOSO" 
    ALTER COLUMN termos TYPE jsonb USING CASE 
      WHEN termos IS NULL OR termos = '' THEN NULL 
      ELSE termos::jsonb 
    END;
  END IF;

  -- flashcards
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ESTATUTO - IDOSO' 
             AND column_name = 'flashcards' 
             AND data_type = 'text') THEN
    ALTER TABLE "ESTATUTO - IDOSO" 
    ALTER COLUMN flashcards TYPE jsonb USING CASE 
      WHEN flashcards IS NULL OR flashcards = '' THEN NULL 
      ELSE flashcards::jsonb 
    END;
  END IF;

  -- questoes
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ESTATUTO - IDOSO' 
             AND column_name = 'questoes' 
             AND data_type = 'text') THEN
    ALTER TABLE "ESTATUTO - IDOSO" 
    ALTER COLUMN questoes TYPE jsonb USING CASE 
      WHEN questoes IS NULL OR questoes = '' THEN NULL 
      ELSE questoes::jsonb 
    END;
  END IF;

  -- termos_aprofundados
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ESTATUTO - IDOSO' 
             AND column_name = 'termos_aprofundados' 
             AND data_type = 'text') THEN
    ALTER TABLE "ESTATUTO - IDOSO" 
    ALTER COLUMN termos_aprofundados TYPE jsonb USING CASE 
      WHEN termos_aprofundados IS NULL OR termos_aprofundados = '' THEN '{}'::jsonb 
      ELSE termos_aprofundados::jsonb 
    END;
  END IF;

  -- versao_conteudo
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ESTATUTO - IDOSO' 
             AND column_name = 'versao_conteudo' 
             AND data_type = 'text') THEN
    ALTER TABLE "ESTATUTO - IDOSO" 
    ALTER COLUMN versao_conteudo TYPE integer USING CASE 
      WHEN versao_conteudo IS NULL OR versao_conteudo = '' THEN 1 
      ELSE versao_conteudo::integer 
    END;
  END IF;

  -- visualizacoes
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ESTATUTO - IDOSO' 
             AND column_name = 'visualizacoes' 
             AND data_type = 'text') THEN
    ALTER TABLE "ESTATUTO - IDOSO" 
    ALTER COLUMN visualizacoes TYPE integer USING CASE 
      WHEN visualizacoes IS NULL OR visualizacoes = '' THEN 0 
      ELSE visualizacoes::integer 
    END;
  END IF;

  -- ultima_atualizacao
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ESTATUTO - IDOSO' 
             AND column_name = 'ultima_atualizacao' 
             AND data_type = 'text') THEN
    ALTER TABLE "ESTATUTO - IDOSO" 
    ALTER COLUMN ultima_atualizacao TYPE timestamp without time zone USING CASE 
      WHEN ultima_atualizacao IS NULL OR ultima_atualizacao = '' THEN NULL 
      ELSE ultima_atualizacao::timestamp 
    END;
  END IF;

  -- ultima_visualizacao
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'ESTATUTO - IDOSO' 
             AND column_name = 'ultima_visualizacao' 
             AND data_type = 'text') THEN
    ALTER TABLE "ESTATUTO - IDOSO" 
    ALTER COLUMN ultima_visualizacao TYPE timestamp with time zone USING CASE 
      WHEN ultima_visualizacao IS NULL OR ultima_visualizacao = '' THEN NULL 
      ELSE ultima_visualizacao::timestamp with time zone 
    END;
  END IF;
END $$;

-- 5. Adicionar defaults
ALTER TABLE "ESTATUTO - IDOSO"
  ALTER COLUMN versao_conteudo SET DEFAULT 1,
  ALTER COLUMN visualizacoes SET DEFAULT 0,
  ALTER COLUMN termos_aprofundados SET DEFAULT '{}'::jsonb;

-- 6. Adicionar PRIMARY KEY para ESTATUTO - IDOSO (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = '"ESTATUTO - IDOSO"'::regclass 
    AND contype = 'p'
  ) THEN
    ALTER TABLE "ESTATUTO - IDOSO" ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 7. Habilitar RLS se não estiver ativo
ALTER TABLE "ESTATUTO - IDOSO" ENABLE ROW LEVEL SECURITY;

-- 8. Criar política de leitura pública se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ESTATUTO - IDOSO' 
    AND policyname = 'e'
  ) THEN
    CREATE POLICY "e" ON "ESTATUTO - IDOSO"
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- FASE 2: Adicionar PRIMARY KEYS em todas as tabelas (se não existirem)
DO $$
DECLARE
  tables text[] := ARRAY[
    'CC - Código Civil',
    'CF - Constituição Federal',
    'CP - Código Penal',
    'CLT - Consolidação das Leis do Trabalho',
    'CPC – Código de Processo Civil',
    'CPP – Código de Processo Penal',
    'CDC – Código de Defesa do Consumidor',
    'CE – Código Eleitoral',
    'CTB Código de Trânsito Brasileiro',
    'CTN – Código Tributário Nacional',
    'ESTATUTO - DESARMAMENTO',
    'ESTATUTO - ECA',
    'ESTATUTO - PESSOA COM DEFICIÊNCIA'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = ('"' || tbl || '"')::regclass 
      AND contype = 'p'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD PRIMARY KEY (id)', tbl);
    END IF;
  END LOOP;
END $$;