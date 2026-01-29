-- Adicionar constraint UNIQUE para biblioteca_classicos_id
ALTER TABLE leitura_interativa 
ADD CONSTRAINT leitura_interativa_biblioteca_classicos_id_unique 
UNIQUE (biblioteca_classicos_id);