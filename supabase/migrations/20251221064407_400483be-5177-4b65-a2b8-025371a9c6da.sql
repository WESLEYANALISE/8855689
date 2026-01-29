-- Criar política de INSERT para EST - Estatuto da Juventude
CREATE POLICY "Sistema pode inserir" 
ON public."EST - Estatuto da Juventude" 
FOR INSERT 
WITH CHECK (true);