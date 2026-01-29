-- Reestruturar tabela Lei 13.964 de 2019 - Pacote Anticrime para seguir padrão das outras leis

-- Remover colunas específicas de alterações que não são usadas no padrão
ALTER TABLE "Lei 13.964 de 2019 - Pacote Anticrime" 
  DROP COLUMN IF EXISTS "Lei Alterada",
  DROP COLUMN IF EXISTS "Artigo Modificado",
  DROP COLUMN IF EXISTS "Tipo de Alteração",
  DROP COLUMN IF EXISTS "Texto Original",
  DROP COLUMN IF EXISTS "Texto Novo";

-- Adicionar colunas padrão que podem estar faltando
ALTER TABLE "Lei 13.964 de 2019 - Pacote Anticrime" 
  ADD COLUMN IF NOT EXISTS "Número do Artigo" text,
  ADD COLUMN IF NOT EXISTS "Artigo" text,
  ADD COLUMN IF NOT EXISTS "Narração" text,
  ADD COLUMN IF NOT EXISTS "Comentario" text,
  ADD COLUMN IF NOT EXISTS "Aula" text,
  ADD COLUMN IF NOT EXISTS explicacao_tecnico text,
  ADD COLUMN IF NOT EXISTS explicacao_resumido text,
  ADD COLUMN IF NOT EXISTS explicacao_simples_menor16 text,
  ADD COLUMN IF NOT EXISTS explicacao_simples_maior16 text,
  ADD COLUMN IF NOT EXISTS exemplo text,
  ADD COLUMN IF NOT EXISTS termos jsonb,
  ADD COLUMN IF NOT EXISTS flashcards jsonb,
  ADD COLUMN IF NOT EXISTS questoes jsonb,
  ADD COLUMN IF NOT EXISTS ultima_atualizacao timestamp without time zone,
  ADD COLUMN IF NOT EXISTS versao_conteudo integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS termos_aprofundados jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_visualizacao timestamp with time zone;

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE "Lei 13.964 de 2019 - Pacote Anticrime" ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso (leitura pública e atualização pelo sistema)
DROP POLICY IF EXISTS "Pacote Anticrime é público para leitura" ON "Lei 13.964 de 2019 - Pacote Anticrime";
CREATE POLICY "Pacote Anticrime é público para leitura"
  ON "Lei 13.964 de 2019 - Pacote Anticrime"
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Sistema pode atualizar Pacote Anticrime" ON "Lei 13.964 de 2019 - Pacote Anticrime";
CREATE POLICY "Sistema pode atualizar Pacote Anticrime"
  ON "Lei 13.964 de 2019 - Pacote Anticrime"
  FOR UPDATE
  USING (true);