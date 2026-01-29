-- Criar política de INSERT para EST - Estatuto do Índio
CREATE POLICY "Sistema pode inserir" 
ON public."EST - Estatuto do Índio" 
FOR INSERT 
WITH CHECK (true);