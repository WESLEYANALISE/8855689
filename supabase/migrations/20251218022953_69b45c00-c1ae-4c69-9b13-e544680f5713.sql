-- Create table for daily radar covers
CREATE TABLE IF NOT EXISTS radar_capas_diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('juridico', 'politico')),
  url_capa text,
  titulo_capa text,
  subtitulo_capa text,
  total_noticias integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(data, tipo)
);

-- Enable RLS
ALTER TABLE radar_capas_diarias ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Capas são públicas para leitura"
  ON radar_capas_diarias FOR SELECT
  USING (true);

-- Index for quick lookups
CREATE INDEX idx_radar_capas_data ON radar_capas_diarias(data DESC);
CREATE INDEX idx_radar_capas_tipo ON radar_capas_diarias(tipo);