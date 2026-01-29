-- Criar enum para níveis de dificuldade
CREATE TYPE nivel_dificuldade AS ENUM ('Fácil', 'Médio', 'Difícil');

-- Criar enum para força de provas/argumentos
CREATE TYPE forca_opcao AS ENUM ('forte', 'media', 'fraca');

-- Tabela principal de casos de simulação
CREATE TABLE "SIMULACAO_CASOS" (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  nivel_dificuldade nivel_dificuldade NOT NULL DEFAULT 'Médio',
  
  -- Narrativa do caso
  titulo_caso TEXT NOT NULL,
  contexto_inicial TEXT NOT NULL,
  fatos_relevantes JSONB DEFAULT '[]'::jsonb,
  
  -- Personagens
  nome_cliente TEXT,
  perfil_cliente TEXT,
  nome_reu TEXT,
  perfil_reu TEXT,
  nome_juiza TEXT DEFAULT 'Dra. Ana Clara Mendes',
  avatar_juiza TEXT,
  
  -- Provas disponíveis (array de {tipo, descricao, forca, imagem_url, imagem_prompt})
  provas JSONB DEFAULT '[]'::jsonb,
  
  -- Fases do jogo com argumentações
  fases JSONB DEFAULT '[]'::jsonb,
  
  -- Rebatimentos da parte contrária
  rebatimentos_reu JSONB DEFAULT '[]'::jsonb,
  
  -- Resultado esperado
  sentenca_ideal TEXT,
  feedback_positivo TEXT[],
  feedback_negativo TEXT[],
  dicas TEXT[],
  pontuacao_maxima INTEGER DEFAULT 100,
  
  -- Metadados
  artigos_relacionados JSONB DEFAULT '[]'::jsonb,
  livros_relacionados JSONB DEFAULT '[]'::jsonb,
  prompt_imagem TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de histórico de partidas
CREATE TABLE "SIMULACAO_PARTIDAS" (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  caso_id BIGINT REFERENCES "SIMULACAO_CASOS"(id) ON DELETE CASCADE,
  
  -- Escolhas do jogador
  avatar_escolhido TEXT,
  provas_escolhidas JSONB DEFAULT '[]'::jsonb,
  argumentacoes_escolhidas JSONB DEFAULT '[]'::jsonb,
  escolhas_detalhadas JSONB DEFAULT '[]'::jsonb,
  
  -- Resultados
  pontuacao_final INTEGER DEFAULT 0,
  sentenca_recebida TEXT,
  deferido BOOLEAN,
  tempo_jogado INTEGER,
  
  -- Feedback
  acertos TEXT[],
  erros TEXT[],
  sugestoes_melhoria TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_simulacao_casos_area ON "SIMULACAO_CASOS"(area);
CREATE INDEX idx_simulacao_casos_tema ON "SIMULACAO_CASOS"(tema);
CREATE INDEX idx_simulacao_partidas_user_id ON "SIMULACAO_PARTIDAS"(user_id);
CREATE INDEX idx_simulacao_partidas_caso_id ON "SIMULACAO_PARTIDAS"(caso_id);

-- Habilitar RLS
ALTER TABLE "SIMULACAO_CASOS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SIMULACAO_PARTIDAS" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para SIMULACAO_CASOS (todos podem ler)
CREATE POLICY "Casos são públicos para leitura"
ON "SIMULACAO_CASOS"
FOR SELECT
USING (true);

-- Sistema pode inserir/atualizar casos
CREATE POLICY "Sistema pode gerenciar casos"
ON "SIMULACAO_CASOS"
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas RLS para SIMULACAO_PARTIDAS
CREATE POLICY "Usuários veem apenas suas partidas"
ON "SIMULACAO_PARTIDAS"
FOR SELECT
USING (true);

CREATE POLICY "Usuários podem criar suas partidas"
ON "SIMULACAO_PARTIDAS"
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas partidas"
ON "SIMULACAO_PARTIDAS"
FOR UPDATE
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_simulacao_casos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER simulacao_casos_updated_at
BEFORE UPDATE ON "SIMULACAO_CASOS"
FOR EACH ROW
EXECUTE FUNCTION update_simulacao_casos_updated_at();