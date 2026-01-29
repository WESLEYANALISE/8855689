-- Habilitar RLS na tabela da Lei de Drogas
ALTER TABLE "Lei 11.343 de 2006 - Lei de Drogas" ENABLE ROW LEVEL SECURITY;

-- Criar política para leitura pública
CREATE POLICY "Lei de Drogas é público para leitura"
ON "Lei 11.343 de 2006 - Lei de Drogas"
FOR SELECT
USING (true);

-- Criar política para sistema atualizar conteúdo gerado
CREATE POLICY "Sistema pode atualizar conteúdo gerado Lei de Drogas"
ON "Lei 11.343 de 2006 - Lei de Drogas"
FOR UPDATE
USING (true);