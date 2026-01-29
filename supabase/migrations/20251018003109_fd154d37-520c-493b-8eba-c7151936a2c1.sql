-- Adicionar colunas de cache para todos os códigos e estatutos (exceto CP que já tem)

-- CC - Código Civil
ALTER TABLE "CC - Código Civil"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CPC – Código de Processo Civil
ALTER TABLE "CPC – Código de Processo Civil"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CPP – Código de Processo Penal
ALTER TABLE "CPP – Código de Processo Penal"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CF - Constituição Federal
ALTER TABLE "CF - Constituição Federal"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CLT – Consolidação das Leis do Trabalho
ALTER TABLE "CLT – Consolidação das Leis do Trabalho"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CDC – Código de Defesa do Consumidor
ALTER TABLE "CDC – Código de Defesa do Consumidor"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CTN – Código Tributário Nacional
ALTER TABLE "CTN – Código Tributário Nacional"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CTB Código de Trânsito Brasileiro
ALTER TABLE "CTB Código de Trânsito Brasileiro"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CE – Código Eleitoral
ALTER TABLE "CE – Código Eleitoral"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CA - Código de Águas
ALTER TABLE "CA - Código de Águas"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CBA Código Brasileiro de Aeronáutica
ALTER TABLE "CBA Código Brasileiro de Aeronáutica"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CBT Código Brasileiro de Telecomunicações
ALTER TABLE "CBT Código Brasileiro de Telecomunicações"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CCOM – Código Comercial
ALTER TABLE "CCOM – Código Comercial"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- CDM – Código de Minas
ALTER TABLE "CDM – Código de Minas"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- ESTATUTO - ECA
ALTER TABLE "ESTATUTO - ECA"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- ESTATUTO - IDOSO
ALTER TABLE "ESTATUTO - IDOSO"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- ESTATUTO - OAB
ALTER TABLE "ESTATUTO - OAB"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- ESTATUTO - DESARMAMENTO
ALTER TABLE "ESTATUTO - DESARMAMENTO"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- ESTATUTO - IGUALDADE RACIAL
ALTER TABLE "ESTATUTO - IGUALDADE RACIAL"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- ESTATUTO - PESSOA COM DEFICIÊNCIA
ALTER TABLE "ESTATUTO - PESSOA COM DEFICIÊNCIA"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- ESTATUTO - CIDADE
ALTER TABLE "ESTATUTO - CIDADE"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- ESTATUTO - TORCEDOR
ALTER TABLE "ESTATUTO - TORCEDOR"
ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS termos jsonb,
ADD COLUMN IF NOT EXISTS flashcards jsonb,
ADD COLUMN IF NOT EXISTS questoes jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
ADD COLUMN IF NOT EXISTS explicacao_resumido text,
ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
ADD COLUMN IF NOT EXISTS exemplo text;

-- Habilitar RLS e adicionar políticas para permitir atualização do sistema
DO $$
BEGIN
  -- CC - Código Civil
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CC - Código Civil' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CC - Código Civil" FOR UPDATE USING (true);
  END IF;

  -- CPC – Código de Processo Civil
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CPC – Código de Processo Civil' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CPC – Código de Processo Civil" FOR UPDATE USING (true);
  END IF;

  -- CPP – Código de Processo Penal
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CPP – Código de Processo Penal' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CPP – Código de Processo Penal" FOR UPDATE USING (true);
  END IF;

  -- CF - Constituição Federal
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CF - Constituição Federal' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CF - Constituição Federal" FOR UPDATE USING (true);
  END IF;

  -- CLT – Consolidação das Leis do Trabalho
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CLT – Consolidação das Leis do Trabalho' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CLT – Consolidação das Leis do Trabalho" FOR UPDATE USING (true);
  END IF;

  -- CDC – Código de Defesa do Consumidor
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CDC – Código de Defesa do Consumidor' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CDC – Código de Defesa do Consumidor" FOR UPDATE USING (true);
  END IF;

  -- CTN – Código Tributário Nacional
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CTN – Código Tributário Nacional' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CTN – Código Tributário Nacional" FOR UPDATE USING (true);
  END IF;

  -- CTB Código de Trânsito Brasileiro
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CTB Código de Trânsito Brasileiro' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CTB Código de Trânsito Brasileiro" FOR UPDATE USING (true);
  END IF;

  -- CE – Código Eleitoral
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CE – Código Eleitoral' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CE – Código Eleitoral" FOR UPDATE USING (true);
  END IF;

  -- CA - Código de Águas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CA - Código de Águas' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CA - Código de Águas" FOR UPDATE USING (true);
  END IF;

  -- CBA Código Brasileiro de Aeronáutica
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CBA Código Brasileiro de Aeronáutica' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CBA Código Brasileiro de Aeronáutica" FOR UPDATE USING (true);
  END IF;

  -- CBT Código Brasileiro de Telecomunicações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CBT Código Brasileiro de Telecomunicações' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CBT Código Brasileiro de Telecomunicações" FOR UPDATE USING (true);
  END IF;

  -- CCOM – Código Comercial
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CCOM – Código Comercial' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CCOM – Código Comercial" FOR UPDATE USING (true);
  END IF;

  -- CDM – Código de Minas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'CDM – Código de Minas' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "CDM – Código de Minas" FOR UPDATE USING (true);
  END IF;

  -- ESTATUTO - ECA
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ESTATUTO - ECA' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "ESTATUTO - ECA" FOR UPDATE USING (true);
  END IF;

  -- ESTATUTO - IDOSO
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ESTATUTO - IDOSO' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "ESTATUTO - IDOSO" FOR UPDATE USING (true);
  END IF;

  -- ESTATUTO - OAB
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ESTATUTO - OAB' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "ESTATUTO - OAB" FOR UPDATE USING (true);
  END IF;

  -- ESTATUTO - DESARMAMENTO
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ESTATUTO - DESARMAMENTO' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "ESTATUTO - DESARMAMENTO" FOR UPDATE USING (true);
  END IF;

  -- ESTATUTO - IGUALDADE RACIAL
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ESTATUTO - IGUALDADE RACIAL' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "ESTATUTO - IGUALDADE RACIAL" FOR UPDATE USING (true);
  END IF;

  -- ESTATUTO - PESSOA COM DEFICIÊNCIA
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ESTATUTO - PESSOA COM DEFICIÊNCIA' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "ESTATUTO - PESSOA COM DEFICIÊNCIA" FOR UPDATE USING (true);
  END IF;

  -- ESTATUTO - CIDADE
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ESTATUTO - CIDADE' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "ESTATUTO - CIDADE" FOR UPDATE USING (true);
  END IF;

  -- ESTATUTO - TORCEDOR
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ESTATUTO - TORCEDOR' AND policyname = 'Sistema pode atualizar conteúdo gerado') THEN
    CREATE POLICY "Sistema pode atualizar conteúdo gerado" ON "ESTATUTO - TORCEDOR" FOR UPDATE USING (true);
  END IF;
END $$;