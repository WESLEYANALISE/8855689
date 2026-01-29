-- Tabela para rastrear progresso de videoaulas
CREATE TABLE public.videoaulas_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  tempo_atual INTEGER DEFAULT 0,
  duracao_total INTEGER DEFAULT 0,
  percentual NUMERIC DEFAULT 0,
  assistido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tabela, registro_id)
);

-- Enable RLS
ALTER TABLE public.videoaulas_progresso ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own progress"
ON public.videoaulas_progresso
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.videoaulas_progresso
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.videoaulas_progresso
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_videoaulas_progresso_updated_at
BEFORE UPDATE ON public.videoaulas_progresso
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();