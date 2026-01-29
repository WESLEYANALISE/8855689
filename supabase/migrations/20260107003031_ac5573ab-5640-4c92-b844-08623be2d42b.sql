-- Criar função para verificar se é admin (SECURITY DEFINER para evitar recursão)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND email = 'wn7corporation@gmail.com'
  )
$$;

-- Remover política antiga problemática
DROP POLICY IF EXISTS "Usuarios e admin podem ver perfis" ON public.profiles;

-- Criar nova política usando a função SECURITY DEFINER
CREATE POLICY "Usuarios e admin podem ver perfis"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR public.is_admin(auth.uid())
);