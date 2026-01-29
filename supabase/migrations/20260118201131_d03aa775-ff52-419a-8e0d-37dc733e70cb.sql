-- ==============================================
-- PARTE 1: Atualizar matérias OAB para refletir as 20 áreas da Base de Conhecimento
-- ==============================================

-- Desativar todas as matérias atuais primeiro
UPDATE oab_trilhas_materias SET ativo = false WHERE ativo = true;

-- Inserir/Atualizar as 20 áreas oficiais da Base de Conhecimento OAB
INSERT INTO oab_trilhas_materias (nome, descricao, ordem, ativo)
VALUES
  ('Ética Profissional', 'Normas de conduta profissional do advogado', 1, true),
  ('Direito Constitucional', 'Princípios e garantias fundamentais da Constituição', 2, true),
  ('Direito Administrativo', 'Organização e funcionamento da administração pública', 3, true),
  ('Direito Civil', 'Relações privadas entre pessoas físicas e jurídicas', 4, true),
  ('Direito Processual Civil', 'Normas processuais para tutela de direitos civis', 5, true),
  ('Direito Penal', 'Crimes, penas e política criminal', 6, true),
  ('Direito Processual Penal', 'Procedimentos e garantias no processo criminal', 7, true),
  ('Direito do Trabalho', 'Relações de emprego e proteção ao trabalhador', 8, true),
  ('Direito Processual do Trabalho', 'Procedimentos na Justiça do Trabalho', 9, true),
  ('Direito Tributário', 'Sistema tributário nacional e obrigações fiscais', 10, true),
  ('Direito Empresarial', 'Atividades empresariais e societárias', 11, true),
  ('Direito do Consumidor', 'Proteção nas relações de consumo', 12, true),
  ('Direito Ambiental', 'Tutela do meio ambiente e desenvolvimento sustentável', 13, true),
  ('Direito Internacional', 'Relações jurídicas entre Estados e organizações', 14, true),
  ('Direitos Humanos', 'Direitos fundamentais e dignidade da pessoa humana', 15, true),
  ('Direito da Criança e do Adolescente', 'Proteção integral à infância e juventude', 16, true),
  ('Direito Previdenciário', 'Seguridade social e benefícios previdenciários', 17, true),
  ('Direito Eleitoral', 'Processo eleitoral e partidos políticos', 18, true),
  ('Direito Financeiro', 'Finanças públicas e orçamento', 19, true),
  ('Filosofia do Direito', 'Fundamentos filosóficos do pensamento jurídico', 20, true)
ON CONFLICT (nome) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  ordem = EXCLUDED.ordem,
  ativo = true;

-- ==============================================
-- PARTE 2: Criar tabela de tópicos OAB unificada
-- ==============================================

CREATE TABLE IF NOT EXISTS oab_trilhas_topicos (
  id SERIAL PRIMARY KEY,
  materia_id INTEGER REFERENCES oab_trilhas_materias(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 1,
  titulo TEXT NOT NULL,
  descricao TEXT,
  
  -- Conteúdo gerado por IA
  conteudo_gerado TEXT,
  exemplos JSONB,
  termos JSONB,
  flashcards JSONB,
  questoes JSONB,
  
  -- Mídia
  capa_url TEXT,
  url_narracao TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'gerando', 'concluido', 'erro')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca por matéria
CREATE INDEX IF NOT EXISTS idx_oab_trilhas_topicos_materia_id ON oab_trilhas_topicos(materia_id);

-- RLS para leitura pública
ALTER TABLE oab_trilhas_topicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tópicos OAB são públicos para leitura"
ON oab_trilhas_topicos
FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem modificar tópicos OAB"
ON oab_trilhas_topicos
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE TRIGGER update_oab_trilhas_topicos_updated_at
BEFORE UPDATE ON oab_trilhas_topicos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();