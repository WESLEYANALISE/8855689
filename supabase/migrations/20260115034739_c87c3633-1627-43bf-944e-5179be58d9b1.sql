-- Adicionar coluna para armazenar URL do áudio individual de cada página
ALTER TABLE leitura_paginas_formatadas
ADD COLUMN IF NOT EXISTS url_audio_pagina TEXT;