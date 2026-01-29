-- Tabela para cache de explicações dos rankings (evita regeneração)
CREATE TABLE IF NOT EXISTS ranking_explicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  explicacao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para deputados populares/mais buscados
CREATE TABLE IF NOT EXISTS deputados_populares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputado_id INTEGER UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  visualizacoes INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Novos rankings
CREATE TABLE IF NOT EXISTS ranking_discursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputado_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_discursos INTEGER DEFAULT 0,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranking_frentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputado_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_frentes INTEGER DEFAULT 0,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ranking_menos_despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputado_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  partido TEXT,
  uf TEXT,
  foto_url TEXT,
  total_gasto NUMERIC DEFAULT 0,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ranking_explicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deputados_populares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_discursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_frentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_menos_despesas ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Explicações são públicas" ON ranking_explicacoes FOR SELECT USING (true);
CREATE POLICY "Deputados populares são públicos" ON deputados_populares FOR SELECT USING (true);
CREATE POLICY "Ranking discursos é público" ON ranking_discursos FOR SELECT USING (true);
CREATE POLICY "Ranking frentes é público" ON ranking_frentes FOR SELECT USING (true);
CREATE POLICY "Ranking menos despesas é público" ON ranking_menos_despesas FOR SELECT USING (true);

-- Políticas de escrita para sistema
CREATE POLICY "Sistema pode inserir explicações" ON ranking_explicacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistema pode atualizar explicações" ON ranking_explicacoes FOR UPDATE USING (true);
CREATE POLICY "Sistema pode inserir deputados populares" ON deputados_populares FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistema pode atualizar deputados populares" ON deputados_populares FOR UPDATE USING (true);
CREATE POLICY "Sistema pode inserir ranking discursos" ON ranking_discursos FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistema pode deletar ranking discursos" ON ranking_discursos FOR DELETE USING (true);
CREATE POLICY "Sistema pode inserir ranking frentes" ON ranking_frentes FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistema pode deletar ranking frentes" ON ranking_frentes FOR DELETE USING (true);
CREATE POLICY "Sistema pode inserir ranking menos despesas" ON ranking_menos_despesas FOR INSERT WITH CHECK (true);
CREATE POLICY "Sistema pode deletar ranking menos despesas" ON ranking_menos_despesas FOR DELETE USING (true);

-- Inserir deputados populares iniciais
INSERT INTO deputados_populares (deputado_id, nome, partido, uf, ordem) VALUES
(204554, 'Nikolas Ferreira', 'PL', 'MG', 1),
(160976, 'Kim Kataguiri', 'UNIÃO', 'SP', 2),
(220593, 'Guilherme Boulos', 'PSOL', 'SP', 3),
(204560, 'Erika Hilton', 'PSOL', 'SP', 4),
(178957, 'Marcel Van Hattem', 'NOVO', 'RS', 5),
(204379, 'Carla Zambelli', 'PL', 'SP', 6),
(178835, 'Eduardo Bolsonaro', 'PL', 'SP', 7),
(204534, 'Tabata Amaral', 'PSB', 'SP', 8),
(204521, 'André Janones', 'AVANTE', 'MG', 9),
(178914, 'Sâmia Bomfim', 'PSOL', 'SP', 10)
ON CONFLICT (deputado_id) DO NOTHING;