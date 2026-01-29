-- Criar tabela para Lei de Lavagem de Dinheiro
CREATE TABLE "LLD - Lei de Lavagem de Dinheiro" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "Artigo" text,
  "Número do Artigo" text,
  "Narração" text,
  "Comentario" text,
  "Aula" text,
  explicacao_tecnico text,
  explicacao_resumido text,
  explicacao_simples_menor16 text,
  explicacao_simples_maior16 text,
  exemplo text,
  questoes jsonb,
  flashcards jsonb,
  termos jsonb,
  versao_conteudo integer DEFAULT 1,
  ultima_visualizacao timestamp with time zone,
  visualizacoes integer DEFAULT 0,
  termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  ultima_atualizacao timestamp without time zone
);

-- Enable RLS
ALTER TABLE "LLD - Lei de Lavagem de Dinheiro" ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Lei de Lavagem de Dinheiro é público para leitura"
ON "LLD - Lei de Lavagem de Dinheiro"
FOR SELECT
USING (true);

-- Política para sistema atualizar conteúdo gerado
CREATE POLICY "Sistema pode atualizar LLD"
ON "LLD - Lei de Lavagem de Dinheiro"
FOR UPDATE
USING (true);