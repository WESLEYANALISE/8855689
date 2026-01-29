-- Criar tabela para armazenar resumos de obras dos filósofos
CREATE TABLE public.obras_filosofos_resumos (
  id SERIAL PRIMARY KEY,
  filosofo TEXT NOT NULL,
  titulo_obra TEXT NOT NULL,
  titulo_original TEXT,
  ano TEXT,
  resumo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(filosofo, titulo_obra)
);

-- Habilitar RLS
ALTER TABLE public.obras_filosofos_resumos ENABLE ROW LEVEL SECURITY;

-- Política pública de leitura (todos podem ler)
CREATE POLICY "Permitir leitura pública de resumos de obras"
ON public.obras_filosofos_resumos
FOR SELECT
USING (true);

-- Política de inserção via service role
CREATE POLICY "Permitir inserção de resumos"
ON public.obras_filosofos_resumos
FOR INSERT
WITH CHECK (true);

-- Índices para busca rápida
CREATE INDEX idx_obras_filosofos_resumos_filosofo ON public.obras_filosofos_resumos(filosofo);
CREATE INDEX idx_obras_filosofos_resumos_titulo ON public.obras_filosofos_resumos(titulo_obra);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_obras_filosofos_resumos_updated_at
  BEFORE UPDATE ON public.obras_filosofos_resumos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();