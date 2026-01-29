-- =====================================================
-- TABELAS DE CACHE PARA SENADO FEDERAL
-- Carregamento instantâneo + atualização automática
-- =====================================================

-- 1. Cache de Senadores
CREATE TABLE IF NOT EXISTS senado_senadores (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT,
  nome_completo TEXT,
  partido TEXT,
  uf TEXT,
  email TEXT,
  foto TEXT,
  sexo TEXT,
  pagina_web TEXT,
  bloco TEXT,
  telefone TEXT,
  dados_completos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cache de Votações (histórico completo)
CREATE TABLE IF NOT EXISTS senado_votacoes (
  id SERIAL PRIMARY KEY,
  codigo_votacao TEXT,
  codigo_sessao TEXT,
  data_sessao DATE NOT NULL,
  descricao_votacao TEXT,
  descricao_sessao TEXT,
  resultado TEXT,
  total_sim INTEGER DEFAULT 0,
  total_nao INTEGER DEFAULT 0,
  total_abstencao INTEGER DEFAULT 0,
  materia_codigo TEXT,
  materia_sigla TEXT,
  materia_numero TEXT,
  materia_ano TEXT,
  votos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(codigo_votacao, codigo_sessao)
);

-- 3. Cache de Comissões
CREATE TABLE IF NOT EXISTS senado_comissoes (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  sigla TEXT,
  nome TEXT,
  tipo TEXT,
  casa TEXT,
  data_criacao DATE,
  data_extincao DATE,
  ativa BOOLEAN DEFAULT true,
  participantes INTEGER DEFAULT 0,
  dados_completos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Cache de Matérias/Projetos
CREATE TABLE IF NOT EXISTS senado_materias (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  sigla TEXT,
  numero TEXT,
  ano TEXT,
  ementa TEXT,
  autor TEXT,
  situacao TEXT,
  data_apresentacao DATE,
  dados_completos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Controle de sincronização
CREATE TABLE IF NOT EXISTS senado_sync_log (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL, -- 'senadores', 'votacoes', 'comissoes', 'materias'
  total_registros INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluido', 'erro'
  erro_mensagem TEXT,
  iniciado_em TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_senado_senadores_uf ON senado_senadores(uf);
CREATE INDEX IF NOT EXISTS idx_senado_senadores_partido ON senado_senadores(partido);
CREATE INDEX IF NOT EXISTS idx_senado_votacoes_data ON senado_votacoes(data_sessao DESC);
CREATE INDEX IF NOT EXISTS idx_senado_votacoes_resultado ON senado_votacoes(resultado);
CREATE INDEX IF NOT EXISTS idx_senado_comissoes_ativa ON senado_comissoes(ativa);
CREATE INDEX IF NOT EXISTS idx_senado_comissoes_tipo ON senado_comissoes(tipo);
CREATE INDEX IF NOT EXISTS idx_senado_materias_sigla ON senado_materias(sigla);
CREATE INDEX IF NOT EXISTS idx_senado_materias_ano ON senado_materias(ano);

-- Habilitar RLS com política pública de leitura
ALTER TABLE senado_senadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE senado_sync_log ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Leitura pública senado_senadores" ON senado_senadores FOR SELECT USING (true);
CREATE POLICY "Leitura pública senado_votacoes" ON senado_votacoes FOR SELECT USING (true);
CREATE POLICY "Leitura pública senado_comissoes" ON senado_comissoes FOR SELECT USING (true);
CREATE POLICY "Leitura pública senado_materias" ON senado_materias FOR SELECT USING (true);
CREATE POLICY "Leitura pública senado_sync_log" ON senado_sync_log FOR SELECT USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_senado_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_senado_senadores_updated_at
  BEFORE UPDATE ON senado_senadores
  FOR EACH ROW EXECUTE FUNCTION update_senado_updated_at();

CREATE TRIGGER trigger_senado_votacoes_updated_at
  BEFORE UPDATE ON senado_votacoes
  FOR EACH ROW EXECUTE FUNCTION update_senado_updated_at();

CREATE TRIGGER trigger_senado_comissoes_updated_at
  BEFORE UPDATE ON senado_comissoes
  FOR EACH ROW EXECUTE FUNCTION update_senado_updated_at();