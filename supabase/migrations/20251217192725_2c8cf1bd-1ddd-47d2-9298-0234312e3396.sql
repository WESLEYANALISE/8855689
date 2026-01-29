-- Add posicao column to all ranking tables
ALTER TABLE public.ranking_despesas ADD COLUMN IF NOT EXISTS posicao INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ranking_proposicoes ADD COLUMN IF NOT EXISTS posicao INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ranking_presenca ADD COLUMN IF NOT EXISTS posicao INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ranking_comissoes ADD COLUMN IF NOT EXISTS posicao INTEGER NOT NULL DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ranking_despesas_posicao ON public.ranking_despesas(posicao);
CREATE INDEX IF NOT EXISTS idx_ranking_proposicoes_posicao ON public.ranking_proposicoes(posicao);
CREATE INDEX IF NOT EXISTS idx_ranking_presenca_posicao ON public.ranking_presenca(posicao);
CREATE INDEX IF NOT EXISTS idx_ranking_comissoes_posicao ON public.ranking_comissoes(posicao);