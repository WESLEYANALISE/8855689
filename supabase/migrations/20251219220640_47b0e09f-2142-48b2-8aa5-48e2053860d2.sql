-- Adicionar política de INSERT para a tabela CP - Código de Pesca
CREATE POLICY "Sistema pode inserir" 
ON public."CP - Código de Pesca" 
FOR INSERT 
WITH CHECK (true);

-- Adicionar política de DELETE para a tabela (caso precise limpar)
CREATE POLICY "Sistema pode deletar" 
ON public."CP - Código de Pesca" 
FOR DELETE 
USING (true);