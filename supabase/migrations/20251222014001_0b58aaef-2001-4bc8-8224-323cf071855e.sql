-- Criar tabela para armazenar playlists dos canais de audiências
CREATE TABLE public.audiencias_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canal_id UUID REFERENCES public.canais_audiencias(id) ON DELETE CASCADE,
  playlist_id TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  thumbnail TEXT,
  video_count INTEGER DEFAULT 0,
  publicado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.audiencias_playlists ENABLE ROW LEVEL SECURITY;

-- Política pública para leitura (dados públicos de tribunais)
CREATE POLICY "Playlists são públicas para leitura" 
ON public.audiencias_playlists 
FOR SELECT 
USING (true);

-- Política para inserção via service role (edge functions)
CREATE POLICY "Service role pode inserir playlists" 
ON public.audiencias_playlists 
FOR INSERT 
WITH CHECK (true);

-- Política para atualização via service role
CREATE POLICY "Service role pode atualizar playlists" 
ON public.audiencias_playlists 
FOR UPDATE 
USING (true);

-- Índices para performance
CREATE INDEX idx_audiencias_playlists_canal_id ON public.audiencias_playlists(canal_id);
CREATE INDEX idx_audiencias_playlists_publicado_em ON public.audiencias_playlists(publicado_em DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_audiencias_playlists_updated_at
BEFORE UPDATE ON public.audiencias_playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();