-- Copiar páginas de conceitos_materia_paginas para conceitos_topico_paginas
-- para a matéria 58 (História do Direito)

-- Tópico 533: páginas 3-6
INSERT INTO conceitos_topico_paginas (topico_id, pagina, conteudo)
SELECT 533, p.pagina, p.conteudo
FROM conceitos_materia_paginas p
WHERE p.materia_id = 58 AND p.pagina >= 3 AND p.pagina <= 6
ON CONFLICT (topico_id, pagina) DO UPDATE SET conteudo = EXCLUDED.conteudo;

-- Tópico 534: páginas 7-9
INSERT INTO conceitos_topico_paginas (topico_id, pagina, conteudo)
SELECT 534, p.pagina, p.conteudo
FROM conceitos_materia_paginas p
WHERE p.materia_id = 58 AND p.pagina >= 7 AND p.pagina <= 9
ON CONFLICT (topico_id, pagina) DO UPDATE SET conteudo = EXCLUDED.conteudo;

-- Tópico 535: páginas 10-12
INSERT INTO conceitos_topico_paginas (topico_id, pagina, conteudo)
SELECT 535, p.pagina, p.conteudo
FROM conceitos_materia_paginas p
WHERE p.materia_id = 58 AND p.pagina >= 10 AND p.pagina <= 12
ON CONFLICT (topico_id, pagina) DO UPDATE SET conteudo = EXCLUDED.conteudo;

-- Tópico 536: páginas 13-15
INSERT INTO conceitos_topico_paginas (topico_id, pagina, conteudo)
SELECT 536, p.pagina, p.conteudo
FROM conceitos_materia_paginas p
WHERE p.materia_id = 58 AND p.pagina >= 13 AND p.pagina <= 15
ON CONFLICT (topico_id, pagina) DO UPDATE SET conteudo = EXCLUDED.conteudo;

-- Tópico 537: páginas 16-19
INSERT INTO conceitos_topico_paginas (topico_id, pagina, conteudo)
SELECT 537, p.pagina, p.conteudo
FROM conceitos_materia_paginas p
WHERE p.materia_id = 58 AND p.pagina >= 16 AND p.pagina <= 19
ON CONFLICT (topico_id, pagina) DO UPDATE SET conteudo = EXCLUDED.conteudo;

-- Tópico 538: páginas 20-26
INSERT INTO conceitos_topico_paginas (topico_id, pagina, conteudo)
SELECT 538, p.pagina, p.conteudo
FROM conceitos_materia_paginas p
WHERE p.materia_id = 58 AND p.pagina >= 20 AND p.pagina <= 26
ON CONFLICT (topico_id, pagina) DO UPDATE SET conteudo = EXCLUDED.conteudo;

-- Resetar todos os tópicos para pendente (usando colunas corretas)
UPDATE conceitos_topicos 
SET status = 'pendente', progresso = 0, conteudo_gerado = NULL, tentativas = 0
WHERE materia_id = 58;