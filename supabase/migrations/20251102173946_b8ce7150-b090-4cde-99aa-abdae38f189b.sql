-- Criar 8 tabelas para Legislação Penal Especial com estrutura idêntica às existentes

-- 1. LEP - Lei de Execução Penal (Lei 7.210/1984)
CREATE TABLE "LEP - Lei 7.210/1984" (
  id BIGINT PRIMARY KEY,
  "Número do Artigo" TEXT,
  "Artigo" TEXT,
  "Narração" TEXT,
  "Comentario" TEXT,
  "Aula" TEXT,
  explicacao_tecnico TEXT,
  explicacao_resumido TEXT,
  explicacao_simples_menor16 TEXT,
  explicacao_simples_maior16 TEXT,
  exemplo TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE "LEP - Lei 7.210/1984" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para LEP
CREATE POLICY "Leitura pública LEP"
  ON "LEP - Lei 7.210/1984"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar LEP"
  ON "LEP - Lei 7.210/1984"
  FOR UPDATE
  USING (true);

-- 2. Lei 9.099/1995 - Juizados Especiais
CREATE TABLE "Lei 9.099/1995 - Juizados Especiais" (
  id BIGINT PRIMARY KEY,
  "Número do Artigo" TEXT,
  "Artigo" TEXT,
  "Narração" TEXT,
  "Comentario" TEXT,
  "Aula" TEXT,
  explicacao_tecnico TEXT,
  explicacao_resumido TEXT,
  explicacao_simples_menor16 TEXT,
  explicacao_simples_maior16 TEXT,
  exemplo TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "Lei 9.099/1995 - Juizados Especiais" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública Juizados"
  ON "Lei 9.099/1995 - Juizados Especiais"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Juizados"
  ON "Lei 9.099/1995 - Juizados Especiais"
  FOR UPDATE
  USING (true);

-- 3. Lei 11.343/2006 - Lei de Drogas
CREATE TABLE "Lei 11.343/2006 - Lei de Drogas" (
  id BIGINT PRIMARY KEY,
  "Número do Artigo" TEXT,
  "Artigo" TEXT,
  "Narração" TEXT,
  "Comentario" TEXT,
  "Aula" TEXT,
  explicacao_tecnico TEXT,
  explicacao_resumido TEXT,
  explicacao_simples_menor16 TEXT,
  explicacao_simples_maior16 TEXT,
  exemplo TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "Lei 11.343/2006 - Lei de Drogas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública Drogas"
  ON "Lei 11.343/2006 - Lei de Drogas"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Drogas"
  ON "Lei 11.343/2006 - Lei de Drogas"
  FOR UPDATE
  USING (true);

-- 4. Lei 11.340/2006 - Maria da Penha
CREATE TABLE "Lei 11.340/2006 - Maria da Penha" (
  id BIGINT PRIMARY KEY,
  "Número do Artigo" TEXT,
  "Artigo" TEXT,
  "Narração" TEXT,
  "Comentario" TEXT,
  "Aula" TEXT,
  explicacao_tecnico TEXT,
  explicacao_resumido TEXT,
  explicacao_simples_menor16 TEXT,
  explicacao_simples_maior16 TEXT,
  exemplo TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "Lei 11.340/2006 - Maria da Penha" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública Maria da Penha"
  ON "Lei 11.340/2006 - Maria da Penha"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Maria da Penha"
  ON "Lei 11.340/2006 - Maria da Penha"
  FOR UPDATE
  USING (true);

-- 5. Lei 8.072/1990 - Crimes Hediondos
CREATE TABLE "Lei 8.072/1990 - Crimes Hediondos" (
  id BIGINT PRIMARY KEY,
  "Número do Artigo" TEXT,
  "Artigo" TEXT,
  "Narração" TEXT,
  "Comentario" TEXT,
  "Aula" TEXT,
  explicacao_tecnico TEXT,
  explicacao_resumido TEXT,
  explicacao_simples_menor16 TEXT,
  explicacao_simples_maior16 TEXT,
  exemplo TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "Lei 8.072/1990 - Crimes Hediondos" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública Crimes Hediondos"
  ON "Lei 8.072/1990 - Crimes Hediondos"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Crimes Hediondos"
  ON "Lei 8.072/1990 - Crimes Hediondos"
  FOR UPDATE
  USING (true);

-- 6. Lei 9.455/1997 - Tortura
CREATE TABLE "Lei 9.455/1997 - Tortura" (
  id BIGINT PRIMARY KEY,
  "Número do Artigo" TEXT,
  "Artigo" TEXT,
  "Narração" TEXT,
  "Comentario" TEXT,
  "Aula" TEXT,
  explicacao_tecnico TEXT,
  explicacao_resumido TEXT,
  explicacao_simples_menor16 TEXT,
  explicacao_simples_maior16 TEXT,
  exemplo TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "Lei 9.455/1997 - Tortura" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública Tortura"
  ON "Lei 9.455/1997 - Tortura"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Tortura"
  ON "Lei 9.455/1997 - Tortura"
  FOR UPDATE
  USING (true);

-- 7. Lei 9.296/1996 - Interceptação Telefônica
CREATE TABLE "Lei 9.296/1996 - Interceptação Telefônica" (
  id BIGINT PRIMARY KEY,
  "Número do Artigo" TEXT,
  "Artigo" TEXT,
  "Narração" TEXT,
  "Comentario" TEXT,
  "Aula" TEXT,
  explicacao_tecnico TEXT,
  explicacao_resumido TEXT,
  explicacao_simples_menor16 TEXT,
  explicacao_simples_maior16 TEXT,
  exemplo TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "Lei 9.296/1996 - Interceptação Telefônica" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública Interceptação"
  ON "Lei 9.296/1996 - Interceptação Telefônica"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Interceptação"
  ON "Lei 9.296/1996 - Interceptação Telefônica"
  FOR UPDATE
  USING (true);

-- 8. Lei 12.850/2013 - Organizações Criminosas
CREATE TABLE "Lei 12.850/2013 - Organizações Criminosas" (
  id BIGINT PRIMARY KEY,
  "Número do Artigo" TEXT,
  "Artigo" TEXT,
  "Narração" TEXT,
  "Comentario" TEXT,
  "Aula" TEXT,
  explicacao_tecnico TEXT,
  explicacao_resumido TEXT,
  explicacao_simples_menor16 TEXT,
  explicacao_simples_maior16 TEXT,
  exemplo TEXT,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "Lei 12.850/2013 - Organizações Criminosas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública Org Criminosas"
  ON "Lei 12.850/2013 - Organizações Criminosas"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Org Criminosas"
  ON "Lei 12.850/2013 - Organizações Criminosas"
  FOR UPDATE
  USING (true);