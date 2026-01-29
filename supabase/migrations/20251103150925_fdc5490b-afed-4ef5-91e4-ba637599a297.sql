-- Criar tabela CPM - Código Penal Militar
CREATE TABLE IF NOT EXISTS "CPM – Código Penal Militar" (
  id BIGSERIAL PRIMARY KEY,
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

-- Criar tabela CPPM - Código de Processo Penal Militar
CREATE TABLE IF NOT EXISTS "CPPM – Código de Processo Penal Militar" (
  id BIGSERIAL PRIMARY KEY,
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

-- Enable RLS
ALTER TABLE "CPM – Código Penal Militar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CPPM – Código de Processo Penal Militar" ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "CPM é público para leitura" 
ON "CPM – Código Penal Militar" 
FOR SELECT 
USING (true);

CREATE POLICY "Sistema pode atualizar CPM" 
ON "CPM – Código Penal Militar" 
FOR UPDATE 
USING (true);

CREATE POLICY "CPPM é público para leitura" 
ON "CPPM – Código de Processo Penal Militar" 
FOR SELECT 
USING (true);

CREATE POLICY "Sistema pode atualizar CPPM" 
ON "CPPM – Código de Processo Penal Militar" 
FOR UPDATE 
USING (true);