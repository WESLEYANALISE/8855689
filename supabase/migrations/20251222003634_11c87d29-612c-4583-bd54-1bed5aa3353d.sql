-- Canais de tribunais monitorados no YouTube
CREATE TABLE public.canais_audiencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribunal TEXT NOT NULL,
  nome TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  playlist_id TEXT,
  url_canal TEXT,
  ultima_verificacao TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vídeos de audiências
CREATE TABLE public.audiencias_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal_id UUID REFERENCES public.canais_audiencias(id) ON DELETE CASCADE,
  video_id TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  thumbnail TEXT,
  publicado_em TIMESTAMPTZ,
  duracao_segundos INTEGER,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'analisando', 'concluido', 'erro')),
  transcricao TEXT,
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Análises geradas pela IA
CREATE TABLE public.audiencias_analises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.audiencias_videos(id) ON DELETE CASCADE,
  resumo TEXT,
  temas_principais JSONB DEFAULT '[]'::jsonb,
  participantes JSONB DEFAULT '[]'::jsonb,
  pontos_discutidos JSONB DEFAULT '[]'::jsonb,
  termos_chave TEXT[] DEFAULT '{}',
  tipo_sessao TEXT,
  decisao_final TEXT,
  votos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_audiencias_videos_canal ON public.audiencias_videos(canal_id);
CREATE INDEX idx_audiencias_videos_status ON public.audiencias_videos(status);
CREATE INDEX idx_audiencias_videos_publicado ON public.audiencias_videos(publicado_em DESC);
CREATE INDEX idx_audiencias_analises_video ON public.audiencias_analises(video_id);
CREATE INDEX idx_audiencias_analises_termos ON public.audiencias_analises USING GIN(termos_chave);

-- Enable RLS
ALTER TABLE public.canais_audiencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiencias_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiencias_analises ENABLE ROW LEVEL SECURITY;

-- Policies - Leitura pública
CREATE POLICY "Canais são visíveis publicamente" ON public.canais_audiencias FOR SELECT USING (true);
CREATE POLICY "Vídeos são visíveis publicamente" ON public.audiencias_videos FOR SELECT USING (true);
CREATE POLICY "Análises são visíveis publicamente" ON public.audiencias_analises FOR SELECT USING (true);

-- Policies - Escrita (service role apenas)
CREATE POLICY "Apenas service role pode inserir canais" ON public.canais_audiencias FOR INSERT WITH CHECK (false);
CREATE POLICY "Apenas service role pode atualizar canais" ON public.canais_audiencias FOR UPDATE USING (false);
CREATE POLICY "Apenas service role pode inserir vídeos" ON public.audiencias_videos FOR INSERT WITH CHECK (false);
CREATE POLICY "Apenas service role pode atualizar vídeos" ON public.audiencias_videos FOR UPDATE USING (false);
CREATE POLICY "Apenas service role pode inserir análises" ON public.audiencias_analises FOR INSERT WITH CHECK (false);
CREATE POLICY "Apenas service role pode atualizar análises" ON public.audiencias_analises FOR UPDATE USING (false);

-- Triggers para updated_at
CREATE TRIGGER update_canais_audiencias_updated_at
  BEFORE UPDATE ON public.canais_audiencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audiencias_videos_updated_at
  BEFORE UPDATE ON public.audiencias_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audiencias_analises_updated_at
  BEFORE UPDATE ON public.audiencias_analises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir canais iniciais dos tribunais
INSERT INTO public.canais_audiencias (tribunal, nome, channel_id, url_canal) VALUES
  ('STF', 'Supremo Tribunal Federal', 'UCx3mVhPsK2tW3Bl9t_FYYbg', 'https://www.youtube.com/@STF_oficial'),
  ('STJ', 'Superior Tribunal de Justiça', 'UC-7bSE3yEBqI06gHGnXl5pg', 'https://www.youtube.com/@stjnoticias'),
  ('TST', 'Tribunal Superior do Trabalho', 'UCEbJR0p0OqK4IxOdB5FPgPg', 'https://www.youtube.com/@tstoficial'),
  ('TV Justiça', 'TV Justiça', 'UCnNORsoQLoEk5WsFb3hLNng', 'https://www.youtube.com/@TVJusticaOficial'),
  ('CNJ', 'Conselho Nacional de Justiça', 'UCnNORsoQLoEk5WsFb3hLNng', 'https://www.youtube.com/@CNJOficial'),
  ('TSE', 'Tribunal Superior Eleitoral', 'UCIfBi3hc8MfPt0F-AOu9y1g', 'https://www.youtube.com/@TSEjusbr');