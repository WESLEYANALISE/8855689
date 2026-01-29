-- Remover política antiga de SELECT
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON profiles;

-- Criar política que permite:
-- 1. Usuário ver seu próprio perfil
-- 2. Admin (wn7corporation@gmail.com) ver todos os perfis
CREATE POLICY "Usuarios e admin podem ver perfis" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND email = 'wn7corporation@gmail.com'
  )
);