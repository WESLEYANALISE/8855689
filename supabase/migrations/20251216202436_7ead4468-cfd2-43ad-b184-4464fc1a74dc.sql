-- Remover constraint de categoria existente
ALTER TABLE public."BLOGGER_JURIDICO" DROP CONSTRAINT IF EXISTS "BLOGGER_JURIDICO_categoria_check";

-- Adicionar colunas para integração com Wikipedia
ALTER TABLE public."BLOGGER_JURIDICO" 
ADD COLUMN IF NOT EXISTS termo_wikipedia TEXT,
ADD COLUMN IF NOT EXISTS fonte TEXT DEFAULT 'gemini',
ADD COLUMN IF NOT EXISTS imagem_wikipedia TEXT;

-- Inserir novos artigos para a categoria "curiosidades"
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos, termo_wikipedia, fonte)
VALUES 
  ('curiosidades', 1, 'Leis Mais Estranhas do Mundo', 'Conheça legislações bizarras que existem ao redor do globo', ARRAY['Leis inusitadas', 'Curiosidades legais', 'Direito comparado'], 'Lei (direito)', 'wikipedia'),
  ('curiosidades', 2, 'Origem dos Símbolos Jurídicos', 'A história por trás da balança, espada e venda da Justiça', ARRAY['Balança da justiça', 'Simbologia', 'História do direito'], 'Símbolo da Justiça', 'wikipedia'),
  ('curiosidades', 3, 'Casos Judiciais Mais Bizarros', 'Processos inacreditáveis que realmente aconteceram', ARRAY['Casos inusitados', 'Jurisprudência', 'Curiosidades'], 'Jurisprudência', 'wikipedia'),
  ('curiosidades', 4, 'Curiosidades sobre a Constituição Brasileira', 'Fatos pouco conhecidos sobre nossa Carta Magna', ARRAY['Constituição', 'Brasil', 'História'], 'Constituição brasileira de 1988', 'wikipedia'),
  ('curiosidades', 5, 'Profissões Jurídicas pelo Mundo', 'Como funcionam as carreiras jurídicas em outros países', ARRAY['Direito comparado', 'Carreiras', 'Internacional'], 'Advogado', 'wikipedia');

-- Inserir novos artigos para a categoria "filosofos"
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos, termo_wikipedia, fonte)
VALUES 
  ('filosofos', 1, 'Aristóteles e a Justiça', 'O conceito de justiça na filosofia aristotélica', ARRAY['Filosofia grega', 'Ética', 'Justiça'], 'Aristóteles', 'wikipedia'),
  ('filosofos', 2, 'Hans Kelsen e a Teoria Pura do Direito', 'O positivismo jurídico e a hierarquia das normas', ARRAY['Positivismo', 'Pirâmide de Kelsen', 'Normas'], 'Hans Kelsen', 'wikipedia'),
  ('filosofos', 3, 'Miguel Reale e a Teoria Tridimensional', 'Fato, valor e norma na concepção brasileira', ARRAY['Teoria tridimensional', 'Filosofia brasileira', 'Direito'], 'Miguel Reale', 'wikipedia'),
  ('filosofos', 4, 'Norberto Bobbio', 'Democracia, direitos humanos e teoria do ordenamento', ARRAY['Democracia', 'Direitos humanos', 'Itália'], 'Norberto Bobbio', 'wikipedia'),
  ('filosofos', 5, 'John Rawls e a Teoria da Justiça', 'O véu da ignorância e a justiça como equidade', ARRAY['Liberalismo', 'Contratualismo', 'EUA'], 'John Rawls', 'wikipedia'),
  ('filosofos', 6, 'Montesquieu e a Separação dos Poderes', 'A base do Estado moderno democrático', ARRAY['Iluminismo', 'Poderes', 'Estado'], 'Montesquieu', 'wikipedia');

-- Inserir novos artigos para a categoria "iniciando"
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos, termo_wikipedia, fonte)
VALUES 
  ('iniciando', 1, 'O que é Direito?', 'Conceitos fundamentais para quem está começando', ARRAY['Conceitos básicos', 'Introdução', 'Fundamentos'], 'Direito', 'wikipedia'),
  ('iniciando', 2, 'Ramos do Direito', 'Conheça as principais áreas de atuação jurídica', ARRAY['Áreas do direito', 'Especialização', 'Carreiras'], 'Ramo do direito', 'wikipedia'),
  ('iniciando', 3, 'Sistema Judiciário Brasileiro', 'Como funciona a estrutura judicial no Brasil', ARRAY['Tribunais', 'Instâncias', 'Organização'], 'Poder Judiciário do Brasil', 'wikipedia'),
  ('iniciando', 4, 'Diferença entre Direito Público e Privado', 'Entenda a divisão fundamental do ordenamento', ARRAY['Direito público', 'Direito privado', 'Classificação'], 'Direito público', 'wikipedia'),
  ('iniciando', 5, 'Hierarquia das Leis no Brasil', 'Da Constituição às normas infralegais', ARRAY['Pirâmide normativa', 'Constituição', 'Leis'], 'Hierarquia das leis', 'wikipedia');

-- Inserir novos artigos para a categoria "casos"
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos, termo_wikipedia, fonte)
VALUES 
  ('casos', 1, 'Caso Doca Street', 'O crime passional que mudou a jurisprudência brasileira', ARRAY['Crime passional', 'Tribunal do júri', 'Feminicídio'], 'Caso Doca Street', 'wikipedia'),
  ('casos', 2, 'Caso Isabella Nardoni', 'O crime que chocou o Brasil e mobilizou a mídia', ARRAY['Homicídio', 'Mídia', 'Processo penal'], 'Caso Isabella Nardoni', 'wikipedia'),
  ('casos', 3, 'Caso Suzane von Richthofen', 'O parricídio que abalou a sociedade paulista', ARRAY['Parricídio', 'Tribunal do júri', 'Crime hediondo'], 'Caso Richthofen', 'wikipedia'),
  ('casos', 4, 'Operação Lava Jato', 'A maior investigação de corrupção do Brasil', ARRAY['Corrupção', 'Delação premiada', 'Política'], 'Operação Lava Jato', 'wikipedia'),
  ('casos', 5, 'Mensalão', 'O escândalo de compra de votos no Congresso', ARRAY['Corrupção', 'STF', 'Ação penal'], 'Escândalo do mensalão', 'wikipedia');

-- Inserir novos artigos para a categoria "historia"
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos, termo_wikipedia, fonte)
VALUES 
  ('historia', 1, 'Código de Hamurabi', 'A primeira compilação de leis da história', ARRAY['Mesopotâmia', 'Antiguidade', 'Leis antigas'], 'Código de Hamurabi', 'wikipedia'),
  ('historia', 2, 'Direito Romano', 'A base do sistema jurídico ocidental', ARRAY['Roma', 'Antiguidade', 'Legado'], 'Direito romano', 'wikipedia'),
  ('historia', 3, 'Magna Carta', 'O documento que limitou o poder real', ARRAY['Inglaterra', 'Idade Média', 'Direitos'], 'Magna Carta', 'wikipedia'),
  ('historia', 4, 'Constituições Brasileiras', 'A evolução constitucional do Brasil', ARRAY['Brasil', 'Constituições', 'História'], 'Constituição do Brasil', 'wikipedia'),
  ('historia', 5, 'Declaração dos Direitos do Homem', 'O marco dos direitos fundamentais', ARRAY['França', 'Revolução', 'Direitos humanos'], 'Declaração dos Direitos do Homem e do Cidadão', 'wikipedia');

-- Inserir novos artigos para a categoria "termos"
INSERT INTO public."BLOGGER_JURIDICO" (categoria, ordem, titulo, descricao_curta, topicos, termo_wikipedia, fonte)
VALUES 
  ('termos', 1, 'Habeas Corpus', 'O remédio constitucional da liberdade', ARRAY['Remédio constitucional', 'Liberdade', 'Prisão'], 'Habeas corpus', 'wikipedia'),
  ('termos', 2, 'Mandado de Segurança', 'Proteção contra atos ilegais de autoridade', ARRAY['Remédio constitucional', 'Direito líquido', 'Autoridade'], 'Mandado de segurança', 'wikipedia'),
  ('termos', 3, 'Jurisprudência', 'O papel das decisões judiciais no direito', ARRAY['Decisões', 'Tribunais', 'Precedentes'], 'Jurisprudência', 'wikipedia'),
  ('termos', 4, 'Petição Inicial', 'O documento que inicia o processo judicial', ARRAY['Processo', 'Petição', 'Requisitos'], 'Petição inicial', 'wikipedia'),
  ('termos', 5, 'Recurso', 'Instrumentos para questionar decisões judiciais', ARRAY['Apelação', 'Agravo', 'Embargos'], 'Recurso (direito)', 'wikipedia');