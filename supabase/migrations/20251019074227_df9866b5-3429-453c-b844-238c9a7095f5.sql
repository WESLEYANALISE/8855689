-- Adicionar campos para o advogado da parte contrária e dinâmica de 3 personagens

-- Novos campos em SIMULACAO_CASOS
ALTER TABLE "SIMULACAO_CASOS" 
ADD COLUMN IF NOT EXISTS nome_advogado_reu TEXT,
ADD COLUMN IF NOT EXISTS perfil_advogado_reu TEXT,
ADD COLUMN IF NOT EXISTS avatar_advogado_reu TEXT,
ADD COLUMN IF NOT EXISTS testemunhas JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS objecoes_disponiveis JSONB DEFAULT '[]';

-- Novos campos em SIMULACAO_PARTIDAS
ALTER TABLE "SIMULACAO_PARTIDAS"
ADD COLUMN IF NOT EXISTS artigos_citados JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS objecoes_realizadas JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS interrupcoes_sofridas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fundamentacao_legal_score INTEGER DEFAULT 0;