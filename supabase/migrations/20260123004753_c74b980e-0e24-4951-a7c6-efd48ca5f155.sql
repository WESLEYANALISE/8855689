-- Tabela para tracking de progresso de estudo nas Trilhas OAB
CREATE TABLE IF NOT EXISTS public.oab_trilhas_estudo_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topico_id INTEGER NOT NULL,
  leitura_completa BOOLEAN DEFAULT false,
  flashcards_completos BOOLEAN DEFAULT false,
  pratica_completa BOOLEAN DEFAULT false,
  progresso_leitura INTEGER DEFAULT 0,
  progresso_flashcards INTEGER DEFAULT 0,
  progresso_questoes INTEGER DEFAULT 0,
  ultimo_topico_lido INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, topico_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_oab_trilhas_progresso_user ON public.oab_trilhas_estudo_progresso(user_id);
CREATE INDEX IF NOT EXISTS idx_oab_trilhas_progresso_topico ON public.oab_trilhas_estudo_progresso(topico_id);

-- Enable RLS
ALTER TABLE public.oab_trilhas_estudo_progresso ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own progress" 
ON public.oab_trilhas_estudo_progresso 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.oab_trilhas_estudo_progresso 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.oab_trilhas_estudo_progresso 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_oab_trilhas_progresso_updated_at
BEFORE UPDATE ON public.oab_trilhas_estudo_progresso
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();