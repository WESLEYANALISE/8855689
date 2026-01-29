-- Criar índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS politica_blog_orientacao_titulo_orientacao_idx 
ON politica_blog_orientacao (titulo, orientacao);

-- Adicionar mais artigos para geração IA em cada orientação

-- ESQUERDA (+4 artigos)
INSERT INTO politica_blog_orientacao (titulo, orientacao, ordem) VALUES
('Movimentos Sociais e Sua Importância', 'esquerda', 5),
('Estado de Bem-Estar Social', 'esquerda', 6),
('Sindicalismo no Brasil', 'esquerda', 7),
('Políticas de Redistribuição de Renda', 'esquerda', 8);

-- CENTRO (+4 artigos)
INSERT INTO politica_blog_orientacao (titulo, orientacao, ordem) VALUES
('Liberalismo Político Explicado', 'centro', 5),
('Democracia Representativa', 'centro', 6),
('Economia Mista: O Melhor dos Dois Mundos', 'centro', 7),
('Pragmatismo Político', 'centro', 8);

-- DIREITA (+4 artigos)
INSERT INTO politica_blog_orientacao (titulo, orientacao, ordem) VALUES
('Livre Mercado e Suas Vantagens', 'direita', 5),
('Tradição e Conservadorismo', 'direita', 6),
('Propriedade Privada: Fundamento da Liberdade', 'direita', 7),
('Meritocracia Explicada', 'direita', 8);