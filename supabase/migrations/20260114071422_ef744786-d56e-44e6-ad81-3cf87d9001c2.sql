-- Adicionar coluna numero_capitulo na tabela leitura_paginas_formatadas
ALTER TABLE leitura_paginas_formatadas 
ADD COLUMN IF NOT EXISTS numero_capitulo INTEGER;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_leitura_paginas_formatadas_capitulo 
ON leitura_paginas_formatadas(livro_titulo, numero_capitulo);