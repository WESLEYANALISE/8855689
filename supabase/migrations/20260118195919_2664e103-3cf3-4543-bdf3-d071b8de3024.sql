-- Inserir as áreas faltantes
INSERT INTO oab_base_conhecimento_areas (area, status, total_paginas, total_chunks, total_tokens)
VALUES 
  ('Direito da Criança e do Adolescente', 'pendente', 0, 0, 0),
  ('Direito Eleitoral', 'pendente', 0, 0, 0),
  ('Direito Previdenciário', 'pendente', 0, 0, 0);

-- Remover a área "Estatuto da Advocacia e OAB" pois faz parte de Ética Profissional
DELETE FROM oab_base_conhecimento_areas WHERE area = 'Estatuto da Advocacia e OAB';