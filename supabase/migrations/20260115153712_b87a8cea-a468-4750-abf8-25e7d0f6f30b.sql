-- Tabela para armazenar conteúdo de redação extraído do PDF
CREATE TABLE public.redacao_conteudo (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  exemplos JSONB DEFAULT '[]'::jsonb,
  dicas JSONB DEFAULT '[]'::jsonb,
  ordem INTEGER NOT NULL DEFAULT 0,
  pagina_pdf INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para busca eficiente
CREATE INDEX idx_redacao_conteudo_categoria ON public.redacao_conteudo(categoria);
CREATE INDEX idx_redacao_conteudo_subcategoria ON public.redacao_conteudo(subcategoria);
CREATE INDEX idx_redacao_conteudo_ordem ON public.redacao_conteudo(ordem);

-- Habilitar RLS
ALTER TABLE public.redacao_conteudo ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (conteúdo educacional)
CREATE POLICY "Redacao conteudo visivel para todos" 
ON public.redacao_conteudo 
FOR SELECT 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_redacao_conteudo_updated_at
BEFORE UPDATE ON public.redacao_conteudo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();