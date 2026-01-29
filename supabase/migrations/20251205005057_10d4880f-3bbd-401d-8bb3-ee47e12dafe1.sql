-- Tabela para armazenar os artigos do Blogger Jurídico
CREATE TABLE public."BLOGGER_JURIDICO" (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL CHECK (categoria IN ('advogado', 'prf', 'pf', 'juiz', 'delegado')),
  ordem INTEGER NOT NULL CHECK (ordem >= 1 AND ordem <= 20),
  titulo TEXT NOT NULL,
  descricao_curta TEXT,
  topicos TEXT[],
  fontes_referencia TEXT[],
  conteudo_gerado TEXT,
  url_capa TEXT,
  url_audio TEXT,
  gerado_em TIMESTAMP WITH TIME ZONE,
  cache_validade TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(categoria, ordem)
);

-- Habilitar RLS
ALTER TABLE public."BLOGGER_JURIDICO" ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Blogger Jurídico é público para leitura"
ON public."BLOGGER_JURIDICO"
FOR SELECT
USING (true);

CREATE POLICY "Sistema pode atualizar Blogger Jurídico"
ON public."BLOGGER_JURIDICO"
FOR UPDATE
USING (true);

CREATE POLICY "Sistema pode inserir no Blogger Jurídico"
ON public."BLOGGER_JURIDICO"
FOR INSERT
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_blogger_juridico_categoria ON public."BLOGGER_JURIDICO" (categoria);
CREATE INDEX idx_blogger_juridico_ordem ON public."BLOGGER_JURIDICO" (categoria, ordem);

-- Inserir dados iniciais - ADVOGADO (20 artigos)
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos) VALUES
('advogado', 1, 'O que é ser advogado? Introdução à profissão', 'Conheça a nobre profissão de advogado, sua importância para a sociedade e o papel fundamental na defesa dos direitos.', ARRAY['Definição de advogado', 'Função social', 'Prerrogativas', 'Deveres profissionais']),
('advogado', 2, 'História da advocacia no Brasil', 'Uma jornada através da história da advocacia brasileira, desde o período colonial até os dias atuais.', ARRAY['Período colonial', 'Criação da OAB', 'Evolução histórica', 'Marcos importantes']),
('advogado', 3, 'Como funciona a faculdade de Direito', 'Tudo sobre o curso de Direito: duração, disciplinas, estágio obrigatório e como se preparar para essa jornada.', ARRAY['Grade curricular', 'Duração do curso', 'Estágio obrigatório', 'TCC']),
('advogado', 4, 'O Exame da OAB - Tudo que você precisa saber', 'Guia completo sobre o Exame de Ordem: fases, conteúdo, dicas de estudo e como se preparar para a aprovação.', ARRAY['Primeira fase', 'Segunda fase', 'Conteúdo programático', 'Dicas de aprovação']),
('advogado', 5, 'Ética profissional e o Código de Ética da OAB', 'Entenda os princípios éticos que regem a advocacia e a importância do Código de Ética e Disciplina.', ARRAY['Princípios éticos', 'Código de Ética', 'Deveres do advogado', 'Infrações disciplinares']),
('advogado', 6, 'Áreas de atuação da advocacia', 'Conheça as diversas áreas do Direito e descubra qual combina mais com seu perfil profissional.', ARRAY['Direito Civil', 'Direito Penal', 'Direito Trabalhista', 'Direito Empresarial']),
('advogado', 7, 'Como escolher sua especialização', 'Orientações para escolher a área de atuação ideal baseado em suas habilidades, interesses e mercado.', ARRAY['Autoconhecimento', 'Análise de mercado', 'Pós-graduação', 'Tendências']),
('advogado', 8, 'Advocacia pública vs advocacia privada', 'Compare as duas carreiras: vantagens, desvantagens, remuneração e estilo de vida de cada uma.', ARRAY['Advocacia pública', 'Advocacia privada', 'Concursos públicos', 'Autonomia profissional']),
('advogado', 9, 'Como montar um escritório de advocacia', 'Passo a passo para abrir seu próprio escritório: estrutura, documentação, custos e primeiros passos.', ARRAY['Planejamento', 'Estrutura física', 'Documentação', 'Investimento inicial']),
('advogado', 10, 'Marketing jurídico - O que pode e não pode', 'Aprenda as regras do marketing na advocacia e como divulgar seu trabalho de forma ética e eficiente.', ARRAY['Regras da OAB', 'Marketing digital', 'Redes sociais', 'Publicidade permitida']),
('advogado', 11, 'Honorários advocatícios - Como cobrar', 'Entenda como precificar seus serviços, tabela da OAB, contratos e formas de cobrança.', ARRAY['Tabela OAB', 'Contrato de honorários', 'Formas de cobrança', 'Honorários sucumbenciais']),
('advogado', 12, 'Relacionamento com clientes', 'Técnicas para construir uma relação de confiança com seus clientes e fidelizá-los.', ARRAY['Comunicação efetiva', 'Gestão de expectativas', 'Atendimento', 'Fidelização']),
('advogado', 13, 'Tecnologia na advocacia moderna', 'Ferramentas e softwares essenciais para o advogado moderno: gestão, pesquisa e automação.', ARRAY['Softwares jurídicos', 'Processo eletrônico', 'Inteligência artificial', 'Automação']),
('advogado', 14, 'Networking jurídico - Construindo sua rede', 'A importância do networking e como construir uma rede de contatos sólida na área jurídica.', ARRAY['Eventos jurídicos', 'Associações', 'LinkedIn', 'Parcerias']),
('advogado', 15, 'Como conseguir seus primeiros clientes', 'Estratégias práticas para advogados iniciantes conquistarem seus primeiros clientes.', ARRAY['Indicações', 'Presença online', 'Pro bono', 'Parcerias']),
('advogado', 16, 'Audiências e sustentações orais', 'Prepare-se para suas primeiras audiências: postura, técnicas de oratória e dicas práticas.', ARRAY['Preparação', 'Oratória', 'Postura', 'Técnicas de argumentação']),
('advogado', 17, 'Gestão de tempo para advogados', 'Aprenda a gerenciar prazos, organizar tarefas e aumentar sua produtividade na advocacia.', ARRAY['Gestão de prazos', 'Organização', 'Produtividade', 'Ferramentas']),
('advogado', 18, 'Advocacia contenciosa vs consultiva', 'Entenda as diferenças entre atuar em processos judiciais e na assessoria preventiva.', ARRAY['Contencioso', 'Consultivo', 'Preventivo', 'Perfil profissional']),
('advogado', 19, 'Tendências futuras da advocacia', 'O futuro da profissão: novas tecnologias, mudanças no mercado e como se preparar.', ARRAY['Legal tech', 'Novas áreas', 'Transformação digital', 'Adaptação']),
('advogado', 20, 'Dicas de advogados experientes', 'Conselhos valiosos de profissionais renomados para quem está começando na carreira.', ARRAY['Conselhos práticos', 'Erros a evitar', 'Lições aprendidas', 'Inspiração']);

-- Inserir dados iniciais - PRF (20 artigos)
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos) VALUES
('prf', 1, 'O que é a Polícia Rodoviária Federal?', 'Conheça a PRF: história, missão institucional e a importância dessa força policial para o país.', ARRAY['História da PRF', 'Missão institucional', 'Estrutura organizacional', 'Importância social']),
('prf', 2, 'Atribuições e competências do PRF', 'Entenda todas as funções e responsabilidades legais de um Policial Rodoviário Federal.', ARRAY['Patrulhamento', 'Fiscalização', 'Atendimento de acidentes', 'Combate ao crime']),
('prf', 3, 'Como se tornar um PRF - Requisitos', 'Todos os requisitos necessários para ingressar na carreira de Policial Rodoviário Federal.', ARRAY['Idade', 'Escolaridade', 'CNH', 'Requisitos físicos']),
('prf', 4, 'O concurso da PRF - Visão geral', 'Tudo sobre o concurso: edital, bancas, fases e como funciona o processo seletivo.', ARRAY['Edital', 'Fases do concurso', 'Bancas organizadoras', 'Cronograma']),
('prf', 5, 'Provas objetivas do concurso PRF', 'Conteúdo programático, peso das matérias e estratégias de estudo para as provas objetivas.', ARRAY['Matérias cobradas', 'Peso das disciplinas', 'Estratégias', 'Material de estudo']),
('prf', 6, 'Teste de Aptidão Física (TAF) da PRF', 'Prepare-se para o TAF: exercícios exigidos, índices mínimos e dicas de treinamento.', ARRAY['Exercícios', 'Índices mínimos', 'Treinamento', 'Alimentação']),
('prf', 7, 'Avaliação psicológica na PRF', 'Entenda como funciona a avaliação psicológica e o perfil esperado do candidato.', ARRAY['Testes aplicados', 'Perfil esperado', 'Preparação', 'Eliminação']),
('prf', 8, 'Investigação social e de vida pregressa', 'Saiba como funciona a investigação e o que pode eliminar um candidato nessa fase.', ARRAY['Documentação', 'Antecedentes', 'Redes sociais', 'Critérios']),
('prf', 9, 'Curso de Formação Profissional da PRF', 'Como funciona o CFP: duração, conteúdo, localização e desafios dessa etapa decisiva.', ARRAY['Duração', 'Conteúdo', 'Academia', 'Avaliações']),
('prf', 10, 'Remuneração e benefícios do PRF', 'Salário inicial, progressão na carreira, benefícios e vantagens de ser PRF.', ARRAY['Salário', 'Auxílios', 'Progressão', 'Aposentadoria']),
('prf', 11, 'Rotina de trabalho do PRF', 'Como é o dia a dia de um Policial Rodoviário Federal: escalas, atividades e desafios.', ARRAY['Escalas', 'Patrulhamento', 'Fiscalização', 'Ocorrências']),
('prf', 12, 'Equipamentos e armamento do PRF', 'Conheça os equipamentos utilizados pela PRF: viaturas, armamento e tecnologia.', ARRAY['Viaturas', 'Armamento', 'Equipamentos', 'Tecnologia']),
('prf', 13, 'Legislação de trânsito para PRF', 'As principais leis de trânsito que todo candidato a PRF precisa dominar.', ARRAY['CTB', 'Infrações', 'Penalidades', 'Jurisprudência']),
('prf', 14, 'Direito Penal aplicado à PRF', 'Crimes de competência da PRF e noções essenciais de Direito Penal para o concurso.', ARRAY['Crimes de trânsito', 'Tráfico de drogas', 'Contrabando', 'Prisão em flagrante']),
('prf', 15, 'Direitos Humanos na atuação policial', 'A importância dos Direitos Humanos na atividade policial e seu impacto no concurso.', ARRAY['Princípios', 'Uso da força', 'Abordagem', 'Ética']),
('prf', 16, 'Policiamento especializado na PRF', 'Conheça as unidades especializadas: NEPOM, COT, GPM e outras.', ARRAY['NEPOM', 'COT', 'GPM', 'Especializações']),
('prf', 17, 'Como estudar para o concurso PRF', 'Metodologias de estudo, cronogramas e dicas de aprovados no concurso.', ARRAY['Planejamento', 'Ciclo de estudos', 'Revisão', 'Simulados']),
('prf', 18, 'Saúde mental e física na carreira PRF', 'Cuidados com a saúde física e mental essenciais para a carreira policial.', ARRAY['Estresse', 'Exercícios', 'Alimentação', 'Equilíbrio']),
('prf', 19, 'Carreira e progressão na PRF', 'Possibilidades de crescimento profissional dentro da Polícia Rodoviária Federal.', ARRAY['Classes', 'Promoções', 'Cursos', 'Liderança']),
('prf', 20, 'Depoimentos de policiais rodoviários federais', 'Histórias e conselhos de PRFs sobre a carreira e o concurso.', ARRAY['Experiências', 'Desafios', 'Recompensas', 'Conselhos']);

-- Inserir dados iniciais - PF (20 artigos)
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos) VALUES
('pf', 1, 'O que é a Polícia Federal?', 'Conheça a PF: história, missão institucional e sua importância no combate aos crimes federais.', ARRAY['História', 'Missão', 'Estrutura', 'Atribuições']),
('pf', 2, 'Cargos e carreiras na Polícia Federal', 'Entenda os diferentes cargos: Delegado, Agente, Escrivão, Perito e Papiloscopista.', ARRAY['Delegado', 'Agente', 'Escrivão', 'Perito']),
('pf', 3, 'Requisitos para ingressar na PF', 'Todos os requisitos necessários para cada cargo da Polícia Federal.', ARRAY['Escolaridade', 'Idade', 'Requisitos específicos', 'Incompatibilidades']),
('pf', 4, 'O concurso da PF - Estrutura geral', 'Visão completa do concurso: fases, bancas históricas e peculiaridades.', ARRAY['Fases', 'Bancas', 'Edital', 'Vagas']),
('pf', 5, 'Provas objetivas e discursivas da PF', 'Conteúdo programático e estratégias para as provas escritas do concurso.', ARRAY['Matérias', 'Prova discursiva', 'Estratégias', 'Pontuação']),
('pf', 6, 'TAF da Polícia Federal', 'Teste de Aptidão Física: exercícios, índices e preparação específica.', ARRAY['Exercícios', 'Índices', 'Preparação', 'Diferenças por cargo']),
('pf', 7, 'Avaliação médica e psicológica na PF', 'Como funcionam as avaliações de saúde física e mental no concurso.', ARRAY['Exames médicos', 'Perfil psicológico', 'Eliminação', 'Recursos']),
('pf', 8, 'Investigação social na Polícia Federal', 'O processo de investigação social e de vida pregressa na PF.', ARRAY['Critérios', 'Documentação', 'Vida pregressa', 'Recursos']),
('pf', 9, 'Academia Nacional de Polícia', 'O Curso de Formação Profissional na ANP em Brasília.', ARRAY['Duração', 'Disciplinas', 'Avaliações', 'Formatura']),
('pf', 10, 'Remuneração na Polícia Federal', 'Salários por cargo, benefícios e progressão na carreira.', ARRAY['Salários', 'Benefícios', 'Progressão', 'Comparativo']),
('pf', 11, 'Atribuições do Delegado de Polícia Federal', 'Funções específicas do cargo de Delegado na PF.', ARRAY['Inquérito', 'Operações', 'Gestão', 'Carreira']),
('pf', 12, 'Atribuições do Agente de Polícia Federal', 'O dia a dia e as funções do Agente de Polícia Federal.', ARRAY['Investigação', 'Operações', 'Plantão', 'Especialidades']),
('pf', 13, 'Operações especiais da PF', 'Conheça as grandes operações e o trabalho investigativo da PF.', ARRAY['Lava Jato', 'Combate ao tráfico', 'Crimes financeiros', 'Trabalho conjunto']),
('pf', 14, 'Direito Penal e Processual para PF', 'Os principais temas de Direito Penal e Processual para o concurso.', ARRAY['Crimes federais', 'Inquérito', 'Prisões', 'Competência']),
('pf', 15, 'Legislação especial para concurso PF', 'Leis especiais essenciais: drogas, armas, lavagem de dinheiro e outras.', ARRAY['Lei de Drogas', 'Estatuto do Desarmamento', 'Lavagem', 'Organizações criminosas']),
('pf', 16, 'Informática para concurso da PF', 'Conteúdo de informática cobrado nos concursos da Polícia Federal.', ARRAY['Segurança da informação', 'Redes', 'Sistemas', 'Crimes cibernéticos']),
('pf', 17, 'Estratégias de estudo para PF', 'Planejamento de estudos específico para cada cargo da PF.', ARRAY['Planejamento', 'Priorização', 'Material', 'Simulados']),
('pf', 18, 'Superintendências e lotação na PF', 'Como funciona a escolha de lotação e trabalho nas superintendências.', ARRAY['Lotação', 'Superintendências', 'Delegacias', 'Remoção']),
('pf', 19, 'Especializações dentro da PF', 'Áreas de especialização: COT, NEPOM, cibernéticos e outras.', ARRAY['COT', 'NEPOM', 'Cibernéticos', 'Inteligência']),
('pf', 20, 'Histórias de sucesso na Polícia Federal', 'Depoimentos e trajetórias de policiais federais.', ARRAY['Experiências', 'Desafios', 'Motivação', 'Conselhos']);

-- Inserir dados iniciais - JUIZ (20 artigos)
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos) VALUES
('juiz', 1, 'O que é ser juiz? A magistratura brasileira', 'Introdução à carreira de magistrado: função, importância e responsabilidades.', ARRAY['Função jurisdicional', 'Independência', 'Responsabilidade', 'Papel social']),
('juiz', 2, 'Estrutura do Poder Judiciário brasileiro', 'Entenda a organização do Judiciário: instâncias, tribunais e competências.', ARRAY['Instâncias', 'Tribunais', 'STF', 'Competências']),
('juiz', 3, 'Tipos de magistratura no Brasil', 'As diferentes carreiras: juiz estadual, federal, do trabalho e militar.', ARRAY['Justiça Estadual', 'Justiça Federal', 'Justiça do Trabalho', 'Justiça Militar']),
('juiz', 4, 'Requisitos para ser juiz', 'Todos os requisitos legais e práticos para ingressar na magistratura.', ARRAY['Bacharelado', 'Atividade jurídica', 'Idade', 'OAB']),
('juiz', 5, 'O concurso para magistratura - Visão geral', 'Estrutura dos concursos: fases, bancas e peculiaridades de cada tribunal.', ARRAY['Fases', 'Bancas', 'Tribunais', 'Edital']),
('juiz', 6, 'Provas objetivas na magistratura', 'Conteúdo, número de questões e estratégias para a primeira fase.', ARRAY['Matérias', 'Corte', 'Estratégias', 'Material']),
('juiz', 7, 'Provas discursivas e sentenças', 'Como se preparar para as provas escritas e elaboração de sentenças.', ARRAY['Sentença cível', 'Sentença penal', 'Dissertações', 'Recursos']),
('juiz', 8, 'Prova oral na magistratura', 'Preparação para a temida prova oral: bancas, postura e conteúdo.', ARRAY['Bancas', 'Postura', 'Conteúdo', 'Preparação']),
('juiz', 9, 'Avaliação de títulos e experiência', 'Como funciona a pontuação de títulos nos concursos de magistratura.', ARRAY['Mestrado', 'Doutorado', 'Experiência', 'Pontuação']),
('juiz', 10, 'Curso de formação de juízes', 'A escola da magistratura e o período probatório inicial.', ARRAY['Escola', 'Formação', 'Vitaliciamento', 'Avaliação']),
('juiz', 11, 'Remuneração e benefícios do juiz', 'Subsídio, auxílios, férias e benefícios da carreira de magistrado.', ARRAY['Subsídio', 'Auxílios', 'Férias', 'Aposentadoria']),
('juiz', 12, 'Rotina de trabalho do magistrado', 'O dia a dia de um juiz: audiências, sentenças, despachos e gestão.', ARRAY['Audiências', 'Sentenças', 'Despachos', 'Gestão do gabinete']),
('juiz', 13, 'Ética e conduta do magistrado', 'O Código de Ética da Magistratura e as responsabilidades do juiz.', ARRAY['Código de Ética', 'Imparcialidade', 'Deveres', 'Vedações']),
('juiz', 14, 'Direito Constitucional para magistratura', 'Os temas mais cobrados de Direito Constitucional nos concursos.', ARRAY['Controle de constitucionalidade', 'Direitos fundamentais', 'Organização do Estado', 'Remédios constitucionais']),
('juiz', 15, 'Direito Civil aprofundado para concursos', 'Temas avançados de Direito Civil para a magistratura.', ARRAY['Obrigações', 'Contratos', 'Família', 'Sucessões']),
('juiz', 16, 'Direito Penal e Processual Penal', 'Conteúdo essencial de Penal para concursos de magistratura.', ARRAY['Teoria do crime', 'Penas', 'Processo penal', 'Execução']),
('juiz', 17, 'Estratégias de estudo para magistratura', 'Planejamento de longo prazo para aprovação na magistratura.', ARRAY['Planejamento', 'Cursos', 'Grupos de estudo', 'Simulados']),
('juiz', 18, 'Carreira e progressão na magistratura', 'Entrância, promoção e possibilidades dentro da carreira.', ARRAY['Entrâncias', 'Promoção', 'Tribunais', 'CNJ']),
('juiz', 19, 'Desafios contemporâneos da magistratura', 'Os desafios atuais: volume processual, tecnologia e sociedade.', ARRAY['Volume de processos', 'PJe', 'Sociedade', 'Saúde mental']),
('juiz', 20, 'Conselhos de magistrados experientes', 'Depoimentos e dicas de juízes sobre a carreira e o concurso.', ARRAY['Experiências', 'Dicas', 'Motivação', 'Realidade da carreira']);

-- Inserir dados iniciais - DELEGADO (20 artigos)
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos) VALUES
('delegado', 1, 'O que é ser delegado de polícia?', 'Introdução à carreira de delegado: funções, importância e perfil profissional.', ARRAY['Função', 'Autoridade policial', 'Perfil', 'Importância']),
('delegado', 2, 'Delegado Civil vs Delegado Federal', 'Diferenças entre as carreiras de delegado estadual e federal.', ARRAY['Competências', 'Remuneração', 'Atuação', 'Concursos']),
('delegado', 3, 'Requisitos para ser delegado', 'Todos os requisitos legais para ingressar na carreira de delegado.', ARRAY['Bacharelado em Direito', 'Idade', 'CNH', 'OAB']),
('delegado', 4, 'O concurso para delegado - Estrutura', 'Visão geral dos concursos: fases, bancas e especificidades estaduais.', ARRAY['Fases', 'Bancas', 'Estados', 'Federal']),
('delegado', 5, 'Provas objetivas para delegado', 'Conteúdo programático e estratégias para as provas objetivas.', ARRAY['Matérias', 'Peso', 'Estratégias', 'Corte']),
('delegado', 6, 'Provas discursivas - Peças e dissertações', 'Preparação para provas escritas: peças práticas e questões dissertativas.', ARRAY['Peças', 'Dissertações', 'Estrutura', 'Correção']),
('delegado', 7, 'Prova oral para delegado', 'Como funciona e como se preparar para a prova oral.', ARRAY['Formato', 'Banca', 'Conteúdo', 'Preparação']),
('delegado', 8, 'TAF e avaliação médica', 'Teste físico e exames médicos nos concursos de delegado.', ARRAY['TAF', 'Exames', 'Preparação física', 'Eliminação']),
('delegado', 9, 'Investigação social e psicológica', 'As fases de investigação de vida pregressa e avaliação psicológica.', ARRAY['Investigação', 'Psicológico', 'Critérios', 'Recursos']),
('delegado', 10, 'Academia de Polícia - Formação', 'O curso de formação para delegados: duração, conteúdo e avaliações.', ARRAY['Academia', 'Duração', 'Disciplinas', 'Avaliação']),
('delegado', 11, 'Remuneração do delegado de polícia', 'Salários nos diferentes estados e na PF, benefícios e progressão.', ARRAY['Salário inicial', 'Estados', 'Federal', 'Benefícios']),
('delegado', 12, 'Rotina de trabalho do delegado', 'O dia a dia: plantões, investigações, inquéritos e gestão da delegacia.', ARRAY['Plantão', 'Inquérito', 'Investigação', 'Gestão']),
('delegado', 13, 'Inquérito policial na prática', 'A condução do inquérito policial: procedimentos, prazos e desafios.', ARRAY['Instauração', 'Diligências', 'Relatório', 'Prazos']),
('delegado', 14, 'Direito Penal para delegado', 'Temas essenciais de Direito Penal para concursos de delegado.', ARRAY['Teoria do crime', 'Crimes em espécie', 'Penas', 'Jurisprudência']),
('delegado', 15, 'Processo Penal para delegado', 'Conteúdo de Processo Penal focado na atuação do delegado.', ARRAY['Inquérito', 'Prisões', 'Provas', 'Medidas cautelares']),
('delegado', 16, 'Legislação especial para delegado', 'Leis especiais mais cobradas: drogas, armas, crime organizado.', ARRAY['Lei de Drogas', 'Armas', 'ORCRIM', 'Maria da Penha']),
('delegado', 17, 'Medicina Legal e Criminalística', 'Noções essenciais de medicina legal e perícia para o concurso.', ARRAY['Traumatologia', 'Tanatologia', 'Perícia', 'Laudos']),
('delegado', 18, 'Estratégias de estudo para delegado', 'Planejamento e metodologia de estudo para aprovação.', ARRAY['Planejamento', 'Ciclo', 'Material', 'Revisão']),
('delegado', 19, 'Carreira e especializações', 'Progressão na carreira e áreas de especialização para delegados.', ARRAY['Progressão', 'Especializações', 'Chefia', 'Superintendência']),
('delegado', 20, 'Histórias de delegados de sucesso', 'Depoimentos e trajetórias inspiradoras de delegados.', ARRAY['Experiências', 'Desafios', 'Casos marcantes', 'Conselhos']);