-- Adicionar colunas para cache de artigos melhorados na tabela ESTAGIO-BLOG
ALTER TABLE "ESTAGIO-BLOG" 
ADD COLUMN IF NOT EXISTS artigo_melhorado TEXT,
ADD COLUMN IF NOT EXISTS gerado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cache_validade TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_estagio_blog_cache_validade ON "ESTAGIO-BLOG"(cache_validade);
CREATE INDEX IF NOT EXISTS idx_estagio_blog_numero ON "ESTAGIO-BLOG"("Nº");

-- RLS policies para a tabela
ALTER TABLE "ESTAGIO-BLOG" ENABLE ROW LEVEL SECURITY;

-- Policy de leitura pública
DROP POLICY IF EXISTS "Artigos de estágio são públicos" ON "ESTAGIO-BLOG";
CREATE POLICY "Artigos de estágio são públicos" 
ON "ESTAGIO-BLOG" 
FOR SELECT 
USING (true);

-- Policy para sistema atualizar artigos gerados
DROP POLICY IF EXISTS "Sistema pode atualizar artigos" ON "ESTAGIO-BLOG";
CREATE POLICY "Sistema pode atualizar artigos" 
ON "ESTAGIO-BLOG" 
FOR UPDATE 
USING (true);