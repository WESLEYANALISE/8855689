-- Tabela para eventos salvos pelo usuário
CREATE TABLE eventos_salvos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('MUSEU', 'BIBLIOTECA', 'PALESTRA', 'CURSO', 'AUDIENCIA')),
  titulo TEXT NOT NULL,
  local TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  data_evento TIMESTAMP,
  horas_estimadas INTEGER,
  detalhes JSONB DEFAULT '{}'::jsonb,
  url_inscricao TEXT,
  lembrete_enviado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE eventos_salvos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus eventos salvos"
  ON eventos_salvos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus eventos"
  ON eventos_salvos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus eventos"
  ON eventos_salvos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_eventos_salvos_user_id ON eventos_salvos(user_id);
CREATE INDEX idx_eventos_salvos_tipo ON eventos_salvos(tipo);
CREATE INDEX idx_eventos_salvos_data ON eventos_salvos(data_evento);