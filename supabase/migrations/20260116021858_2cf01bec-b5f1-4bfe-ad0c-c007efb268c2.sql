-- Criar tabela para estruturas predefinidas de temas
CREATE TABLE IF NOT EXISTS oab_trilhas_estruturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema_id UUID REFERENCES oab_trilhas_temas(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  subitens TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tema_id, ordem)
);

-- Habilitar RLS
ALTER TABLE oab_trilhas_estruturas ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Estruturas são públicas para leitura"
ON oab_trilhas_estruturas FOR SELECT USING (true);

-- Inserir estrutura predefinida para "Da aplicação da Lei Penal"
INSERT INTO oab_trilhas_estruturas (tema_id, ordem, titulo, subitens) VALUES
('20678140-8841-40ea-add0-27568514527d', 1, 'Lei Penal', 
 ARRAY['Conceito de lei penal', 'Características da lei penal', 'Finalidade e função da norma penal']),
('20678140-8841-40ea-add0-27568514527d', 2, 'Fontes do Direito Penal', 
 ARRAY['Fontes formais (lei, costumes, princípios)', 'Fontes materiais']),
('20678140-8841-40ea-add0-27568514527d', 3, 'Princípios da Lei Penal', 
 ARRAY['Princípio da legalidade', 'Princípio da anterioridade', 'Princípio da irretroatividade da lei penal mais gravosa', 'Princípio da retroatividade da lei penal mais benéfica']),
('20678140-8841-40ea-add0-27568514527d', 4, 'Lei Penal no Tempo', 
 ARRAY['Tempo do crime (teoria da atividade)', 'Conflito de leis penais no tempo', 'Abolitio criminis', 'Novatio legis incriminadora', 'Novatio legis in mellius', 'Ultratividade e extra-atividade da lei penal']),
('20678140-8841-40ea-add0-27568514527d', 5, 'Lei Penal no Espaço', 
 ARRAY['Territorialidade da lei penal brasileira', 'Lugar do crime (teoria da ubiquidade)']),
('20678140-8841-40ea-add0-27568514527d', 6, 'Extraterritorialidade da Lei Penal', 
 ARRAY['Conceito', 'Extraterritorialidade incondicionada', 'Extraterritorialidade condicionada', 'Hipóteses previstas no Código Penal']),
('20678140-8841-40ea-add0-27568514527d', 7, 'Tempo e Lugar do Crime', 
 ARRAY['Fixação do tempo do crime', 'Fixação do lugar do crime', 'Importância prática (competência, aplicação da lei, prescrição)']),
('20678140-8841-40ea-add0-27568514527d', 8, 'Eficácia da Lei Penal', 
 ARRAY['Eficácia pessoal', 'Eficácia territorial', 'Limites da aplicação da lei penal']);

-- Limpar subtópicos antigos para regenerar com estrutura correta
DELETE FROM oab_trilhas_subtopicos WHERE tema_id = '20678140-8841-40ea-add0-27568514527d';