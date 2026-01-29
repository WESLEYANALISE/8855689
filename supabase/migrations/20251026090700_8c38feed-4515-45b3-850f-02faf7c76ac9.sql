-- Criar tabela de favoritos de estágios
CREATE TABLE IF NOT EXISTS public.estagios_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vaga_id UUID NOT NULL REFERENCES public.estagios_vagas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, vaga_id)
);

-- Habilitar RLS
ALTER TABLE public.estagios_favoritos ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios favoritos
CREATE POLICY "Usuários veem apenas seus favoritos"
ON public.estagios_favoritos
FOR SELECT
USING (true);

-- Política para usuários inserirem seus próprios favoritos
CREATE POLICY "Usuários podem adicionar favoritos"
ON public.estagios_favoritos
FOR INSERT
WITH CHECK (true);

-- Política para usuários removerem seus próprios favoritos
CREATE POLICY "Usuários podem remover seus favoritos"
ON public.estagios_favoritos
FOR DELETE
USING (true);

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_estagios_favoritos_user_id ON public.estagios_favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_estagios_favoritos_vaga_id ON public.estagios_favoritos(vaga_id);