-- Remover a política restritiva atual
DROP POLICY IF EXISTS "Leis publicadas são visíveis para todos" ON public.leis_push;

-- Criar nova política que permite visualizar todas as leis (pendente, aprovado e publicado)
CREATE POLICY "Leis são visíveis para todos" 
ON public.leis_push 
FOR SELECT 
USING (true);