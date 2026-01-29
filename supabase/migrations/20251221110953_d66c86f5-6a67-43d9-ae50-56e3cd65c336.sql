-- Tabela para armazenar experiências de aprendizado personalizadas
CREATE TABLE public.experiencias_aprendizado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  titulo TEXT NOT NULL,
  fonte_tipo TEXT NOT NULL CHECK (fonte_tipo IN ('pdf', 'lei', 'artigo', 'codigo', 'resumo')),
  fonte_id TEXT,
  fonte_conteudo TEXT,
  nivel TEXT NOT NULL DEFAULT 'intermediario' CHECK (nivel IN ('iniciante', 'intermediario', 'avancado', 'concurseiro')),
  interesses TEXT[] DEFAULT '{}',
  
  -- Conteúdo gerado (cada formato é um JSONB)
  texto_imersivo JSONB,
  quizzes JSONB,
  slides_narrados JSONB,
  audio_conversacional JSONB,
  mapa_mental JSONB,
  
  -- Metadados de geração
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerando', 'concluido', 'erro')),
  formatos_gerados TEXT[] DEFAULT '{}',
  erro_mensagem TEXT,
  
  -- Progresso do usuário
  progresso JSONB DEFAULT '{"texto": 0, "quiz": 0, "slides": 0, "audio": 0, "mapa": 0}'::jsonb,
  tempo_estudo_minutos INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_experiencias_user_id ON public.experiencias_aprendizado(user_id);
CREATE INDEX idx_experiencias_fonte ON public.experiencias_aprendizado(fonte_tipo, fonte_id);
CREATE INDEX idx_experiencias_status ON public.experiencias_aprendizado(status);
CREATE INDEX idx_experiencias_created ON public.experiencias_aprendizado(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.experiencias_aprendizado ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - acesso público para leitura (usuários não logados podem ver experiências públicas)
CREATE POLICY "Experiências são visíveis publicamente" 
ON public.experiencias_aprendizado 
FOR SELECT 
USING (true);

-- Políticas para insert/update/delete
CREATE POLICY "Usuários podem criar experiências" 
ON public.experiencias_aprendizado 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas experiências" 
ON public.experiencias_aprendizado 
FOR UPDATE 
USING (true);

CREATE POLICY "Usuários podem deletar suas experiências" 
ON public.experiencias_aprendizado 
FOR DELETE 
USING (user_id IS NULL OR user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_experiencias_aprendizado_updated_at
BEFORE UPDATE ON public.experiencias_aprendizado
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();