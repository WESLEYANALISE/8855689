-- Perfil do usuário para TCC
CREATE TABLE public.tcc_perfil_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ano_faculdade INTEGER CHECK (ano_faculdade >= 1 AND ano_faculdade <= 10),
  areas_interesse TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Temas sugeridos por área
CREATE TABLE public.tcc_temas_sugeridos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_direito TEXT NOT NULL,
  tema TEXT NOT NULL,
  descricao TEXT,
  nivel_dificuldade TEXT CHECK (nivel_dificuldade IN ('iniciante', 'intermediario', 'avancado')),
  tema_saturado BOOLEAN DEFAULT FALSE,
  relevancia INTEGER DEFAULT 50 CHECK (relevancia >= 0 AND relevancia <= 100),
  anos_recomendados INTEGER[],
  legislacao_relacionada TEXT[],
  jurisprudencia_relacionada TEXT[],
  keywords TEXT[],
  oportunidade BOOLEAN DEFAULT FALSE,
  criado_por_ia BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TCCs em alta (cache de tendências)
CREATE TABLE public.tcc_em_alta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcc_id UUID REFERENCES public.tcc_pesquisas(id) ON DELETE CASCADE,
  motivo TEXT CHECK (motivo IN ('tema_atual', 'muito_acessado', 'sugestao_ia', 'destaque')),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tcc_id)
);

-- Histórico de visualizações de TCC
CREATE TABLE public.tcc_visualizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcc_id UUID REFERENCES public.tcc_pesquisas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TCCs salvos pelo usuário
CREATE TABLE public.tcc_salvos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tcc_id UUID REFERENCES public.tcc_pesquisas(id) ON DELETE CASCADE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tcc_id)
);

-- Enable RLS
ALTER TABLE public.tcc_perfil_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcc_temas_sugeridos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcc_em_alta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcc_visualizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcc_salvos ENABLE ROW LEVEL SECURITY;

-- Policies para tcc_perfil_usuario
CREATE POLICY "Usuários podem ver seu próprio perfil TCC" ON public.tcc_perfil_usuario
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu perfil TCC" ON public.tcc_perfil_usuario
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu perfil TCC" ON public.tcc_perfil_usuario
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies para tcc_temas_sugeridos (leitura pública)
CREATE POLICY "Temas sugeridos são públicos" ON public.tcc_temas_sugeridos
  FOR SELECT USING (true);

-- Policies para tcc_em_alta (leitura pública)
CREATE POLICY "TCCs em alta são públicos" ON public.tcc_em_alta
  FOR SELECT USING (true);

-- Policies para tcc_visualizacoes
CREATE POLICY "Usuários podem registrar visualizações" ON public.tcc_visualizacoes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Leitura pública de visualizações" ON public.tcc_visualizacoes
  FOR SELECT USING (true);

-- Policies para tcc_salvos
CREATE POLICY "Usuários podem ver seus TCCs salvos" ON public.tcc_salvos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem salvar TCCs" ON public.tcc_salvos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover TCCs salvos" ON public.tcc_salvos
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_tcc_perfil_usuario_updated_at
  BEFORE UPDATE ON public.tcc_perfil_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_tcc_temas_area ON public.tcc_temas_sugeridos(area_direito);
CREATE INDEX idx_tcc_temas_saturado ON public.tcc_temas_sugeridos(tema_saturado);
CREATE INDEX idx_tcc_temas_oportunidade ON public.tcc_temas_sugeridos(oportunidade);
CREATE INDEX idx_tcc_em_alta_ativo ON public.tcc_em_alta(ativo, ordem);
CREATE INDEX idx_tcc_visualizacoes_tcc ON public.tcc_visualizacoes(tcc_id);
CREATE INDEX idx_tcc_salvos_user ON public.tcc_salvos(user_id);

-- Inserir temas iniciais por área
INSERT INTO public.tcc_temas_sugeridos (area_direito, tema, descricao, nivel_dificuldade, tema_saturado, relevancia, anos_recomendados, legislacao_relacionada, oportunidade) VALUES
-- Direito Digital
('Digital', 'Responsabilidade Civil de IAs Generativas', 'Análise da responsabilidade civil por danos causados por sistemas de IA generativa como ChatGPT e similares', 'avancado', false, 95, ARRAY[4,5], ARRAY['Marco Civil da Internet', 'Código Civil', 'LGPD'], true),
('Digital', 'Regulamentação de Criptoativos no Brasil', 'Marco regulatório das criptomoedas e tokens após a Lei 14.478/2022', 'intermediario', false, 90, ARRAY[3,4,5], ARRAY['Lei 14.478/2022', 'Resoluções BACEN'], true),
('Digital', 'Metaverso e Direitos Reais Virtuais', 'Natureza jurídica da propriedade virtual em ambientes de metaverso', 'avancado', false, 88, ARRAY[4,5], ARRAY['Código Civil'], true),
('Digital', 'LGPD e Proteção de Dados em Startups', 'Implementação da LGPD em empresas de tecnologia de pequeno porte', 'iniciante', true, 70, ARRAY[3,4], ARRAY['LGPD', 'Marco Civil'], false),
('Digital', 'Crimes Cibernéticos e Deep Fakes', 'Tipificação penal de crimes envolvendo manipulação de imagem por IA', 'intermediario', false, 85, ARRAY[3,4,5], ARRAY['Código Penal', 'Lei Carolina Dieckmann'], true),

-- Direito Constitucional
('Constitucional', 'Liberdade de Expressão vs. Desinformação', 'Limites constitucionais ao combate às fake news', 'avancado', false, 92, ARRAY[4,5], ARRAY['Constituição Federal', 'Marco Civil'], false),
('Constitucional', 'Ativismo Judicial e Separação de Poderes', 'Análise da judicialização de políticas públicas no STF', 'avancado', true, 65, ARRAY[4,5], ARRAY['Constituição Federal'], false),
('Constitucional', 'Estado de Coisas Inconstitucional', 'Aplicação da teoria colombiana no sistema prisional brasileiro', 'avancado', false, 80, ARRAY[4,5], ARRAY['Constituição Federal'], false),
('Constitucional', 'Constitucionalismo Digital', 'Direitos fundamentais na era digital e suas garantias', 'intermediario', false, 88, ARRAY[3,4,5], ARRAY['Constituição Federal', 'Marco Civil', 'LGPD'], true),

-- Direito Penal
('Penal', 'Execução Penal Pós-Pandemia', 'Impactos da COVID-19 na execução penal e prisão domiciliar', 'intermediario', false, 75, ARRAY[3,4,5], ARRAY['LEP', 'Código Penal'], false),
('Penal', 'Crimes de Ódio nas Redes Sociais', 'Responsabilização penal por discurso de ódio online', 'intermediario', false, 85, ARRAY[3,4,5], ARRAY['Código Penal', 'Lei de Racismo'], false),
('Penal', 'Acordo de Não Persecução Penal', 'Análise crítica do ANPP após 4 anos de vigência', 'iniciante', true, 60, ARRAY[3,4], ARRAY['CPP', 'Pacote Anticrime'], false),
('Penal', 'Inteligência Artificial no Processo Penal', 'Uso de algoritmos preditivos na justiça criminal', 'avancado', false, 90, ARRAY[4,5], ARRAY['CPP', 'Constituição Federal'], true),

-- Direito Trabalhista
('Trabalhista', 'Trabalho em Plataformas Digitais', 'Vínculo empregatício de entregadores e motoristas de app', 'intermediario', true, 55, ARRAY[3,4], ARRAY['CLT'], false),
('Trabalhista', 'Home Office e Direito à Desconexão', 'Regulamentação do teletrabalho e limites de jornada', 'iniciante', false, 80, ARRAY[3,4,5], ARRAY['CLT', 'Lei 14.442/2022'], false),
('Trabalhista', 'IA e Discriminação Algorítmica no RH', 'Uso de algoritmos em processos seletivos e viés discriminatório', 'avancado', false, 92, ARRAY[4,5], ARRAY['CLT', 'Constituição Federal', 'LGPD'], true),
('Trabalhista', 'Saúde Mental do Trabalhador', 'Burnout como doença ocupacional e responsabilidade do empregador', 'iniciante', false, 78, ARRAY[3,4], ARRAY['CLT', 'Lei 8.213/91'], false),

-- Direito Tributário
('Tributário', 'Reforma Tributária de 2023', 'Análise da EC 132/2023 e seus impactos', 'intermediario', false, 95, ARRAY[3,4,5], ARRAY['EC 132/2023', 'CTN'], true),
('Tributário', 'Tributação de Criptomoedas', 'Regime tributário aplicável aos criptoativos', 'intermediario', false, 88, ARRAY[3,4,5], ARRAY['IN RFB 1.888/2019', 'Lei 14.478/2022'], true),
('Tributário', 'IBS e CBS: Novo Sistema Tributário', 'Implementação dos novos tributos sobre consumo', 'avancado', false, 90, ARRAY[4,5], ARRAY['EC 132/2023'], true),
('Tributário', 'Planejamento Tributário e Limites', 'Diferença entre elisão e evasão fiscal após CARF', 'intermediario', true, 50, ARRAY[3,4,5], ARRAY['CTN'], false),

-- Direito Civil
('Civil', 'Smart Contracts e Teoria Contratual', 'Natureza jurídica dos contratos inteligentes baseados em blockchain', 'avancado', false, 88, ARRAY[4,5], ARRAY['Código Civil'], true),
('Civil', 'Direito ao Esquecimento na Era Digital', 'Conflito entre memória coletiva e privacidade individual', 'intermediario', true, 60, ARRAY[3,4,5], ARRAY['Marco Civil', 'LGPD', 'Código Civil'], false),
('Civil', 'Herança Digital', 'Sucessão de bens e contas digitais', 'intermediario', false, 82, ARRAY[3,4,5], ARRAY['Código Civil'], false),
('Civil', 'Responsabilidade Civil por Algoritmos', 'Danos causados por decisões automatizadas', 'avancado', false, 90, ARRAY[4,5], ARRAY['Código Civil', 'CDC'], true),
('Civil', 'Dano Moral no CDC', 'Quantificação e limites do dano moral nas relações de consumo', 'iniciante', true, 40, ARRAY[3,4], ARRAY['CDC', 'Código Civil'], false),

-- Direito Ambiental
('Ambiental', 'Créditos de Carbono e Mercado Regulado', 'Implementação do mercado de carbono brasileiro após regulamentação', 'avancado', false, 93, ARRAY[4,5], ARRAY['Código Florestal', 'Acordo de Paris'], true),
('Ambiental', 'ESG e Responsabilidade Empresarial', 'Governança ambiental corporativa e implicações jurídicas', 'intermediario', false, 85, ARRAY[3,4,5], ARRAY['Lei 6.938/81'], false),
('Ambiental', 'Mudanças Climáticas e Litígios', 'Judicialização das políticas climáticas', 'avancado', false, 88, ARRAY[4,5], ARRAY['Constituição Federal', 'Lei 6.938/81'], true),

-- Direito Empresarial
('Empresarial', 'Recuperação Judicial de Startups', 'Aplicação da Lei de Falências a empresas de tecnologia', 'intermediario', false, 80, ARRAY[3,4,5], ARRAY['Lei 11.101/2005', 'Marco Legal das Startups'], false),
('Empresarial', 'Tokenização de Ativos', 'Regime jurídico dos security tokens e utility tokens', 'avancado', false, 92, ARRAY[4,5], ARRAY['Lei 6.385/76', 'CVM'], true),
('Empresarial', 'Sociedades de Propósito Específico', 'SPEs para projetos de infraestrutura e PPPs', 'intermediario', false, 70, ARRAY[3,4,5], ARRAY['Lei 11.079/2004', 'Código Civil'], false),

-- Direito Internacional
('Internacional', 'Regulação Global da IA', 'Convergência regulatória internacional para inteligência artificial', 'avancado', false, 94, ARRAY[4,5], ARRAY['Tratados Internacionais'], true),
('Internacional', 'Proteção de Dados Transfronteiriça', 'Transferência internacional de dados após LGPD e GDPR', 'intermediario', false, 85, ARRAY[3,4,5], ARRAY['LGPD', 'GDPR'], false),
('Internacional', 'Criptoativos e Soberania Monetária', 'Impacto das moedas digitais na ordem monetária internacional', 'avancado', false, 80, ARRAY[4,5], ARRAY['Lei 14.478/2022'], false);