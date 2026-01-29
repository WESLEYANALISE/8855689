-- Tabela para armazenar URLs customizadas do Planalto para cada lei
CREATE TABLE public.urls_planalto_customizadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_tabela TEXT NOT NULL UNIQUE,
  url_planalto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comentário na tabela
COMMENT ON TABLE public.urls_planalto_customizadas IS 'Armazena URLs customizadas do Planalto para leis, permitindo override do padrão';

-- Habilitar RLS
ALTER TABLE public.urls_planalto_customizadas ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Qualquer um pode ler URLs customizadas"
ON public.urls_planalto_customizadas
FOR SELECT
USING (true);

-- Política de inserção pública (admin)
CREATE POLICY "Qualquer um pode inserir URLs customizadas"
ON public.urls_planalto_customizadas
FOR INSERT
WITH CHECK (true);

-- Política de atualização pública (admin)
CREATE POLICY "Qualquer um pode atualizar URLs customizadas"
ON public.urls_planalto_customizadas
FOR UPDATE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_urls_planalto_customizadas_updated_at
BEFORE UPDATE ON public.urls_planalto_customizadas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();