-- Adicionar coluna autorizado na tabela evelyn_usuarios
ALTER TABLE public.evelyn_usuarios 
ADD COLUMN IF NOT EXISTS autorizado BOOLEAN DEFAULT false;

-- Autorizar usuários existentes (que já usaram o sistema)
UPDATE public.evelyn_usuarios 
SET autorizado = true 
WHERE autorizado IS NULL OR total_mensagens > 0;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_evelyn_usuarios_autorizado 
ON public.evelyn_usuarios(autorizado);