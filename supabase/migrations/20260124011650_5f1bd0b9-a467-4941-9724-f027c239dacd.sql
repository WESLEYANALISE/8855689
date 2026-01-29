
-- Limpar conteudo_gerado dos subtemas de Direito Constitucional para regenerar com 7 páginas
UPDATE "RESUMO"
SET conteudo_gerado = NULL, url_imagem_resumo = NULL
WHERE area = 'Direito Constitucional';
