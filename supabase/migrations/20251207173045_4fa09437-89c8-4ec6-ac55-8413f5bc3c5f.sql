-- Criar tabela para armazenar capas das áreas de flashcards
CREATE TABLE public.flashcards_areas_capas (
  id SERIAL PRIMARY KEY,
  area TEXT NOT NULL UNIQUE,
  url_capa TEXT,
  total_flashcards INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.flashcards_areas_capas ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Capas de flashcards são públicas"
ON public.flashcards_areas_capas
FOR SELECT
USING (true);

-- Política para inserção/atualização via service role
CREATE POLICY "Service role pode gerenciar capas"
ON public.flashcards_areas_capas
FOR ALL
USING (true);

-- Inserir as áreas existentes
INSERT INTO public.flashcards_areas_capas (area) VALUES
  ('Direito Ambiental'),
  ('Direito Civil'),
  ('Direito Constitucional'),
  ('Direito do Trabalho'),
  ('Direito Empresarial'),
  ('Direito Financeiro'),
  ('Direito Penal'),
  ('Direito Previdenciário'),
  ('Direito Tributário'),
  ('Direitos Humanos'),
  ('Filosofia do Direito'),
  ('Processo Civil'),
  ('Processo do Trabalho'),
  ('Processo Penal')
ON CONFLICT (area) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_flashcards_areas_capas_updated_at
BEFORE UPDATE ON public.flashcards_areas_capas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();