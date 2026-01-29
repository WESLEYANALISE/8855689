-- Tabela para armazenar grifos gerados por IA para questões
CREATE TABLE public.questoes_grifos_cache (
  id BIGSERIAL PRIMARY KEY,
  tabela_codigo TEXT NOT NULL,
  numero_artigo TEXT NOT NULL,
  questao_id BIGINT,
  trechos_grifados TEXT[] DEFAULT '{}',
  texto_artigo TEXT,
  enunciado TEXT,
  alternativa_correta TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tabela_codigo, numero_artigo)
);

-- Índices para busca rápida
CREATE INDEX idx_questoes_grifos_tabela ON public.questoes_grifos_cache(tabela_codigo);
CREATE INDEX idx_questoes_grifos_artigo ON public.questoes_grifos_cache(numero_artigo);
CREATE INDEX idx_questoes_grifos_tabela_artigo ON public.questoes_grifos_cache(tabela_codigo, numero_artigo);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_questoes_grifos_updated_at
BEFORE UPDATE ON public.questoes_grifos_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();