-- Tabela de memória persistente por usuário
CREATE TABLE public.evelyn_memoria_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES evelyn_usuarios(id) ON DELETE CASCADE,
  tipo text CHECK (tipo IN ('interesse', 'dificuldade', 'meta', 'historico_estudo', 'preferencia')),
  chave text NOT NULL,
  valor text,
  metadata jsonb DEFAULT '{}',
  relevancia int DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de progresso de estudo por usuário
CREATE TABLE public.evelyn_progresso_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES evelyn_usuarios(id) ON DELETE CASCADE,
  area text NOT NULL,
  tema text,
  artigos_estudados int DEFAULT 0,
  flashcards_corretos int DEFAULT 0,
  flashcards_errados int DEFAULT 0,
  quizzes_corretos int DEFAULT 0,
  quizzes_errados int DEFAULT 0,
  ultimo_estudo timestamptz,
  nivel text DEFAULT 'iniciante',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id, area, tema)
);

-- Tabela de eventos externos (webhook)
CREATE TABLE public.evelyn_eventos_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento text NOT NULL,
  payload jsonb NOT NULL,
  processado boolean DEFAULT false,
  resultado jsonb,
  erro text,
  created_at timestamptz DEFAULT now(),
  processado_at timestamptz
);

-- Tabela de API Keys para acesso externo
CREATE TABLE public.evelyn_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  api_key text NOT NULL UNIQUE,
  ativo boolean DEFAULT true,
  rate_limit int DEFAULT 100,
  permissoes jsonb DEFAULT '["artigo", "estatisticas", "buscar_lei", "flashcard"]',
  ultimo_uso timestamptz,
  total_requests int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_evelyn_memoria_usuario ON evelyn_memoria_usuario(usuario_id, tipo);
CREATE INDEX idx_evelyn_progresso_usuario ON evelyn_progresso_usuario(usuario_id);
CREATE INDEX idx_evelyn_eventos_processado ON evelyn_eventos_externos(processado, created_at);
CREATE INDEX idx_evelyn_api_keys_key ON evelyn_api_keys(api_key);

-- Triggers para updated_at
CREATE TRIGGER update_evelyn_memoria_updated_at
  BEFORE UPDATE ON evelyn_memoria_usuario
  FOR EACH ROW
  EXECUTE FUNCTION update_evelyn_updated_at();

CREATE TRIGGER update_evelyn_progresso_updated_at
  BEFORE UPDATE ON evelyn_progresso_usuario
  FOR EACH ROW
  EXECUTE FUNCTION update_evelyn_updated_at();

-- RLS Policies
ALTER TABLE evelyn_memoria_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE evelyn_progresso_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE evelyn_eventos_externos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evelyn_api_keys ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura pública (dashboard)
CREATE POLICY "Progresso é público para leitura" ON evelyn_progresso_usuario FOR SELECT USING (true);
CREATE POLICY "Memória é pública para leitura" ON evelyn_memoria_usuario FOR SELECT USING (true);
CREATE POLICY "Eventos são públicos para leitura" ON evelyn_eventos_externos FOR SELECT USING (true);
CREATE POLICY "API Keys são públicas para leitura" ON evelyn_api_keys FOR SELECT USING (true);