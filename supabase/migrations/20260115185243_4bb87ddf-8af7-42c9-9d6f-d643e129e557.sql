-- Criar tabela BIBLIOTECA-PORTUGUES
CREATE TABLE "BIBLIOTECA-PORTUGUES" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  area TEXT,
  livro TEXT,
  autor TEXT,
  link TEXT,
  imagem TEXT,
  sobre TEXT,
  beneficios TEXT,
  download TEXT,
  aula TEXT,
  "Capa-area" TEXT,
  questoes_resumo JSONB,
  resumo_capitulos JSONB,
  resumo_gerado_em TIMESTAMPTZ
);

-- Criar tabela BIBLIOTECA-PESQUISA-CIENTIFICA
CREATE TABLE "BIBLIOTECA-PESQUISA-CIENTIFICA" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  area TEXT,
  livro TEXT,
  autor TEXT,
  link TEXT,
  imagem TEXT,
  sobre TEXT,
  beneficios TEXT,
  download TEXT,
  aula TEXT,
  "Capa-area" TEXT,
  questoes_resumo JSONB,
  resumo_capitulos JSONB,
  resumo_gerado_em TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE "BIBLIOTECA-PORTUGUES" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BIBLIOTECA-PESQUISA-CIENTIFICA" ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Leitura pública português" ON "BIBLIOTECA-PORTUGUES" FOR SELECT USING (true);
CREATE POLICY "Leitura pública pesquisa" ON "BIBLIOTECA-PESQUISA-CIENTIFICA" FOR SELECT USING (true);

-- Inserir capas para as novas bibliotecas
INSERT INTO "CAPA-BIBILIOTECA" (id, "Biblioteca", capa) VALUES 
(100, 'Biblioteca de Português', NULL),
(101, 'Biblioteca de Pesquisa Científica', NULL);