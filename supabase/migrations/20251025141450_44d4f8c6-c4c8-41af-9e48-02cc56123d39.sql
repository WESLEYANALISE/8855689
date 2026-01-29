-- Tabela de Vagas de Estágio
CREATE TABLE IF NOT EXISTS public.estagios_vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  empresa TEXT NOT NULL,
  local TEXT,
  estado TEXT,
  descricao TEXT,
  area_direito TEXT,
  tipo_vaga TEXT,
  requisitos TEXT[],
  beneficios TEXT,
  link_candidatura TEXT,
  remuneracao TEXT,
  carga_horaria TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ativo BOOLEAN DEFAULT true,
  origem TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Vagas Favoritas
CREATE TABLE IF NOT EXISTS public.estagios_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vaga_id UUID REFERENCES public.estagios_vagas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, vaga_id)
);

-- Tabela de Dicas para Estágio
CREATE TABLE IF NOT EXISTS public.estagios_dicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  icone TEXT,
  ordem INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies para estagios_vagas (público para leitura)
ALTER TABLE public.estagios_vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vagas são públicas para leitura"
  ON public.estagios_vagas
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode gerenciar vagas"
  ON public.estagios_vagas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies para estagios_favoritos
ALTER TABLE public.estagios_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus favoritos"
  ON public.estagios_favoritos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem adicionar favoritos"
  ON public.estagios_favoritos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover favoritos"
  ON public.estagios_favoritos
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para estagios_dicas (público para leitura)
ALTER TABLE public.estagios_dicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dicas são públicas para leitura"
  ON public.estagios_dicas
  FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode gerenciar dicas"
  ON public.estagios_dicas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_estagios_vagas_area ON public.estagios_vagas(area_direito);
CREATE INDEX IF NOT EXISTS idx_estagios_vagas_estado ON public.estagios_vagas(estado);
CREATE INDEX IF NOT EXISTS idx_estagios_vagas_ativo ON public.estagios_vagas(ativo);
CREATE INDEX IF NOT EXISTS idx_estagios_favoritos_user ON public.estagios_favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_estagios_dicas_categoria ON public.estagios_dicas(categoria);

-- Popular tabela de dicas com conteúdo inicial
INSERT INTO public.estagios_dicas (titulo, categoria, conteudo, icone, ordem) VALUES
('Como Estruturar seu Currículo Jurídico', 'curriculo', '## Estrutura Básica de um Currículo Jurídico

**1. Dados Pessoais**
- Nome completo
- Contatos (telefone, e-mail profissional, LinkedIn)
- Cidade/Estado

**2. Objetivo Profissional**
Seja específico! Exemplo: "Estudante de Direito buscando estágio na área de Direito Civil para desenvolver habilidades em petições e acompanhamento processual."

**3. Formação Acadêmica**
- Nome da instituição
- Curso e semestre atual
- Previsão de formatura
- Média (se for boa)

**4. Experiências (se houver)**
- Estágios anteriores
- Projetos acadêmicos relevantes
- Monitoria ou extensão

**5. Qualificações**
- Cursos complementares
- OAB (se aprovado)
- Idiomas
- Tecnologia (ex: sistemas jurídicos)

**Dicas Importantes:**
✅ Use fonte profissional (Arial, Calibri)
✅ Máximo de 1 página
✅ Destaque conquistas com números
✅ Revise ortografia e gramática', '📝', 1),

('O que Colocar no Objetivo Profissional', 'curriculo', '## Objetivo Profissional Eficaz

**O que DEVE conter:**
- Seu status atual (estudante, semestre)
- Área de interesse específica
- O que você busca desenvolver
- Como você pode contribuir

**Exemplos Bons:**
✅ "Estudante de Direito (7º semestre) buscando estágio em Direito do Trabalho para aplicar conhecimentos em processos trabalhistas e desenvolver habilidades em mediação e conciliação."

✅ "Acadêmico de Direito com interesse em Direito Penal, buscando primeira oportunidade de estágio para acompanhar audiências e desenvolver raciocínio jurídico prático."

**Exemplos Ruins:**
❌ "Buscando oportunidade de crescimento profissional" (muito genérico)
❌ "Quero trabalhar em escritório de advocacia" (sem especificidade)

**Dica de Ouro:**
Adapte seu objetivo para cada vaga! Demonstre que você pesquisou sobre a empresa e a área.', '🎯', 2),

('Perguntas Comuns em Entrevistas', 'entrevista', '## Perguntas Frequentes e Como Responder

**1. "Fale sobre você"**
Resposta sugerida: Inicie com sua formação, destaque experiências relevantes (mesmo que acadêmicas) e conecte com a vaga.

**2. "Por que você quer trabalhar aqui?"**
Pesquise sobre a empresa! Mencione valores, casos relevantes ou área de atuação que te atraem.

**3. "Qual sua maior qualidade?"**
Escolha algo relevante para Direito: organização, raciocínio analítico, comunicação, ética.

**4. "Qual seu maior defeito?"**
Seja honesto mas estratégico. Exemplo: "Às vezes sou muito detalhista, mas estou aprendendo a equilibrar qualidade com prazos."

**5. "Onde você se vê em 5 anos?"**
Demonstre ambição realista: "Me vejo como advogado(a) com experiência sólida na área X, possivelmente cursando pós-graduação."

**6. "Por que escolheu Direito?"**
Seja autêntico. Evite clichês como "sempre quis ajudar pessoas".

**Dicas Importantes:**
✅ Mantenha contato visual
✅ Responda com confiança mas sem arrogância
✅ Use exemplos concretos quando possível
✅ Faça perguntas ao final (demonstra interesse)', '💬', 3),

('Como se Vestir para Entrevista', 'entrevista', '## Dress Code para Entrevistas Jurídicas

**Regra Geral: Formal e Conservador**

**Para Homens:**
✅ Terno completo (cores neutras: preto, azul marinho, cinza)
✅ Camisa social clara (branca ou azul claro)
✅ Gravata discreta
✅ Sapato social preto bem engraxado
✅ Meias escuras
✅ Barba feita ou aparada
✅ Cabelo arrumado
❌ Evite: tênis, jeans, cores chamativas

**Para Mulheres:**
✅ Terno ou conjunto social
✅ Blusa discreta (sem decote)
✅ Saia na altura do joelho ou calça social
✅ Sapato fechado de salto baixo/médio
✅ Maquiagem natural
✅ Cabelo preso ou bem arrumado
✅ Unhas limpas (esmalte neutro)
❌ Evite: roupas justas, salto muito alto, acessórios exagerados

**Dicas Universais:**
- Roupas limpas e bem passadas
- Perfume/colônia suave
- Evite excesso de acessórios
- Em caso de dúvida, seja mais formal

**Observação:**
Startups jurídicas podem ter dress code mais casual, mas é melhor errar pelo excesso de formalidade na primeira entrevista.', '👔', 4),

('Networking para Estagiários', 'networking', '## Como Fazer Networking Eficaz no Meio Jurídico

**1. Dentro da Faculdade**
- Participe de grupos de estudo
- Envolva-se em projetos de extensão
- Frequente palestras e eventos jurídicos
- Conecte-se com professores

**2. Redes Sociais Profissionais**
- **LinkedIn**: Otimize seu perfil, compartilhe conteúdo jurídico, conecte-se com profissionais da área
- Siga escritórios e profissionais de referência
- Comente em posts de forma inteligente

**3. Eventos Jurídicos**
- Participe de congressos, seminários e workshops
- Leve cartões de visita (mesmo sendo estagiário)
- Faça perguntas durante palestras
- Conecte-se no LinkedIn após o evento

**4. Durante o Estágio**
- Seja proativo e cordial com todos
- Peça conselhos e feedback
- Ofereça ajuda em projetos
- Mantenha contato mesmo após o estágio

**Dica de Ouro:**
Networking não é sobre "usar" pessoas, mas construir relacionamentos genuínos. Seja autêntico e também ofereça valor (compartilhe artigos, indique contatos, ajude quando puder).', '🤝', 5),

('O que Fazer nos Primeiros Dias', 'primeiros-dias', '## Guia de Sobrevivência: Primeiros Dias de Estágio

**Primeiro Dia:**
✅ Chegue 15 minutos antes
✅ Vista-se formalmente
✅ Leve bloco de anotações e caneta
✅ Apresente-se a todos com educação
✅ Anote nomes e funções
✅ Tire dúvidas sobre rotina e expectativas
✅ Pergunte sobre dress code

**Primeira Semana:**
✅ Observe como as coisas funcionam
✅ Aprenda a usar os sistemas
✅ Familiarize-se com a estrutura
✅ Não tenha medo de perguntar
✅ Faça anotações de tudo
✅ Demonstre proatividade

**Primeiro Mês:**
✅ Comece a propor melhorias (com cuidado)
✅ Peça feedback sobre seu desempenho
✅ Busque assumir mais responsabilidades
✅ Desenvolva relacionamento com equipe

**O que NUNCA fazer:**
❌ Chegar atrasado
❌ Usar celular excessivamente
❌ Reclamar de tarefas
❌ Falar mal de colegas
❌ Discutir processos em público
❌ Fingir que sabe quando não sabe', '🚀', 6),

('Como se Destacar no Estágio', 'destaque', '## 10 Formas de se Destacar como Estagiário

**1. Seja Pontual e Assíduo**
A confiabilidade é fundamental. Esteja sempre no horário (ou antes).

**2. Demonstre Proatividade**
Não espere só receber ordens. Identifique tarefas e pergunte se pode ajudar.

**3. Aprenda Rápido**
Anote processos, crie seu próprio manual de procedimentos, evite perguntar a mesma coisa duas vezes.

**4. Atenção aos Detalhes**
Revise seus trabalhos antes de entregar. Erros de português são imperdoáveis no Direito.

**5. Mantenha Organização**
Use ferramentas de gestão (planilhas, Trello, Notion) para controlar prazos e tarefas.

**6. Estude Constantemente**
Quando tiver tempo livre, leia doutrina, jurisprudência ou doutrinas sobre os casos que está acompanhando.

**7. Peça Feedback**
Demonstra maturidade e vontade de crescer. Pergunte como pode melhorar.

**8. Seja Educado com Todos**
Do sócio ao office boy. Humildade e respeito abrem portas.

**9. Vista-se Adequadamente**
Mantenha sempre o padrão profissional.

**10. Entregue Mais do que Pediram**
Surpreenda positivamente. Se pediram pesquisa, entregue pesquisa + análise resumida.

**Bônus:**
Construa sua marca pessoal. Publique artigos, participe de eventos, compartilhe conhecimento.', '⭐', 7),

('Como Equilibrar Estágio e Faculdade', 'equilibrio', '## Gestão de Tempo: Estágio + Faculdade

**Planejamento é Tudo**

**1. Organize sua Semana**
- Use agenda (física ou digital)
- Bloqueie horários para cada atividade
- Inclua tempo de deslocamento
- Reserve períodos de estudo

**2. Otimize seu Tempo**
- Estude no transporte público
- Use intervalos para revisar matéria
- Grave áudios de resumos para ouvir
- Aplique conceitos do estágio na faculdade

**3. Priorize com Sabedoria**
🔴 Alta prioridade: Prazos de trabalho, provas
🟡 Média prioridade: Trabalhos acadêmicos, leituras
🟢 Baixa prioridade: Eventos opcionais

**4. Comunique-se**
- Informe seu supervisor sobre períodos de prova
- Converse com professores se tiver dificuldades
- Seja transparente sobre suas limitações

**5. Cuide de Si**
⚠️ Não sacrifique:
- Sono adequado (mínimo 6-7h)
- Alimentação saudável
- Exercício físico (mesmo que 30min/dia)
- Momentos de lazer

**Sinais de Alerta:**
- Queda no rendimento acadêmico
- Erros frequentes no trabalho
- Cansaço extremo constante
- Ansiedade ou estresse excessivo

Se identificar esses sinais, peça ajuda e considere reajustar sua carga de atividades.', '⚖️', 8);

-- Popular tabela de vagas com exemplos (seed data)
INSERT INTO public.estagios_vagas (titulo, empresa, local, estado, descricao, area_direito, tipo_vaga, requisitos, beneficios, link_candidatura, remuneracao, carga_horaria, origem) VALUES
('Estágio em Direito Civil', 'Silva & Associados Advocacia', 'São Paulo - SP', 'SP', 'Escritório tradicional busca estagiário para atuar na área de Direito Civil, com foco em contratos, responsabilidade civil e família. Oportunidade de aprender com profissionais experientes e acompanhar processos relevantes.', 'Civil', 'Escritório', ARRAY['Cursando Direito (a partir do 3º semestre)', 'Conhecimento em Processo Civil', 'Disponibilidade 6h/dia'], 'Vale-transporte, Vale-refeição, Auxílio educação', 'https://example.com/vaga1', 'R$ 1.200,00', '6 horas/dia', 'manual'),

('Estágio em Direito Penal', 'Defesa Criminal Advocacia', 'Rio de Janeiro - RJ', 'RJ', 'Escritório especializado em Direito Penal busca estagiário(a) para acompanhamento de audiências, elaboração de peças processuais e pesquisa jurisprudencial. Ambiente dinâmico com casos desafiadores.', 'Penal', 'Escritório', ARRAY['Cursando Direito (5º semestre em diante)', 'Interesse em Direito Penal', 'Boa redação jurídica'], 'Bolsa-auxílio, Vale-transporte, Vale-alimentação, Plano de saúde', 'https://example.com/vaga2', 'R$ 1.500,00', '6 horas/dia', 'manual'),

('Estágio em Direito do Trabalho', 'Trabalhista Brasil Advocacia', 'Belo Horizonte - MG', 'MG', 'Estágio na área trabalhista com foco em processos judiciais e consultoria preventiva. Oportunidade de atuar em todos os aspectos do Direito do Trabalho, desde admissão até rescisão.', 'Trabalhista', 'Escritório', ARRAY['Cursando Direito (4º semestre em diante)', 'Conhecimentos básicos em CLT', 'Disponibilidade para viagens ocasionais'], 'R$ 1.300,00 + benefícios, Vale-transporte, Vale-refeição', 'https://example.com/vaga3', 'R$ 1.300,00', '6 horas/dia', 'manual'),

('Estágio Jurídico Corporativo', 'TechBrasil S.A.', 'São Paulo - SP', 'SP', 'Multinacional de tecnologia busca estagiário para atuar no departamento jurídico corporativo. Atividades incluem análise de contratos, compliance, propriedade intelectual e suporte a operações comerciais.', 'Empresarial', 'Empresa', ARRAY['Cursando Direito (a partir do 6º semestre)', 'Inglês intermediário/avançado', 'Conhecimento em contratos', 'Excel intermediário'], 'Bolsa competitiva, Plano de saúde, Vale-refeição, Vale-transporte, Gympass, Auxílio educação', 'https://example.com/vaga4', 'R$ 2.000,00', '6 horas/dia', 'manual'),

('Estágio em Compliance', 'Banco Nacional S.A.', 'São Paulo - SP', 'SP', 'Instituição financeira busca estagiário para área de Compliance e Prevenção à Lavagem de Dinheiro. Análise de operações, due diligence e elaboração de relatórios.', 'Empresarial', 'Empresa', ARRAY['Cursando Direito (5º semestre em diante)', 'Perfil analítico', 'Conhecimentos em Excel'], 'R$ 1.800,00, Plano de saúde, Vale-refeição, Vale-transporte, PLR', 'https://example.com/vaga5', 'R$ 1.800,00', '6 horas/dia', 'manual'),

('Estágio na Defensoria Pública', 'Defensoria Pública do Estado', 'Porto Alegre - RS', 'RS', 'Oportunidade de atuar na defesa de direitos de pessoas em vulnerabilidade social. Acompanhamento de audiências, atendimento ao público e elaboração de peças processuais.', 'Público', 'Órgão Público', ARRAY['Cursando Direito (a partir do 4º semestre)', 'Sensibilidade social', 'Comprometimento com causas públicas'], 'Bolsa-auxílio, Vale-transporte', 'https://example.com/vaga6', 'R$ 1.000,00', '4 horas/dia', 'manual'),

('Estágio em Procuradoria Municipal', 'Prefeitura Municipal', 'Curitiba - PR', 'PR', 'Estágio na Procuradoria Geral do Município. Atividades de consultoria jurídica, análise de processos administrativos e representação do município.', 'Público', 'Órgão Público', ARRAY['Cursando Direito (6º semestre em diante)', 'Conhecimento em Direito Administrativo', 'Disponibilidade integral'], 'Bolsa-auxílio de R$ 900,00, Vale-transporte', 'https://example.com/vaga7', 'R$ 900,00', '6 horas/dia', 'manual'),

('Estágio em Direitos Humanos', 'Instituto de Justiça Social', 'Salvador - BA', 'BA', 'ONG que atua na defesa de direitos humanos busca estagiário(a) comprometido(a) com causas sociais. Atuação em litígio estratégico, advocacy e educação em direitos.', 'Direitos Humanos', 'ONG', ARRAY['Cursando Direito (a partir do 3º semestre)', 'Interesse em causas sociais', 'Boa comunicação escrita e oral'], 'Bolsa-auxílio, Vale-transporte', 'https://example.com/vaga8', 'R$ 800,00', '4 horas/dia', 'manual'),

('Estágio em Direito Ambiental', 'GreenLaw Advocacia', 'Brasília - DF', 'DF', 'Escritório especializado em Direito Ambiental busca estagiário para atuar em licenciamento ambiental, processos administrativos e consultoria preventiva.', 'Ambiental', 'Escritório', ARRAY['Cursando Direito (5º semestre em diante)', 'Interesse em sustentabilidade', 'Conhecimento em legislação ambiental'], 'R$ 1.400,00, Vale-transporte, Vale-alimentação', 'https://example.com/vaga9', 'R$ 1.400,00', '6 horas/dia', 'manual'),

('Estágio Remoto em Direito Digital', 'LegalTech Inovação', 'Remoto', 'Nacional', 'Startup de tecnologia jurídica busca estagiário para atuar remotamente em projetos de Direito Digital, LGPD, contratos de tecnologia e propriedade intelectual.', 'Digital', 'Startup', ARRAY['Cursando Direito (4º semestre em diante)', 'Afinidade com tecnologia', 'Conhecimento em LGPD', 'Inglês intermediário'], 'Bolsa-auxílio competitiva, Trabalho 100% remoto, Horário flexível, Equipamento fornecido', 'https://example.com/vaga10', 'R$ 1.600,00', '6 horas/dia', 'manual'),

('Estágio em Direito do Consumidor', 'Procon Estadual', 'Fortaleza - CE', 'CE', 'Estágio no Procon para atuar em atendimento ao consumidor, análise de reclamações e processos administrativos relacionados ao CDC.', 'Consumidor', 'Órgão Público', ARRAY['Cursando Direito (3º semestre em diante)', 'Conhecimento em CDC', 'Boa comunicação interpessoal'], 'Bolsa-auxílio, Vale-transporte', 'https://example.com/vaga11', 'R$ 850,00', '4 horas/dia', 'manual'),

('Estágio em Direito Tributário', 'Fisco & Cia Consultoria', 'São Paulo - SP', 'SP', 'Consultoria tributária busca estagiário para auxílio em planejamento tributário, análise fiscal e processos administrativos fiscais.', 'Tributário', 'Escritório', ARRAY['Cursando Direito (6º semestre em diante)', 'Conhecimento em tributos', 'Excel avançado desejável'], 'R$ 1.700,00, Vale-refeição, Vale-transporte, Plano de saúde após 6 meses', 'https://example.com/vaga12', 'R$ 1.700,00', '6 horas/dia', 'manual'),

('Estágio em Direito Previdenciário', 'Advocacia Previdenciarista', 'Porto Alegre - RS', 'RS', 'Escritório especializado em benefícios do INSS busca estagiário para acompanhamento de processos judiciais e administrativos previdenciários.', 'Previdenciário', 'Escritório', ARRAY['Cursando Direito (4º semestre em diante)', 'Interesse em Direito Previdenciário', 'Organização e atenção aos detalhes'], 'R$ 1.100,00, Vale-transporte, Vale-refeição', 'https://example.com/vaga13', 'R$ 1.100,00', '6 horas/dia', 'manual'),

('Estágio em Direito Imobiliário', 'Imóveis Legais Advocacia', 'Rio de Janeiro - RJ', 'RJ', 'Estágio focado em contratos imobiliários, análise de documentação, due diligence e acompanhamento de transações.', 'Imobiliário', 'Escritório', ARRAY['Cursando Direito (5º semestre em diante)', 'Conhecimento em Direito Civil', 'Atenção a detalhes'], 'R$ 1.350,00, Vale-transporte, Vale-alimentação', 'https://example.com/vaga14', 'R$ 1.350,00', '6 horas/dia', 'manual'),

('Estágio em Arbitragem', 'Centro de Arbitragem Brasil', 'São Paulo - SP', 'SP', 'Oportunidade única de atuar em procedimentos arbitrais, pesquisa jurídica especializada e suporte a árbitros.', 'Arbitragem', 'Instituição', ARRAY['Cursando Direito (7º semestre em diante)', 'Inglês fluente', 'Excelente redação'], 'R$ 2.200,00, Vale-refeição, Vale-transporte, Plano de saúde', 'https://example.com/vaga15', 'R$ 2.200,00', '6 horas/dia', 'manual'),

('Estágio em Advocacia Criminal', 'Criminalistas Unidos', 'Brasília - DF', 'DF', 'Escritório renomado em defesa criminal busca estagiário para acompanhamento de investigações, audiências e elaboração de defesas.', 'Penal', 'Escritório', ARRAY['Cursando Direito (5º semestre em diante)', 'Conhecimento em CPP e CP', 'Disponibilidade para audiências'], 'R$ 1.600,00, Vale-transporte, Vale-alimentação, Plano de saúde', 'https://example.com/vaga16', 'R$ 1.600,00', '6 horas/dia', 'manual'),

('Estágio em Direito da Saúde', 'Hospital Universitário', 'São Paulo - SP', 'SP', 'Estágio no departamento jurídico de hospital universitário. Atuação em questões de responsabilidade médica, regulação de saúde e contratos.', 'Saúde', 'Hospital', ARRAY['Cursando Direito (4º semestre em diante)', 'Interesse em Direito da Saúde', 'Discrição e ética'], 'R$ 1.200,00, Vale-refeição no local, Vale-transporte', 'https://example.com/vaga17', 'R$ 1.200,00', '6 horas/dia', 'manual'),

('Estágio em Direito Desportivo', 'Sports Law Consultoria', 'Rio de Janeiro - RJ', 'RJ', 'Consultoria especializada em Direito Desportivo busca estagiário para atuar com contratos de atletas, transferências e questões regulatórias.', 'Desportivo', 'Consultoria', ARRAY['Cursando Direito (5º semestre em diante)', 'Interesse em esportes', 'Inglês intermediário'], 'R$ 1.500,00, Vale-transporte, Vale-alimentação, Networking no meio esportivo', 'https://example.com/vaga18', 'R$ 1.500,00', '6 horas/dia', 'manual'),

('Estágio em Direito de Família', 'Família & Sucessões Advocacia', 'Belo Horizonte - MG', 'MG', 'Escritório especializado em Direito de Família e Sucessões busca estagiário sensível e comprometido para acompanhamento de casos.', 'Família', 'Escritório', ARRAY['Cursando Direito (3º semestre em diante)', 'Empatia e discrição', 'Boa comunicação'], 'R$ 1.150,00, Vale-transporte, Vale-refeição', 'https://example.com/vaga19', 'R$ 1.150,00', '6 horas/dia', 'manual'),

('Estágio em Advocacia Contenciosa', 'Litígio Estratégico Advocacia', 'Curitiba - PR', 'PR', 'Escritório boutique focado em litígios complexos busca estagiário para pesquisa aprofundada, análise de casos e suporte em estratégias processuais.', 'Contencioso', 'Escritório', ARRAY['Cursando Direito (6º semestre em diante)', 'Raciocínio analítico forte', 'Inglês avançado diferencial'], 'R$ 1.800,00, Vale-transporte, Vale-alimentação, Plano de saúde, Bônus por desempenho', 'https://example.com/vaga20', 'R$ 1.800,00', '6 horas/dia', 'manual');