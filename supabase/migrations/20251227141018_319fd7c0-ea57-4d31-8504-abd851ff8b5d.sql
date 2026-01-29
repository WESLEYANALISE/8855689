-- Tabela de feedback para avaliar respostas
CREATE TABLE IF NOT EXISTS evelyn_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem_id UUID REFERENCES evelyn_mensagens(id) ON DELETE CASCADE,
  conversa_id UUID REFERENCES evelyn_conversas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES evelyn_usuarios(id) ON DELETE SET NULL,
  tipo_feedback TEXT NOT NULL CHECK (tipo_feedback IN ('positivo', 'negativo')),
  comentario TEXT,
  pergunta_original TEXT,
  resposta_avaliada TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna de feedback na mensagem
ALTER TABLE evelyn_mensagens 
  ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IS NULL OR feedback IN ('positivo', 'negativo'));

-- RLS para evelyn_feedback
ALTER TABLE evelyn_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to evelyn_feedback" 
ON evelyn_feedback FOR ALL 
USING (true) WITH CHECK (true);