-- Atualizar o email do admin no profiles
UPDATE public.profiles 
SET email = 'wn7corporation@gmail.com' 
WHERE id = '372b4f7f-9450-4fa4-83ee-84988c2586eb';

-- Também criar uma política mais robusta que busca o email direto do auth.users
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
      AND email = 'wn7corporation@gmail.com'
  )
$$;