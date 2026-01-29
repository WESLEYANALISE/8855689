-- Tabela para configurar grupos que receberão notícias
CREATE TABLE public.evelyn_grupos_noticias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id TEXT NOT NULL UNIQUE,
  nome_grupo TEXT NOT NULL,
  tipos_noticias TEXT[] DEFAULT ARRAY['juridicas', 'concursos'],
  quantidade_noticias INTEGER DEFAULT 3,
  ativo BOOLEAN DEFAULT true,
  instance_name TEXT DEFAULT 'evelyn',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para registrar notícias já enviadas (evitar duplicatas)
CREATE TABLE public.evelyn_noticias_enviadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  noticia_id TEXT NOT NULL,
  grupo_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT,
  enviada_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(noticia_id, grupo_id)
);

-- Trigger para updated_at
CREATE TRIGGER update_evelyn_grupos_noticias_updated_at
  BEFORE UPDATE ON public.evelyn_grupos_noticias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_evelyn_updated_at();

-- RLS
ALTER TABLE public.evelyn_grupos_noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evelyn_noticias_enviadas ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (edge functions usam service role)
CREATE POLICY "Allow all for service role" ON public.evelyn_grupos_noticias FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON public.evelyn_noticias_enviadas FOR ALL USING (true);

-- Índices
CREATE INDEX idx_evelyn_noticias_enviadas_grupo ON public.evelyn_noticias_enviadas(grupo_id);
CREATE INDEX idx_evelyn_noticias_enviadas_noticia ON public.evelyn_noticias_enviadas(noticia_id);
CREATE INDEX idx_evelyn_grupos_noticias_ativo ON public.evelyn_grupos_noticias(ativo) WHERE ativo = true;