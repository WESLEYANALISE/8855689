-- Criar tabela para armazenar concursos abertos
CREATE TABLE public."CONCURSOS_ABERTOS" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo TEXT,
  imagem TEXT,
  link TEXT NOT NULL,
  data_publicacao DATE,
  regiao TEXT,
  estado TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_concurso_link UNIQUE (link)
);

-- Enable RLS
ALTER TABLE public."CONCURSOS_ABERTOS" ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Concursos são públicos para leitura" 
ON public."CONCURSOS_ABERTOS" 
FOR SELECT 
USING (true);

-- Política para inserção pública (via edge function)
CREATE POLICY "Permitir inserção de concursos" 
ON public."CONCURSOS_ABERTOS" 
FOR INSERT 
WITH CHECK (true);

-- Política para atualização pública (via edge function)
CREATE POLICY "Permitir atualização de concursos" 
ON public."CONCURSOS_ABERTOS" 
FOR UPDATE 
USING (true);

-- Criar índices para performance
CREATE INDEX idx_concursos_regiao ON public."CONCURSOS_ABERTOS" (regiao);
CREATE INDEX idx_concursos_data ON public."CONCURSOS_ABERTOS" (data_publicacao DESC);
CREATE INDEX idx_concursos_created ON public."CONCURSOS_ABERTOS" (created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_concursos_abertos_updated_at
BEFORE UPDATE ON public."CONCURSOS_ABERTOS"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();