-- Limpar capas de Introdução ao Estudo do Direito para regenerar
UPDATE conceitos_topicos 
SET capa_url = NULL 
WHERE id IN (453, 454, 455);