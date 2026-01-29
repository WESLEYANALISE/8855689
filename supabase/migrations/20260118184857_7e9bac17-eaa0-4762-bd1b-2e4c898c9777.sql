-- Criar tabela oab_trilhas_materias para armazenar matérias da OAB com capas
CREATE TABLE public.oab_trilhas_materias (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  capa_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.oab_trilhas_materias ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Matérias OAB são públicas para leitura"
ON public.oab_trilhas_materias
FOR SELECT
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_oab_trilhas_materias_updated_at
BEFORE UPDATE ON public.oab_trilhas_materias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial com as 17 matérias oficiais da OAB 1ª Fase (ordem oficial)
INSERT INTO public.oab_trilhas_materias (ordem, nome, descricao) VALUES
(1, 'Ética Profissional', 'Regras de conduta e deveres do advogado'),
(2, 'Estatuto da Advocacia e da OAB', 'Lei 8.906/94 e regulamentação da profissão'),
(3, 'Direito Constitucional', 'Constituição Federal e direitos fundamentais'),
(4, 'Direitos Humanos', 'Tratados internacionais e proteção da pessoa humana'),
(5, 'Direito Internacional', 'Direito Internacional Público e Privado'),
(6, 'Direito Tributário', 'Sistema tributário nacional e tributos'),
(7, 'Direito Administrativo', 'Administração pública e atos administrativos'),
(8, 'Direito Ambiental', 'Proteção do meio ambiente e sustentabilidade'),
(9, 'Direito Civil', 'Código Civil e relações privadas'),
(10, 'Direito Processual Civil', 'CPC e procedimentos cíveis'),
(11, 'Direito do Consumidor', 'CDC e relações de consumo'),
(12, 'ECA', 'Estatuto da Criança e do Adolescente'),
(13, 'Direito Empresarial', 'Direito comercial e empresas'),
(14, 'Direito Penal', 'Código Penal e crimes'),
(15, 'Direito Processual Penal', 'CPP e procedimentos criminais'),
(16, 'Direito do Trabalho', 'CLT e relações trabalhistas'),
(17, 'Direito Processual do Trabalho', 'Processo do trabalho e CLT processual');