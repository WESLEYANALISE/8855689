-- Adicionar política RLS para leitura pública da Lei Maria da Penha
CREATE POLICY "Lei Maria da Penha é público para leitura"
ON "Lei 11.340/2006 - Maria da Penha"
FOR SELECT
TO public
USING (true);

-- Adicionar política para permitir atualizações do sistema
CREATE POLICY "Sistema pode atualizar conteúdo gerado Maria da Penha"
ON "Lei 11.340/2006 - Maria da Penha"
FOR UPDATE
TO public
USING (true);