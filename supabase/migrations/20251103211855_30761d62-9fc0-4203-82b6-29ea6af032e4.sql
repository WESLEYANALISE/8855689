-- Adicionar política de INSERT para a tabela LEI 8429 - IMPROBIDADE
CREATE POLICY "Permitir inserção de artigos"
ON "LEI 8429 - IMPROBIDADE"
FOR INSERT
TO public
WITH CHECK (true);