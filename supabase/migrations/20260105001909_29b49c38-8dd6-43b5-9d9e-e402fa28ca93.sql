-- 1. Adicionar campo orientacao_politica na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orientacao_politica TEXT;

-- 2. Criar tabela de conteúdo por orientação (livros, perfis, canais, portais)
CREATE TABLE IF NOT EXISTS politica_conteudo_orientacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orientacao TEXT NOT NULL CHECK (orientacao IN ('esquerda', 'centro', 'direita')),
  tipo TEXT NOT NULL CHECK (tipo IN ('livro', 'perfil_instagram', 'canal_youtube', 'portal', 'twitter')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  url TEXT,
  imagem_url TEXT,
  autor TEXT,
  seguidores TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Criar tabela de artigos do blog por orientação
CREATE TABLE IF NOT EXISTS politica_blog_orientacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orientacao TEXT NOT NULL CHECK (orientacao IN ('esquerda', 'centro', 'direita')),
  titulo TEXT NOT NULL,
  conteudo TEXT,
  resumo TEXT,
  termo_wikipedia TEXT,
  imagem_url TEXT,
  ordem INTEGER DEFAULT 0,
  gerado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE politica_conteudo_orientacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE politica_blog_orientacao ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de leitura pública
CREATE POLICY "Conteúdo orientação é público para leitura"
  ON politica_conteudo_orientacao FOR SELECT
  USING (true);

CREATE POLICY "Blog orientação é público para leitura"
  ON politica_blog_orientacao FOR SELECT
  USING (true);

-- 6. Inserir dados iniciais de livros
INSERT INTO politica_conteudo_orientacao (orientacao, tipo, titulo, autor, descricao, ordem) VALUES
('direita', 'livro', 'A Riqueza das Nações', 'Adam Smith', 'O clássico fundador do liberalismo econômico que explica como mercados livres geram prosperidade.', 1),
('direita', 'livro', 'O Caminho da Servidão', 'Friedrich Hayek', 'Crítica ao planejamento central e defesa da liberdade individual contra o totalitarismo.', 2),
('direita', 'livro', 'Capitalismo e Liberdade', 'Milton Friedman', 'Defesa do livre mercado e crítica à intervenção governamental na economia.', 3),
('direita', 'livro', 'Como Ser um Conservador', 'Roger Scruton', 'Filosofia conservadora moderna e a importância das tradições e instituições.', 4),
('direita', 'livro', 'Reflexões sobre a Revolução em França', 'Edmund Burke', 'Fundamento do pensamento conservador ocidental.', 5),
('esquerda', 'livro', 'O Capital', 'Karl Marx', 'Análise crítica do capitalismo e suas contradições internas.', 1),
('esquerda', 'livro', 'Pedagogia do Oprimido', 'Paulo Freire', 'Educação como prática da liberdade e conscientização social.', 2),
('esquerda', 'livro', 'A Era dos Extremos', 'Eric Hobsbawm', 'História do século XX sob perspectiva marxista.', 3),
('esquerda', 'livro', 'Quarto de Despejo', 'Carolina Maria de Jesus', 'Diário de uma favelada sobre desigualdade social no Brasil.', 4),
('esquerda', 'livro', 'Raízes do Brasil', 'Sérgio Buarque de Holanda', 'Análise da formação social brasileira.', 5),
('centro', 'livro', 'O Federalista', 'Hamilton, Madison e Jay', 'Defesa do sistema republicano e do equilíbrio de poderes.', 1),
('centro', 'livro', 'A Sociedade Aberta e Seus Inimigos', 'Karl Popper', 'Crítica aos totalitarismos de esquerda e direita.', 2),
('centro', 'livro', 'Democracia na América', 'Alexis de Tocqueville', 'Análise clássica da democracia e suas instituições.', 3),
('centro', 'livro', 'Por que as Nações Fracassam', 'Daron Acemoglu', 'Importância das instituições para o desenvolvimento.', 4),
('centro', 'livro', 'O Príncipe', 'Nicolau Maquiavel', 'Tratado clássico sobre o poder e a política pragmática.', 5);

-- 7. Inserir perfis de Instagram
INSERT INTO politica_conteudo_orientacao (orientacao, tipo, titulo, descricao, url, ordem) VALUES
('direita', 'perfil_instagram', 'Brasil Paralelo', 'Produtora de documentários conservadores', 'https://instagram.com/brasilparalelo', 1),
('direita', 'perfil_instagram', 'Gazeta do Povo', 'Jornal de centro-direita do Paraná', 'https://instagram.com/gazetadopovo', 2),
('direita', 'perfil_instagram', 'Rodrigo Constantino', 'Economista e comentarista liberal', 'https://instagram.com/rodrigoconstantino', 3),
('esquerda', 'perfil_instagram', 'Mídia NINJA', 'Coletivo de mídia independente progressista', 'https://instagram.com/midianinja', 1),
('esquerda', 'perfil_instagram', 'Brasil de Fato', 'Portal de notícias populares', 'https://instagram.com/brasildefato', 2),
('esquerda', 'perfil_instagram', 'CartaCapital', 'Revista de análise política progressista', 'https://instagram.com/cartacapital', 3),
('centro', 'perfil_instagram', 'Estadão', 'Jornal tradicional brasileiro', 'https://instagram.com/estadao', 1),
('centro', 'perfil_instagram', 'Folha de S.Paulo', 'Maior jornal do Brasil', 'https://instagram.com/folhadespaulo', 2),
('centro', 'perfil_instagram', 'Poder360', 'Portal de notícias políticas', 'https://instagram.com/poder360', 3);

-- 8. Inserir canais do YouTube
INSERT INTO politica_conteudo_orientacao (orientacao, tipo, titulo, descricao, url, ordem) VALUES
('direita', 'canal_youtube', 'Brasil Paralelo', 'Documentários sobre história e política brasileira', 'https://youtube.com/@BrasilParalelo', 1),
('direita', 'canal_youtube', 'Jovem Pan News', 'Canal de notícias e opinião', 'https://youtube.com/@JovemPanNews', 2),
('direita', 'canal_youtube', 'Os Pingos nos Is', 'Programa de debate político', 'https://youtube.com/@ospingosnoIs', 3),
('esquerda', 'canal_youtube', 'Meteoro Brasil', 'Canal de análise cultural e política', 'https://youtube.com/@MeteoroBrasil', 1),
('esquerda', 'canal_youtube', 'Jones Manoel', 'Professor e historiador marxista', 'https://youtube.com/@jonesmanoel', 2),
('esquerda', 'canal_youtube', 'TV 247', 'Webtv de esquerda', 'https://youtube.com/@TV247', 3),
('centro', 'canal_youtube', 'Estadão', 'Canal do jornal O Estado de S. Paulo', 'https://youtube.com/@Estadao', 1),
('centro', 'canal_youtube', 'UOL', 'Portal de notícias', 'https://youtube.com/@UOL', 2),
('centro', 'canal_youtube', 'BBC News Brasil', 'Jornalismo internacional', 'https://youtube.com/@BBCNewsBrasil', 3);

-- 9. Inserir portais de notícias
INSERT INTO politica_conteudo_orientacao (orientacao, tipo, titulo, descricao, url, ordem) VALUES
('direita', 'portal', 'Gazeta do Povo', 'Jornal diário de Curitiba', 'https://www.gazetadopovo.com.br', 1),
('direita', 'portal', 'Jovem Pan', 'Rádio e portal de notícias', 'https://jovempan.com.br', 2),
('direita', 'portal', 'Revista Oeste', 'Revista digital conservadora', 'https://revistaoeste.com', 3),
('esquerda', 'portal', 'Brasil de Fato', 'Jornalismo popular', 'https://www.brasildefato.com.br', 1),
('esquerda', 'portal', 'CartaCapital', 'Revista semanal', 'https://www.cartacapital.com.br', 2),
('esquerda', 'portal', 'The Intercept Brasil', 'Jornalismo investigativo', 'https://theintercept.com/brasil', 3),
('centro', 'portal', 'Folha de S.Paulo', 'Maior jornal brasileiro', 'https://www.folha.uol.com.br', 1),
('centro', 'portal', 'Estadão', 'O Estado de S. Paulo', 'https://www.estadao.com.br', 2),
('centro', 'portal', 'Poder360', 'Portal de notícias políticas', 'https://www.poder360.com.br', 3);

-- 10. Inserir artigos do blog por orientação
INSERT INTO politica_blog_orientacao (orientacao, titulo, resumo, termo_wikipedia, ordem) VALUES
('direita', 'O que é ser de direita?', 'Entenda os princípios fundamentais do pensamento de direita: tradição, liberdade econômica e valores.', 'Direita_(política)', 1),
('direita', 'História do conservadorismo no Brasil', 'Das origens imperiais aos movimentos contemporâneos.', 'Conservadorismo_no_Brasil', 2),
('direita', 'Liberalismo econômico explicado', 'Como funciona o livre mercado e por que seus defensores acreditam nele.', 'Liberalismo_económico', 3),
('direita', 'Principais pensadores da direita', 'De Edmund Burke a Milton Friedman: os filósofos que moldaram a direita.', 'Conservadorismo', 4),
('esquerda', 'O que é ser de esquerda?', 'Entenda os princípios do progressismo: igualdade, justiça social e transformação.', 'Esquerda_(política)', 1),
('esquerda', 'História do progressismo no Brasil', 'Das lutas operárias à redemocratização.', 'Esquerda_política_no_Brasil', 2),
('esquerda', 'Justiça social explicada', 'O que significa buscar uma sociedade mais igualitária.', 'Justiça_social', 3),
('esquerda', 'Principais pensadores da esquerda', 'De Marx a Paulo Freire: os filósofos que moldaram a esquerda.', 'Socialismo', 4),
('centro', 'O que é ser de centro?', 'Pragmatismo, moderação e equilíbrio entre ideias de esquerda e direita.', 'Centrismo', 1),
('centro', 'Social-democracia explicada', 'O modelo que combina economia de mercado com proteção social.', 'Social-democracia', 2),
('centro', 'Como o centro equilibra ideias', 'A busca por consensos e soluções pragmáticas.', 'Terceira_via', 3),
('centro', 'Instituições democráticas', 'A importância do equilíbrio de poderes e do Estado de Direito.', 'Democracia_liberal', 4);