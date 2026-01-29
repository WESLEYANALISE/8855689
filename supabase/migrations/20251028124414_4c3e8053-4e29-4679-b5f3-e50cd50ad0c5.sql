-- Criar tabela para controlar exibição do modal de avaliação
CREATE TABLE public.app_rating_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_ip text NOT NULL,
  last_shown_date date NOT NULL DEFAULT CURRENT_DATE,
  user_rated boolean DEFAULT false,
  device_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_ip UNIQUE (user_ip)
);

-- Habilitar RLS
ALTER TABLE public.app_rating_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (sem autenticação)
CREATE POLICY "Permitir leitura pública" 
ON public.app_rating_tracking
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública" 
ON public.app_rating_tracking
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública" 
ON public.app_rating_tracking
FOR UPDATE 
USING (true);

-- Índice para melhorar performance de busca por IP
CREATE INDEX idx_user_ip ON public.app_rating_tracking(user_ip);