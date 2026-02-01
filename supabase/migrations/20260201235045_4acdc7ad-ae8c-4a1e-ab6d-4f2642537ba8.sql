-- Tabela para armazenar capas por código (CP, CC, CF, etc)
-- Cada código terá apenas UMA capa reutilizada para todos os artigos

CREATE TABLE IF NOT EXISTS public.codigos_capas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_tabela TEXT NOT NULL UNIQUE,  -- Ex: "CP", "CC", "CF"
  codigo_nome TEXT NOT NULL,            -- Ex: "Código Penal", "Código Civil"
  capa_url TEXT,                        -- URL da capa gerada
  capa_prompt TEXT,                     -- Prompt usado para gerar
  status TEXT DEFAULT 'pendente',       -- pendente, gerando, concluido, erro
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS - Permitir leitura pública (capas são públicas)
ALTER TABLE public.codigos_capas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Capas de códigos são visíveis para todos"
  ON public.codigos_capas
  FOR SELECT
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_codigos_capas_updated_at
  BEFORE UPDATE ON public.codigos_capas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();