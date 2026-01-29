-- Limpar TODO o conteúdo gerado para regenerar com nova lógica
UPDATE "RESUMO" 
SET conteudo_gerado = NULL, url_imagem_resumo = NULL 
WHERE area IN ('Direito Constitucional', 'Ética Profissional', 'Filosofia do Direito');

UPDATE oab_trilhas_topicos 
SET conteudo_gerado = NULL, capa_url = NULL, status = 'pendente'
WHERE conteudo_gerado IS NOT NULL OR status != 'pendente';