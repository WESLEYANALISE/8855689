-- Adicionar coluna para URL da capa do capítulo
ALTER TABLE leitura_paginas_formatadas 
ADD COLUMN IF NOT EXISTS url_capa_capitulo TEXT DEFAULT NULL;

-- Índice para buscar apenas páginas que iniciam capítulos
CREATE INDEX IF NOT EXISTS idx_leitura_paginas_chapter_start 
ON leitura_paginas_formatadas(livro_titulo, is_chapter_start) 
WHERE is_chapter_start = true;

-- Comentário
COMMENT ON COLUMN leitura_paginas_formatadas.url_capa_capitulo IS 'URL da capa fotorrealista do capítulo gerada pelo Nano Banana';