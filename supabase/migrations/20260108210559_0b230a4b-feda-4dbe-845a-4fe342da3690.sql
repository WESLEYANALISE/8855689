-- Deletar notícias das fontes removidas (UOL e Jovem Pan)
DELETE FROM noticias_politicas_cache WHERE fonte IN ('UOL', 'Jovem Pan');

-- Deletar também da tabela de conteúdo de orientação política (canais e portais)
DELETE FROM politica_conteudo_orientacao WHERE titulo IN ('Jovem Pan News', 'Jovem Pan', 'UOL');