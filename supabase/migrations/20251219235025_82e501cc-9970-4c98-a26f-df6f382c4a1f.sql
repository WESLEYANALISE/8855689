-- Adicionar política de INSERT para a tabela EST - Estatuto da Migração
CREATE POLICY "Sistema pode inserir" 
ON public."EST - Estatuto da Migração" 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Adicionar política de DELETE para permitir gestão completa
CREATE POLICY "Sistema pode deletar" 
ON public."EST - Estatuto da Migração" 
FOR DELETE 
TO public 
USING (true);