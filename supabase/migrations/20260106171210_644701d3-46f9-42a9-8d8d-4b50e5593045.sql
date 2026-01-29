-- Tabela para armazenar usuários banidos
CREATE TABLE public.usuarios_banidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  telefone TEXT,
  motivo TEXT,
  banido_por TEXT,
  user_id_original UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_usuarios_banidos_email ON public.usuarios_banidos(email);
CREATE INDEX idx_usuarios_banidos_telefone ON public.usuarios_banidos(telefone);

-- Enable RLS
ALTER TABLE public.usuarios_banidos ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver/modificar (via service role)
CREATE POLICY "Service role full access" 
ON public.usuarios_banidos 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Função para verificar se email ou telefone está banido
CREATE OR REPLACE FUNCTION public.verificar_banimento(p_email TEXT DEFAULT NULL, p_telefone TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios_banidos 
    WHERE (p_email IS NOT NULL AND email = p_email)
       OR (p_telefone IS NOT NULL AND telefone = p_telefone)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;