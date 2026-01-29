-- Tabela para armazenar pesquisas prontas do STJ
CREATE TABLE public.stj_pesquisa_pronta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ramo_direito TEXT NOT NULL,
  titulo_secao TEXT NOT NULL,
  tema TEXT NOT NULL,
  link_pesquisa TEXT,
  detalhes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ramo_direito, titulo_secao, tema)
);

-- Índices para busca eficiente
CREATE INDEX idx_stj_pesquisa_pronta_ramo ON public.stj_pesquisa_pronta(ramo_direito);
CREATE INDEX idx_stj_pesquisa_pronta_titulo ON public.stj_pesquisa_pronta(titulo_secao);
CREATE INDEX idx_stj_pesquisa_pronta_texto ON public.stj_pesquisa_pronta USING gin(to_tsvector('portuguese', tema || ' ' || COALESCE(detalhes, '')));

-- RLS
ALTER TABLE public.stj_pesquisa_pronta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública das pesquisas prontas" 
ON public.stj_pesquisa_pronta 
FOR SELECT 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_stj_pesquisa_pronta_updated_at
BEFORE UPDATE ON public.stj_pesquisa_pronta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();