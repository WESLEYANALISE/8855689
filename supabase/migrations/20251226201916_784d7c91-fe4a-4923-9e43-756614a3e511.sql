-- INSERIR ARTIGOS PARA TODAS AS NOVAS CATEGORIAS DO BLOGGER JURÍDICO

-- =====================================================
-- ABA 1: FUNDAMENTOS DO DIREITO
-- =====================================================

-- CATEGORIA: areas (Áreas do Direito)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('areas', 1, 'Direito Civil', 'O ramo que regula as relações entre particulares', 'Direito civil', ARRAY['Conceito e origem', 'Divisões do Direito Civil', 'Código Civil Brasileiro', 'Pessoa física e jurídica', 'Obrigações e contratos', 'Família e sucessões']),
('areas', 2, 'Direito Penal', 'A ciência que estuda os crimes e as penas', 'Direito penal', ARRAY['Conceito e finalidade', 'Princípios do Direito Penal', 'Teoria do crime', 'Tipos de penas', 'Código Penal Brasileiro', 'Execução penal']),
('areas', 3, 'Direito Trabalhista', 'O ramo que protege as relações de trabalho', 'Direito do trabalho', ARRAY['História do Direito do Trabalho', 'CLT - Consolidação das Leis do Trabalho', 'Direitos do trabalhador', 'Contrato de trabalho', 'Justiça do Trabalho', 'Reforma trabalhista']),
('areas', 4, 'Direito Tributário', 'A disciplina que regula a arrecadação de tributos', 'Direito tributário', ARRAY['Sistema tributário nacional', 'Espécies de tributos', 'Competência tributária', 'Obrigação tributária', 'Código Tributário Nacional', 'Planejamento tributário']),
('areas', 5, 'Direito Administrativo', 'O ramo que rege a Administração Pública', 'Direito administrativo', ARRAY['Princípios administrativos', 'Atos administrativos', 'Licitações e contratos', 'Servidores públicos', 'Responsabilidade do Estado', 'Controle da Administração']),
('areas', 6, 'Direito Constitucional', 'A base de todo o ordenamento jurídico', 'Direito constitucional', ARRAY['Constituição e poder constituinte', 'Direitos fundamentais', 'Organização do Estado', 'Separação de poderes', 'Controle de constitucionalidade', 'Remédios constitucionais']),
('areas', 7, 'Direito Empresarial', 'O ramo que regula a atividade empresarial', 'Direito empresarial', ARRAY['Teoria da empresa', 'Tipos societários', 'Títulos de crédito', 'Falência e recuperação', 'Propriedade industrial', 'Contratos empresariais']),
('areas', 8, 'Direito Ambiental', 'A proteção jurídica do meio ambiente', 'Direito ambiental', ARRAY['Princípios ambientais', 'Política Nacional do Meio Ambiente', 'Licenciamento ambiental', 'Crimes ambientais', 'Responsabilidade ambiental', 'Desenvolvimento sustentável']),
('areas', 9, 'Direito do Consumidor', 'A defesa dos direitos do consumidor', 'Direito do consumidor', ARRAY['Código de Defesa do Consumidor', 'Relação de consumo', 'Direitos básicos', 'Práticas abusivas', 'Responsabilidade do fornecedor', 'Órgãos de defesa']),
('areas', 10, 'Direito Digital', 'O novo ramo para a era tecnológica', 'Direito digital', ARRAY['Marco Civil da Internet', 'LGPD - Proteção de dados', 'Crimes cibernéticos', 'Propriedade intelectual digital', 'Contratos eletrônicos', 'Inteligência artificial e Direito']),
('areas', 11, 'Direito Internacional', 'As relações jurídicas entre Estados', 'Direito internacional', ARRAY['Direito Internacional Público', 'Direito Internacional Privado', 'Tratados internacionais', 'Organizações internacionais', 'Tribunais internacionais', 'Direito diplomático']),
('areas', 12, 'Direito de Família', 'O ramo que regula as relações familiares', 'Direito de família', ARRAY['Casamento e união estável', 'Dissolução do vínculo', 'Filiação e parentesco', 'Guarda dos filhos', 'Alimentos', 'Direito dos idosos']);

-- CATEGORIA: principios (Princípios do Direito)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('principios', 1, 'Princípio da Legalidade', 'Ninguém será obrigado a fazer ou deixar de fazer algo senão em virtude de lei', 'Princípio da legalidade', ARRAY['Origem histórica', 'Previsão constitucional', 'Legalidade administrativa', 'Legalidade penal', 'Reserva legal', 'Aplicação prática']),
('principios', 2, 'Princípio da Presunção de Inocência', 'Todo acusado é inocente até prova em contrário', 'Presunção de inocência', ARRAY['Origem e evolução', 'Constituição Federal', 'In dubio pro reo', 'Prisão provisória', 'Ônus da prova', 'Jurisprudência do STF']),
('principios', 3, 'Princípio do Contraditório e Ampla Defesa', 'Direito de ser ouvido e de se defender', 'Contraditório', ARRAY['Conceito de contraditório', 'Conceito de ampla defesa', 'Processo judicial', 'Processo administrativo', 'Defesa técnica', 'Autodefesa']),
('principios', 4, 'Princípio da Dignidade Humana', 'O fundamento de todos os direitos fundamentais', 'Dignidade da pessoa humana', ARRAY['Origem filosófica', 'Fundamento da República', 'Direitos fundamentais', 'Vedação à tortura', 'Mínimo existencial', 'Aplicação pelo STF']),
('principios', 5, 'Princípio da Isonomia', 'Todos são iguais perante a lei', 'Igualdade perante a lei', ARRAY['Igualdade formal', 'Igualdade material', 'Ações afirmativas', 'Discriminação positiva', 'Tratamento dos desiguais', 'Aplicações práticas']),
('principios', 6, 'Princípio do Devido Processo Legal', 'Garantia de um processo justo', 'Devido processo legal', ARRAY['Origem na Magna Carta', 'Due process of law', 'Aspecto formal', 'Aspecto material', 'Garantias processuais', 'Nulidades']),
('principios', 7, 'Princípio da Razoabilidade', 'As decisões devem ser proporcionais e adequadas', 'Razoabilidade', ARRAY['Conceito e origem', 'Relação com proporcionalidade', 'Adequação', 'Necessidade', 'Proporcionalidade em sentido estrito', 'Controle judicial']),
('principios', 8, 'Princípio da Publicidade', 'Os atos públicos devem ser transparentes', 'Princípio da publicidade', ARRAY['Administração Pública', 'Processo judicial', 'Lei de Acesso à Informação', 'Exceções ao princípio', 'Sigilo necessário', 'Transparência ativa']),
('principios', 9, 'Princípio da Moralidade', 'A ética na Administração Pública', 'Moralidade administrativa', ARRAY['Moralidade administrativa', 'Probidade administrativa', 'Improbidade administrativa', 'Ação popular', 'Lei de Improbidade', 'Jurisprudência']),
('principios', 10, 'Princípio da Eficiência', 'A busca pelos melhores resultados', 'Princípio da eficiência', ARRAY['Emenda Constitucional 19/98', 'Administração gerencial', 'Qualidade do serviço público', 'Economicidade', 'Avaliação de desempenho', 'Reforma administrativa']);

-- =====================================================
-- ABA 2: HISTÓRIA & PENSADORES
-- =====================================================

-- CATEGORIA: codigos_historicos (Códigos Históricos)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('codigos_historicos', 1, 'Código de Hamurabi', 'O mais antigo código de leis escrito da humanidade', 'Código de Hamurabi', ARRAY['Origem na Babilônia', 'Lei de Talião', 'Estrutura do código', '282 artigos', 'Justiça e classes sociais', 'Legado para o Direito']),
('codigos_historicos', 2, 'Código de Justiniano', 'A compilação do Direito Romano', 'Corpus Juris Civilis', ARRAY['Imperador Justiniano', 'Corpus Juris Civilis', 'Digesto e Institutas', 'Codex', 'Influência no Direito Civil', 'Legado para a Europa']),
('codigos_historicos', 3, 'Código Napoleônico', 'O código que revolucionou o Direito moderno', 'Código Napoleônico', ARRAY['Napoleão Bonaparte', 'Código Civil de 1804', 'Influência iluminista', 'Propriedade e contratos', 'Igualdade perante a lei', 'Influência mundial']),
('codigos_historicos', 4, 'Lei das XII Tábuas', 'A primeira legislação escrita de Roma', 'Lei das Doze Tábuas', ARRAY['Roma Antiga (450 a.C.)', 'Luta entre patrícios e plebeus', 'Publicidade das leis', '12 tábuas de bronze', 'Direito privado romano', 'Influência no Direito']),
('codigos_historicos', 5, 'Magna Carta', 'O documento que limitou o poder real', 'Magna Carta', ARRAY['Inglaterra 1215', 'Rei João Sem Terra', 'Limitação do poder real', 'Direitos dos barões', 'Habeas corpus', 'Origem dos direitos humanos']),
('codigos_historicos', 6, 'Código de Manu', 'As leis sagradas da Índia antiga', 'Código de Manu', ARRAY['Índia antiga', 'Direito hindu', 'Sistema de castas', 'Dharma - dever sagrado', 'Organização social', 'Influência religiosa']),
('codigos_historicos', 7, 'Código Teodosiano', 'A compilação do Império Romano tardio', 'Código Teodosiano', ARRAY['Imperador Teodósio II', 'Compilação de 438 d.C.', 'Direito romano tardio', 'Influência cristã', 'Base para códigos posteriores', 'Transição para Idade Média']),
('codigos_historicos', 8, 'Declaração dos Direitos do Homem', 'O marco da Revolução Francesa', 'Declaração dos Direitos do Homem e do Cidadão', ARRAY['Revolução Francesa 1789', 'Direitos naturais', 'Liberdade e igualdade', 'Soberania popular', 'Influência iluminista', 'Base dos direitos humanos']);

-- CATEGORIA: civilizacoes (Civilizações e Direito)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('civilizacoes', 1, 'Direito Romano', 'A base do sistema jurídico ocidental', 'Direito romano', ARRAY['Origem e evolução', 'Jus civile e jus gentium', 'Grandes juristas romanos', 'Instituições jurídicas', 'Processo romano', 'Legado para o mundo']),
('civilizacoes', 2, 'Direito Grego Antigo', 'As primeiras ideias de democracia e justiça', 'Direito grego antigo', ARRAY['Democracia ateniense', 'Tribunais populares', 'Retórica e advocacia', 'Sólon e as reformas', 'Filosofia e Direito', 'Influência no pensamento jurídico']),
('civilizacoes', 3, 'Direito na Mesopotâmia', 'As primeiras leis da humanidade', 'Mesopotâmia', ARRAY['Sumérios e babilônios', 'Códigos antigos', 'Escrita cuneiforme', 'Contratos e propriedade', 'Família e herança', 'Precedentes históricos']),
('civilizacoes', 4, 'Direito Egípcio Antigo', 'A justiça na terra dos faraós', 'Antigo Egito', ARRAY['Faraó como juiz supremo', 'Maát - conceito de justiça', 'Tribunais egípcios', 'Direito de família', 'Propriedade e herança', 'Papiros jurídicos']),
('civilizacoes', 5, 'Direito Medieval', 'O Direito na Idade Média europeia', 'Direito medieval', ARRAY['Feudalismo e vassalagem', 'Direito costumeiro', 'Universidades medievais', 'Glosadores e comentadores', 'Ius commune', 'Tribunais eclesiásticos']),
('civilizacoes', 6, 'Direito Canônico', 'O sistema jurídico da Igreja Católica', 'Direito canônico', ARRAY['Origem e evolução', 'Código de Direito Canônico', 'Tribunais eclesiásticos', 'Matrimônio canônico', 'Influência no Direito secular', 'Atualidade']),
('civilizacoes', 7, 'Direito Germânico', 'As tradições jurídicas dos povos germânicos', 'Direito germânico', ARRAY['Povos germânicos', 'Direito consuetudinário', 'Assembleias tribais', 'Ordálias e juramentos', 'Composição e vingança', 'Influência no common law']),
('civilizacoes', 8, 'Direito Islâmico', 'A Sharia e o sistema jurídico muçulmano', 'Direito islâmico', ARRAY['Sharia - lei islâmica', 'Fontes do Direito islâmico', 'Corão e Hadith', 'Escolas jurídicas', 'Fiqh - jurisprudência', 'Aplicação contemporânea']);

-- CATEGORIA: juristas_brasileiros (Grandes Juristas Brasileiros)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('juristas_brasileiros', 1, 'Rui Barbosa', 'O Águia de Haia e defensor das liberdades', 'Rui Barbosa', ARRAY['Biografia', 'Campanha civilista', 'Conferência de Haia', 'Defesa de Dreyfus no Brasil', 'Obras jurídicas', 'Legado para o Direito brasileiro']),
('juristas_brasileiros', 2, 'Pontes de Miranda', 'O maior tratadista do Direito brasileiro', 'Pontes de Miranda', ARRAY['Biografia', 'Tratado de Direito Privado', 'Teoria do fato jurídico', 'Contribuições doutrinárias', 'Influência acadêmica', 'Legado científico']),
('juristas_brasileiros', 3, 'Clóvis Beviláqua', 'O autor do Código Civil de 1916', 'Clóvis Beviláqua', ARRAY['Biografia', 'Código Civil de 1916', 'Escola do Recife', 'Obras jurídicas', 'Filosofia do Direito', 'Influência no Direito Civil']),
('juristas_brasileiros', 4, 'Teixeira de Freitas', 'O jurista que influenciou o Código Civil argentino', 'Augusto Teixeira de Freitas', ARRAY['Biografia', 'Consolidação das Leis Civis', 'Esboço do Código Civil', 'Influência internacional', 'Método científico', 'Legado jurídico']),
('juristas_brasileiros', 5, 'Tobias Barreto', 'O fundador da Escola do Recife', 'Tobias Barreto', ARRAY['Biografia', 'Escola do Recife', 'Filosofia jurídica', 'Crítica ao jusnaturalismo', 'Poesia e literatura', 'Influência no pensamento jurídico']),
('juristas_brasileiros', 6, 'Miguel Reale', 'O filósofo do Direito brasileiro', 'Miguel Reale', ARRAY['Biografia', 'Teoria Tridimensional do Direito', 'Código Civil de 2002', 'Filosofia do Direito', 'Culturalismo jurídico', 'Obras e legado']),
('juristas_brasileiros', 7, 'Orlando Gomes', 'O mestre do Direito Civil baiano', 'Orlando Gomes', ARRAY['Biografia', 'Obras de Direito Civil', 'Contratos e obrigações', 'Direitos reais', 'Influência doutrinária', 'Legado acadêmico']),
('juristas_brasileiros', 8, 'Sobral Pinto', 'O advogado dos perseguidos políticos', 'Sobral Pinto', ARRAY['Biografia', 'Defesa de presos políticos', 'Era Vargas', 'Ditadura militar', 'Direitos humanos', 'Ética profissional']),
('juristas_brasileiros', 9, 'Nelson Hungria', 'O grande penalista brasileiro', 'Nelson Hungria', ARRAY['Biografia', 'Comentários ao Código Penal', 'Doutrina penal', 'Ministro do STF', 'Teoria do crime', 'Influência no Direito Penal']),
('juristas_brasileiros', 10, 'Evandro Lins e Silva', 'O tribuno da advocacia criminal', 'Evandro Lins e Silva', ARRAY['Biografia', 'Grandes julgamentos', 'Advocacia criminal', 'Ministro do STF', 'Casos célebres', 'Legado na advocacia']);

-- CATEGORIA: julgamentos_mundiais (Julgamentos que Mudaram o Mundo)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('julgamentos_mundiais', 1, 'Julgamentos de Nuremberg', 'O tribunal que julgou os crimes nazistas', 'Julgamentos de Nuremberg', ARRAY['Contexto histórico', 'Tribunal Militar Internacional', 'Crimes contra a humanidade', 'Principais acusados', 'Sentenças', 'Legado para o Direito Internacional']),
('julgamentos_mundiais', 2, 'Caso Dreyfus', 'O escândalo que dividiu a França', 'Caso Dreyfus', ARRAY['Alfred Dreyfus', 'Antissemitismo', 'J''accuse de Émile Zola', 'Revisão do processo', 'Consequências políticas', 'Importância histórica']),
('julgamentos_mundiais', 3, 'Julgamento de Sócrates', 'A condenação do filósofo ateniense', 'Julgamento de Sócrates', ARRAY['Atenas 399 a.C.', 'Acusações de impiedade', 'Corrupção da juventude', 'Apologia de Sócrates', 'Condenação à morte', 'Legado filosófico']),
('julgamentos_mundiais', 4, 'Brown v. Board of Education', 'O fim da segregação racial nas escolas americanas', 'Brown v. Board of Education', ARRAY['Contexto histórico', 'Segregação racial', 'Suprema Corte dos EUA', 'Decisão unânime', 'Separate but equal', 'Movimento dos direitos civis']),
('julgamentos_mundiais', 5, 'Julgamento de Joana d''Arc', 'A condenação da heroína francesa', 'Joana d''Arc', ARRAY['Guerra dos Cem Anos', 'Acusações de heresia', 'Tribunal eclesiástico', 'Condenação à fogueira', 'Reabilitação póstuma', 'Canonização']),
('julgamentos_mundiais', 6, 'Marbury v. Madison', 'A origem do controle de constitucionalidade', 'Marbury v. Madison', ARRAY['Estados Unidos 1803', 'John Marshall', 'Suprema Corte', 'Controle de constitucionalidade', 'Judicial review', 'Influência mundial']),
('julgamentos_mundiais', 7, 'Julgamento de Galileu', 'A ciência contra a Inquisição', 'Caso Galileu', ARRAY['Galileu Galilei', 'Heliocentrismo', 'Inquisição romana', 'Abjuração forçada', 'E pur si muove', 'Reabilitação pela Igreja']),
('julgamentos_mundiais', 8, 'Roe v. Wade', 'O caso que legalizou o aborto nos EUA', 'Roe v. Wade', ARRAY['Contexto histórico', 'Direito à privacidade', 'Suprema Corte 1973', 'Trimestres da gestação', 'Impacto social', 'Reversão em 2022']),
('julgamentos_mundiais', 9, 'Tribunal de Tóquio', 'O julgamento dos crimes de guerra japoneses', 'Tribunal Militar Internacional para o Extremo Oriente', ARRAY['Pós-Segunda Guerra', 'Crimes de guerra', 'Generais japoneses', 'Sentenças', 'Comparação com Nuremberg', 'Controvérsias']),
('julgamentos_mundiais', 10, 'Caso O.J. Simpson', 'O julgamento do século nos EUA', 'Caso O. J. Simpson', ARRAY['O.J. Simpson', 'Acusação de homicídio', 'Julgamento televisionado', 'Dream Team de advogados', 'Absolvição controversa', 'Processo civil posterior']);

-- =====================================================
-- ABA 3: INSTITUIÇÕES & MUNDO
-- =====================================================

-- CATEGORIA: tribunais_brasil (Tribunais do Brasil)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('tribunais_brasil', 1, 'Supremo Tribunal Federal (STF)', 'A mais alta corte do país', 'Supremo Tribunal Federal', ARRAY['História e criação', 'Composição', 'Competências', 'Controle de constitucionalidade', 'Ministros notáveis', 'Decisões históricas']),
('tribunais_brasil', 2, 'Superior Tribunal de Justiça (STJ)', 'O guardião da legislação federal', 'Superior Tribunal de Justiça', ARRAY['Criação pela CF/88', 'Composição', 'Competências', 'Uniformização de jurisprudência', 'Recursos especiais', 'Súmulas']),
('tribunais_brasil', 3, 'Tribunal Superior do Trabalho (TST)', 'A última instância trabalhista', 'Tribunal Superior do Trabalho', ARRAY['História', 'Composição', 'Competências', 'Recursos de revista', 'Súmulas e OJs', 'Reforma trabalhista']),
('tribunais_brasil', 4, 'Tribunal Superior Eleitoral (TSE)', 'O guardião da democracia brasileira', 'Tribunal Superior Eleitoral', ARRAY['Criação em 1932', 'Composição', 'Competências', 'Justiça Eleitoral', 'Eleições', 'Urnas eletrônicas']),
('tribunais_brasil', 5, 'Superior Tribunal Militar (STM)', 'A justiça militar brasileira', 'Superior Tribunal Militar', ARRAY['História', 'Composição', 'Competências', 'Crimes militares', 'Justiça Militar Estadual', 'Reforma do sistema']),
('tribunais_brasil', 6, 'Tribunais de Justiça Estaduais', 'A segunda instância da Justiça Comum', 'Tribunal de Justiça', ARRAY['Organização', 'Competências', 'Câmaras e turmas', 'Desembargadores', 'Recursos', 'Autonomia estadual']),
('tribunais_brasil', 7, 'Tribunais Regionais Federais', 'A segunda instância da Justiça Federal', 'Tribunal Regional Federal', ARRAY['Criação pela CF/88', 'TRFs existentes', 'Competências', 'Jurisdição', 'Recursos', 'Novos TRFs']),
('tribunais_brasil', 8, 'Conselho Nacional de Justiça (CNJ)', 'O órgão de controle do Judiciário', 'Conselho Nacional de Justiça', ARRAY['Criação pela EC 45/04', 'Composição', 'Competências', 'Controle administrativo', 'Metas do Judiciário', 'Corregedoria Nacional']),
('tribunais_brasil', 9, 'Juizados Especiais', 'Justiça rápida e acessível', 'Juizado especial', ARRAY['Lei 9.099/95', 'Princípios', 'Competência', 'Procedimento', 'Juizados Federais', 'Acesso à Justiça']),
('tribunais_brasil', 10, 'Tribunais do Júri', 'O julgamento pelo povo', 'Tribunal do júri', ARRAY['Origem histórica', 'Previsão constitucional', 'Competência', 'Procedimento', 'Quesitos', 'Soberania dos veredictos']);

-- CATEGORIA: orgaos_juridicos (Órgãos Jurídicos)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('orgaos_juridicos', 1, 'Ministério Público Federal', 'O fiscal da lei na esfera federal', 'Ministério Público Federal', ARRAY['Estrutura', 'Procurador-Geral da República', 'Competências', 'Atuação criminal', 'Defesa da ordem jurídica', 'Casos notórios']),
('orgaos_juridicos', 2, 'Ministério Público Estadual', 'A defesa da sociedade nos Estados', 'Ministério Público (Brasil)', ARRAY['Organização', 'Procurador-Geral de Justiça', 'Promotores de Justiça', 'Áreas de atuação', 'Autonomia funcional', 'MP e cidadania']),
('orgaos_juridicos', 3, 'Defensoria Pública', 'O acesso à Justiça para todos', 'Defensoria Pública', ARRAY['Função constitucional', 'Defensoria da União', 'Defensorias Estaduais', 'Assistência jurídica', 'Hipossuficiência', 'Núcleos especializados']),
('orgaos_juridicos', 4, 'Ordem dos Advogados do Brasil (OAB)', 'A entidade máxima da advocacia', 'Ordem dos Advogados do Brasil', ARRAY['História', 'Exame de Ordem', 'Código de Ética', 'Prerrogativas', 'Tribunais de Ética', 'Função institucional']),
('orgaos_juridicos', 5, 'Polícia Federal', 'A polícia judiciária da União', 'Polícia Federal (Brasil)', ARRAY['Competências constitucionais', 'Estrutura', 'Delegados Federais', 'Operações famosas', 'Polícia de fronteira', 'Combate ao crime organizado']),
('orgaos_juridicos', 6, 'Advocacia-Geral da União', 'A representação jurídica do Estado', 'Advocacia-Geral da União', ARRAY['Função constitucional', 'Advogado-Geral da União', 'Procuradorias', 'Consultoria jurídica', 'Defesa da União', 'Procuradores federais']),
('orgaos_juridicos', 7, 'Procuradoria-Geral da República', 'O chefe do Ministério Público da União', 'Procuradoria-Geral da República', ARRAY['PGR', 'Nomeação', 'Competências', 'Atuação no STF', 'Ações penais', 'Subprocuradores']),
('orgaos_juridicos', 8, 'Corregedorias', 'O controle interno do sistema de Justiça', 'Corregedoria', ARRAY['Corregedoria Nacional de Justiça', 'Corregedorias estaduais', 'Funções', 'Processos disciplinares', 'Inspeções', 'Controle da magistratura']);

-- CATEGORIA: sistemas_juridicos (Sistemas Jurídicos no Mundo)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('sistemas_juridicos', 1, 'Common Law', 'O sistema jurídico baseado em precedentes', 'Common law', ARRAY['Origem na Inglaterra', 'Precedentes judiciais', 'Stare decisis', 'Países que adotam', 'Diferenças do Civil Law', 'Características principais']),
('sistemas_juridicos', 2, 'Civil Law', 'O sistema jurídico baseado em códigos', 'Civil law', ARRAY['Origem romana', 'Codificação', 'Influência napoleônica', 'Países que adotam', 'Brasil no Civil Law', 'Doutrina e jurisprudência']),
('sistemas_juridicos', 3, 'Sistema Misto', 'A combinação de tradições jurídicas', 'Sistema jurídico misto', ARRAY['Características', 'Países com sistema misto', 'Escócia', 'Louisiana', 'Quebec', 'África do Sul']),
('sistemas_juridicos', 4, 'Direito Consuetudinário', 'O Direito baseado nos costumes', 'Direito consuetudinário', ARRAY['Conceito', 'Costume como fonte do Direito', 'Comunidades tradicionais', 'África', 'Povos indígenas', 'Reconhecimento legal']),
('sistemas_juridicos', 5, 'Direito Socialista', 'O sistema jurídico dos países comunistas', 'Direito socialista', ARRAY['Origem marxista-leninista', 'União Soviética', 'Características', 'Propriedade estatal', 'Cuba e China', 'Transformações atuais']),
('sistemas_juridicos', 6, 'Sistemas Religiosos de Direito', 'Quando a religião é a fonte do Direito', 'Direito religioso', ARRAY['Direito Islâmico (Sharia)', 'Direito Canônico', 'Direito Hebraico', 'Direito Hindu', 'Teocracia', 'Secularização']);

-- CATEGORIA: direitos_humanos (Direitos Humanos)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('direitos_humanos', 1, 'Declaração Universal dos Direitos Humanos', 'O documento fundamental da humanidade', 'Declaração Universal dos Direitos Humanos', ARRAY['ONU 1948', 'Eleanor Roosevelt', '30 artigos', 'Direitos fundamentais', 'Caráter universal', 'Influência mundial']),
('direitos_humanos', 2, 'Organização das Nações Unidas (ONU)', 'A organização pela paz mundial', 'Organização das Nações Unidas', ARRAY['Criação em 1945', 'Carta das Nações Unidas', 'Órgãos principais', 'Conselho de Segurança', 'Assembleia Geral', 'Agências especializadas']),
('direitos_humanos', 3, 'Corte Interamericana de Direitos Humanos', 'O tribunal regional das Américas', 'Corte Interamericana de Direitos Humanos', ARRAY['Sistema interamericano', 'Sede na Costa Rica', 'Competência', 'Casos brasileiros', 'Sentenças', 'Comissão Interamericana']),
('direitos_humanos', 4, 'Convenções de Genebra', 'A proteção em tempos de guerra', 'Convenções de Genebra', ARRAY['Direito humanitário', '4 Convenções', 'Prisioneiros de guerra', 'Civis em conflitos', 'Cruz Vermelha', 'Crimes de guerra']),
('direitos_humanos', 5, 'Tribunal Penal Internacional', 'A justiça para crimes internacionais', 'Tribunal Penal Internacional', ARRAY['Estatuto de Roma', 'Haia - Países Baixos', 'Competência', 'Genocídio e crimes contra humanidade', 'Casos julgados', 'Brasil e o TPI']),
('direitos_humanos', 6, 'Anistia Internacional', 'A maior ONG de direitos humanos', 'Amnesty International', ARRAY['Fundação em 1961', 'Prêmio Nobel da Paz', 'Campanhas', 'Presos de consciência', 'Relatórios anuais', 'Atuação global']),
('direitos_humanos', 7, 'Pacto de San José da Costa Rica', 'A convenção americana de direitos humanos', 'Convenção Americana sobre Direitos Humanos', ARRAY['1969', 'OEA', 'Direitos civis e políticos', 'Brasil como signatário', 'Aplicação pelos tribunais', 'Controle de convencionalidade']),
('direitos_humanos', 8, 'Tribunal Europeu dos Direitos Humanos', 'A corte de Estrasburgo', 'Tribunal Europeu dos Direitos Humanos', ARRAY['Conselho da Europa', 'Convenção Europeia', 'Sede em Estrasburgo', 'Competência', 'Casos importantes', 'Influência global']);

-- CATEGORIA: constituicoes_brasil (Constituições do Brasil)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('constituicoes_brasil', 1, 'Constituição de 1824', 'A primeira Constituição brasileira', 'Constituição brasileira de 1824', ARRAY['Império do Brasil', 'Dom Pedro I', 'Poder Moderador', 'Quatro poderes', 'Catolicismo oficial', 'Vigência até 1889']),
('constituicoes_brasil', 2, 'Constituição de 1891', 'A primeira Constituição republicana', 'Constituição brasileira de 1891', ARRAY['Proclamação da República', 'Rui Barbosa', 'Federalismo', 'Presidencialismo', 'Separação Igreja-Estado', 'Influência americana']),
('constituicoes_brasil', 3, 'Constituição de 1934', 'A Constituição social', 'Constituição brasileira de 1934', ARRAY['Era Vargas', 'Direitos sociais', 'Voto feminino', 'Justiça do Trabalho', 'Mandado de segurança', 'Curta vigência']),
('constituicoes_brasil', 4, 'Constituição de 1937', 'A Carta do Estado Novo', 'Constituição brasileira de 1937', ARRAY['Estado Novo', 'Getúlio Vargas', 'Constituição polaca', 'Autoritarismo', 'Centralização', 'Direitos suspensos']),
('constituicoes_brasil', 5, 'Constituição de 1946', 'O retorno à democracia', 'Constituição brasileira de 1946', ARRAY['Redemocratização', 'Direitos e garantias', 'Federalismo', 'Pluripartidarismo', 'Justiça Eleitoral', 'República populista']),
('constituicoes_brasil', 6, 'Constituição de 1967/69', 'A Constituição da ditadura', 'Constituição brasileira de 1967', ARRAY['Regime militar', 'Atos institucionais', 'Centralização', 'Restrição de direitos', 'Segurança nacional', 'Emenda 1 de 1969']),
('constituicoes_brasil', 7, 'Constituição de 1988', 'A Constituição Cidadã', 'Constituição brasileira de 1988', ARRAY['Assembleia Constituinte', 'Ulysses Guimarães', 'Direitos fundamentais', 'Cláusulas pétreas', 'SUS e educação', 'Emendas constitucionais']);

-- CATEGORIA: direito_comparado (Direito Comparado)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('direito_comparado', 1, 'Sistema Jurídico dos Estados Unidos', 'O maior sistema de common law', 'Sistema jurídico dos Estados Unidos', ARRAY['Common law americano', 'Constituição de 1787', 'Suprema Corte', 'Federalismo', 'Bill of Rights', 'Júri americano']),
('direito_comparado', 2, 'Sistema Jurídico da França', 'O berço do Código Civil moderno', 'Direito francês', ARRAY['Código Napoleônico', 'Conselho de Estado', 'Corte de Cassação', 'Justiça administrativa', 'Direito continental', 'Influência no Brasil']),
('direito_comparado', 3, 'Sistema Jurídico da Alemanha', 'O rigor da tradição germânica', 'Direito alemão', ARRAY['BGB - Código Civil', 'Tribunal Constitucional Federal', 'Federalismo alemão', 'Doutrina jurídica', 'Influência no Brasil', 'Direitos fundamentais']),
('direito_comparado', 4, 'Sistema Jurídico do Reino Unido', 'A tradição do common law', 'Direito do Reino Unido', ARRAY['Precedentes judiciais', 'Parlamento britânico', 'Suprema Corte do Reino Unido', 'Sem constituição escrita', 'Barrister e solicitor', 'Influência global']),
('direito_comparado', 5, 'Sistema Jurídico de Portugal', 'As raízes do Direito brasileiro', 'Direito português', ARRAY['Ordenações do Reino', 'Código Civil português', 'Tribunal Constitucional', 'Influência no Brasil colonial', 'Sistema lusófono', 'Direito comparado']),
('direito_comparado', 6, 'Sistema Jurídico do Japão', 'A fusão entre Oriente e Ocidente', 'Direito japonês', ARRAY['Era Meiji', 'Influência germânica', 'Constituição pós-guerra', 'Particularidades culturais', 'Mediação e consenso', 'Modernização jurídica']),
('direito_comparado', 7, 'Sistema Jurídico da China', 'O Direito no gigante asiático', 'Direito chinês', ARRAY['Tradição confucionista', 'Era comunista', 'Reformas econômicas', 'Sistema judiciário', 'Direito e política', 'Hong Kong']),
('direito_comparado', 8, 'Sistema Jurídico da Argentina', 'O vizinho do Mercosul', 'Direito argentino', ARRAY['Código Civil argentino', 'Teixeira de Freitas', 'Federalismo', 'Corte Suprema', 'Semelhanças com Brasil', 'Direito comparado']);

-- CATEGORIA: crimes_famosos (Crimes Famosos)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('crimes_famosos', 1, 'Caso Suzane von Richthofen', 'O parricídio que chocou o Brasil', 'Caso Richthofen', ARRAY['O crime', 'Motivação', 'Julgamento', 'Condenação', 'Progressão de regime', 'Repercussão']),
('crimes_famosos', 2, 'Caso Nardoni', 'A tragédia da menina Isabella', 'Caso Isabella Nardoni', ARRAY['O crime', 'Investigação', 'Pai e madrasta', 'Julgamento pelo júri', 'Condenação', 'Repercussão midiática']),
('crimes_famosos', 3, 'Caso Goleiro Bruno', 'O crime que abalou o futebol', 'Caso Eliza Samudio', ARRAY['Eliza Samudio', 'Investigação', 'Ocultação de cadáver', 'Julgamento', 'Condenação', 'Tentativas de retorno']),
('crimes_famosos', 4, 'Caso Elize Matsunaga', 'O crime da socialite', 'Caso Elize Matsunaga', ARRAY['O crime', 'Esquartejamento', 'Motivação', 'Julgamento', 'Tese de defesa', 'Condenação']),
('crimes_famosos', 5, 'Maníaco do Parque', 'O serial killer de São Paulo', 'Francisco de Assis Pereira', ARRAY['Os crimes', 'Modus operandi', 'Investigação', 'Prisão', 'Julgamento', 'Perfil psicológico']),
('crimes_famosos', 6, 'Caso Eloá', 'O sequestro transmitido ao vivo', 'Caso Eloá Pimentel', ARRAY['O sequestro', 'Negociações', 'Mídia e cobertura', 'Desfecho trágico', 'Julgamento', 'Críticas à polícia']),
('crimes_famosos', 7, 'Caso João Hélio', 'O crime que gerou nova lei', 'Caso João Hélio', ARRAY['O crime', 'Arrastamento', 'Menores envolvidos', 'Lei de crimes hediondos', 'Julgamento', 'Mudanças legislativas']),
('crimes_famosos', 8, 'Caso Mércia Nakashima', 'A juíza assassinada', 'Caso Mércia Nakashima', ARRAY['A vítima', 'O crime', 'Ex-namorado', 'Investigação', 'Julgamento', 'Condenação']),
('crimes_famosos', 9, 'Caso Daniella Perez', 'A atriz assassinada pelo colega', 'Assassinato de Daniella Perez', ARRAY['A vítima', 'O crime', 'Guilherme de Pádua', 'Julgamento', 'Gloria Perez', 'Lei de crimes hediondos']),
('crimes_famosos', 10, 'Caso Suzane e Daniel Cravinhos', 'Os executores do crime Richthofen', 'Caso Richthofen', ARRAY['Planejamento', 'Execução', 'Prisão', 'Delação', 'Condenações', 'Situação atual']);

-- CATEGORIA: prisoes_historicas (Prisões Históricas)
INSERT INTO "BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, termo_wikipedia, topicos) VALUES
('prisoes_historicas', 1, 'Alcatraz', 'A prisão inexpugnável de São Francisco', 'Alcatraz', ARRAY['Ilha na baía de São Francisco', 'Prisão federal', 'Prisioneiros famosos', 'Al Capone', 'Tentativas de fuga', 'Fechamento em 1963']),
('prisoes_historicas', 2, 'Ilha Grande', 'O presídio Cândido Mendes', 'Instituto Penal Cândido Mendes', ARRAY['Rio de Janeiro', 'Presos políticos', 'Ditadura militar', 'Condições', 'Fechamento', 'Hoje parque estadual']),
('prisoes_historicas', 3, 'Carandiru', 'A maior prisão da América Latina', 'Casa de Detenção de São Paulo', ARRAY['São Paulo', 'Superlotação', 'Massacre de 1992', 'Detentos famosos', 'Demolição', 'Legado e memória']),
('prisoes_historicas', 4, 'Torre de Londres', 'A prisão dos reis ingleses', 'Torre de Londres', ARRAY['Londres', 'Prisão real', 'Ana Bolena', 'Tortura e execuções', 'Corvos da Torre', 'Hoje patrimônio mundial']),
('prisoes_historicas', 5, 'Bastilha', 'O símbolo da Revolução Francesa', 'Bastilha', ARRAY['Paris', 'Prisão real', 'Queda em 14 de julho de 1789', 'Revolução Francesa', 'Demolição', 'Dia Nacional da França']),
('prisoes_historicas', 6, 'Robben Island', 'A prisão de Nelson Mandela', 'Robben Island', ARRAY['África do Sul', 'Apartheid', 'Nelson Mandela', '27 anos de prisão', 'Patrimônio da UNESCO', 'Símbolo de resistência']),
('prisoes_historicas', 7, 'Guantánamo', 'A prisão controversa dos EUA', 'Campo de detenção da baía de Guantánamo', ARRAY['Cuba', 'Guerra ao Terror', 'Detentos sem julgamento', 'Torturas denunciadas', 'Controvérsias', 'Situação atual']),
('prisoes_historicas', 8, 'Presídio de Ilha Anchieta', 'O Alcatraz brasileiro', 'Instituto Correcional da Ilha Anchieta', ARRAY['São Paulo', 'Rebelião de 1952', 'Condições desumanas', 'Fechamento', 'Hoje área de preservação', 'História penitenciária']);