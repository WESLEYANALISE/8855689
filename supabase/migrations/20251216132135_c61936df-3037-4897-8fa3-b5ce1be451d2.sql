-- Criar constraint única para permitir upsert na tabela BIBLIOTECA-LEITURA-DINAMICA
ALTER TABLE public."BIBLIOTECA-LEITURA-DINAMICA" 
ADD CONSTRAINT biblioteca_leitura_dinamica_titulo_pagina_unique 
UNIQUE ("Titulo da Obra", "Pagina");