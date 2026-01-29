-- Criar tabelas para Leis Ordinárias

-- 1. Lei de Improbidade Administrativa (Lei 8.429/1992)
CREATE TABLE IF NOT EXISTS "LEI 8429 - IMPROBIDADE" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 8429 - IMPROBIDADE" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 8429 é pública" ON "LEI 8429 - IMPROBIDADE" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 8429" ON "LEI 8429 - IMPROBIDADE" FOR UPDATE USING (true);

-- 2. Nova Lei de Licitações (Lei 14.133/2021)
CREATE TABLE IF NOT EXISTS "LEI 14133 - LICITACOES" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 14133 - LICITACOES" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 14133 é pública" ON "LEI 14133 - LICITACOES" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 14133" ON "LEI 14133 - LICITACOES" FOR UPDATE USING (true);

-- 3. Ação Civil Pública (Lei 7.347/1985)
CREATE TABLE IF NOT EXISTS "LEI 7347 - ACAO CIVIL PUBLICA" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 7347 - ACAO CIVIL PUBLICA" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 7347 é pública" ON "LEI 7347 - ACAO CIVIL PUBLICA" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 7347" ON "LEI 7347 - ACAO CIVIL PUBLICA" FOR UPDATE USING (true);

-- 4. LGPD (Lei 13.709/2018)
CREATE TABLE IF NOT EXISTS "LEI 13709 - LGPD" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 13709 - LGPD" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 13709 é pública" ON "LEI 13709 - LGPD" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 13709" ON "LEI 13709 - LGPD" FOR UPDATE USING (true);

-- 5. Lei de Responsabilidade Fiscal (LC 101/2000)
CREATE TABLE IF NOT EXISTS "LC 101 - LRF" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LC 101 - LRF" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LC 101 é pública" ON "LC 101 - LRF" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar LC 101" ON "LC 101 - LRF" FOR UPDATE USING (true);

-- 6. Processo Administrativo (Lei 9.784/1999)
CREATE TABLE IF NOT EXISTS "LEI 9784 - PROCESSO ADMINISTRATIVO" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 9784 - PROCESSO ADMINISTRATIVO" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 9784 é pública" ON "LEI 9784 - PROCESSO ADMINISTRATIVO" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 9784" ON "LEI 9784 - PROCESSO ADMINISTRATIVO" FOR UPDATE USING (true);

-- 7. Lei de Acesso à Informação (Lei 12.527/2011)
CREATE TABLE IF NOT EXISTS "LEI 12527 - ACESSO INFORMACAO" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 12527 - ACESSO INFORMACAO" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 12527 é pública" ON "LEI 12527 - ACESSO INFORMACAO" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 12527" ON "LEI 12527 - ACESSO INFORMACAO" FOR UPDATE USING (true);

-- 8. Legislação Tributária (Lei 9.430/1996)
CREATE TABLE IF NOT EXISTS "LEI 9430 - LEGISLACAO TRIBUTARIA" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 9430 - LEGISLACAO TRIBUTARIA" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 9430 é pública" ON "LEI 9430 - LEGISLACAO TRIBUTARIA" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 9430" ON "LEI 9430 - LEGISLACAO TRIBUTARIA" FOR UPDATE USING (true);

-- 9. Licitações Antiga (Lei 8.666/1993)
CREATE TABLE IF NOT EXISTS "LEI 8666 - LICITACOES ANTIGA" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 8666 - LICITACOES ANTIGA" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 8666 é pública" ON "LEI 8666 - LICITACOES ANTIGA" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 8666" ON "LEI 8666 - LICITACOES ANTIGA" FOR UPDATE USING (true);

-- 10. Registros Públicos (Lei 6.015/1973)
CREATE TABLE IF NOT EXISTS "LEI 6015 - REGISTROS PUBLICOS" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 6015 - REGISTROS PUBLICOS" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 6015 é pública" ON "LEI 6015 - REGISTROS PUBLICOS" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 6015" ON "LEI 6015 - REGISTROS PUBLICOS" FOR UPDATE USING (true);

-- 11. Juizados Especiais Cíveis (Lei 9.099/1995) - já existe como penal
CREATE TABLE IF NOT EXISTS "LEI 9099 - JUIZADOS CIVEIS" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 9099 - JUIZADOS CIVEIS" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 9099 Cível é pública" ON "LEI 9099 - JUIZADOS CIVEIS" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 9099 Cível" ON "LEI 9099 - JUIZADOS CIVEIS" FOR UPDATE USING (true);

-- 12. Ação Popular (Lei 4.717/1965)
CREATE TABLE IF NOT EXISTS "LEI 4717 - ACAO POPULAR" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 4717 - ACAO POPULAR" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 4717 é pública" ON "LEI 4717 - ACAO POPULAR" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 4717" ON "LEI 4717 - ACAO POPULAR" FOR UPDATE USING (true);

-- 13. Lei Anticorrupção (Lei 12.846/2013)
CREATE TABLE IF NOT EXISTS "LEI 12846 - ANTICORRUPCAO" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 12846 - ANTICORRUPCAO" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 12846 é pública" ON "LEI 12846 - ANTICORRUPCAO" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 12846" ON "LEI 12846 - ANTICORRUPCAO" FOR UPDATE USING (true);

-- 14. Lei de Mediação (Lei 13.140/2015)
CREATE TABLE IF NOT EXISTS "LEI 13140 - MEDIACAO" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 13140 - MEDIACAO" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 13140 é pública" ON "LEI 13140 - MEDIACAO" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 13140" ON "LEI 13140 - MEDIACAO" FOR UPDATE USING (true);

-- 15. ADI e ADC (Lei 9.868/1999)
CREATE TABLE IF NOT EXISTS "LEI 9868 - ADI E ADC" (
  id SERIAL PRIMARY KEY,
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
  versao_conteudo INTEGER DEFAULT 1,
  termos JSONB,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb,
  flashcards JSONB,
  questoes JSONB,
  ultima_atualizacao TIMESTAMP WITHOUT TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "LEI 9868 - ADI E ADC" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lei 9868 é pública" ON "LEI 9868 - ADI E ADC" FOR SELECT USING (true);
CREATE POLICY "Sistema pode atualizar Lei 9868" ON "LEI 9868 - ADI E ADC" FOR UPDATE USING (true);