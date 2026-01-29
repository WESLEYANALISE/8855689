-- Criar tabela para armazenar tutoriais do app
CREATE TABLE public.tutoriais_app (
  id SERIAL PRIMARY KEY,
  secao TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT 'HelpCircle',
  passos JSONB NOT NULL DEFAULT '[]',
  screenshot_principal TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por seção
CREATE INDEX idx_tutoriais_app_secao ON public.tutoriais_app(secao);

-- RLS - Leitura pública
ALTER TABLE public.tutoriais_app ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutoriais são públicos para leitura"
ON public.tutoriais_app
FOR SELECT
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_tutoriais_app_updated_at
BEFORE UPDATE ON public.tutoriais_app
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();