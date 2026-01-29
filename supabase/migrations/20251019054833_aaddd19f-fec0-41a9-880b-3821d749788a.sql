-- Adicionar campos para tornar a simulação mais interativa e humana
ALTER TABLE "SIMULACAO_CASOS"
ADD COLUMN IF NOT EXISTS mensagens_juiza jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rebatimentos_reu jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reacoes_disponiveis jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dificuldade_ia text DEFAULT 'media',
ADD COLUMN IF NOT EXISTS permite_rebatimentos boolean DEFAULT true;

-- Adicionar campos para gamificação na partida
ALTER TABLE "SIMULACAO_PARTIDAS"
ADD COLUMN IF NOT EXISTS combo_atual integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS combo_maximo integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conquistas_desbloqueadas jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS historico_mensagens jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rebatimentos_realizados jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS nivel_advogado text DEFAULT 'Iniciante',
ADD COLUMN IF NOT EXISTS experiencia integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pausado_em timestamp without time zone,
ADD COLUMN IF NOT EXISTS reacoes_juiza jsonb DEFAULT '[]'::jsonb;

-- Criar tabela de conquistas
CREATE TABLE IF NOT EXISTS "SIMULACAO_CONQUISTAS" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id),
  conquista_id text NOT NULL,
  nome text NOT NULL,
  descricao text,
  icone text,
  desbloqueado_em timestamp without time zone DEFAULT now(),
  partida_id bigint REFERENCES "SIMULACAO_PARTIDAS"(id)
);

-- Criar tabela de ranking
CREATE TABLE IF NOT EXISTS "SIMULACAO_RANKINGS" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id),
  area text NOT NULL,
  pontuacao_total integer DEFAULT 0,
  casos_vencidos integer DEFAULT 0,
  casos_totais integer DEFAULT 0,
  combo_maximo integer DEFAULT 0,
  nivel_atual text DEFAULT 'Iniciante',
  experiencia_total integer DEFAULT 0,
  updated_at timestamp without time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE "SIMULACAO_CONQUISTAS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SIMULACAO_RANKINGS" ENABLE ROW LEVEL SECURITY;

-- Políticas para conquistas
CREATE POLICY "Usuários veem suas conquistas"
ON "SIMULACAO_CONQUISTAS"
FOR SELECT
USING (true);

CREATE POLICY "Sistema cria conquistas"
ON "SIMULACAO_CONQUISTAS"
FOR INSERT
WITH CHECK (true);

-- Políticas para ranking
CREATE POLICY "Rankings são públicos"
ON "SIMULACAO_RANKINGS"
FOR SELECT
USING (true);

CREATE POLICY "Sistema atualiza rankings"
ON "SIMULACAO_RANKINGS"
FOR ALL
USING (true)
WITH CHECK (true);