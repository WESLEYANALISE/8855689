-- Criar tabela para Lei de Benefícios da Previdência Social (Lei 8.213/91)
CREATE TABLE "LEI 8213 - Benefícios" (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
  ultima_atualizacao TIMESTAMP,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb
);

-- Criar tabela para Lei de Custeio da Previdência Social (Lei 8.212/91)
CREATE TABLE "LEI 8212 - Custeio" (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
  ultima_atualizacao TIMESTAMP,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE,
  versao_conteudo INTEGER DEFAULT 1,
  termos_aprofundados JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS nas tabelas
ALTER TABLE "LEI 8213 - Benefícios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LEI 8212 - Custeio" ENABLE ROW LEVEL SECURITY;

-- Criar políticas de SELECT público para Lei de Benefícios
CREATE POLICY "Lei de Benefícios é pública para leitura"
  ON "LEI 8213 - Benefícios"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Lei de Benefícios"
  ON "LEI 8213 - Benefícios"
  FOR UPDATE
  USING (true);

-- Criar políticas de SELECT público para Lei de Custeio
CREATE POLICY "Lei de Custeio é pública para leitura"
  ON "LEI 8212 - Custeio"
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode atualizar Lei de Custeio"
  ON "LEI 8212 - Custeio"
  FOR UPDATE
  USING (true);