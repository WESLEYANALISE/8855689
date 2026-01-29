-- Tabela para armazenar flashcards gerados progressivamente
CREATE TABLE public."FLASHCARDS_GERADOS" (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  subtema TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  exemplo TEXT,
  url_imagem_exemplo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_flashcards_gerados_area ON public."FLASHCARDS_GERADOS" (area);
CREATE INDEX idx_flashcards_gerados_area_tema ON public."FLASHCARDS_GERADOS" (area, tema);
CREATE INDEX idx_flashcards_gerados_area_tema_subtema ON public."FLASHCARDS_GERADOS" (area, tema, subtema);

-- Habilitar RLS
ALTER TABLE public."FLASHCARDS_GERADOS" ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Flashcards gerados são públicos para leitura"
ON public."FLASHCARDS_GERADOS"
FOR SELECT
USING (true);

-- Política de inserção (sistema)
CREATE POLICY "Sistema pode inserir flashcards"
ON public."FLASHCARDS_GERADOS"
FOR INSERT
WITH CHECK (true);

-- Política de atualização (sistema)
CREATE POLICY "Sistema pode atualizar flashcards"
ON public."FLASHCARDS_GERADOS"
FOR UPDATE
USING (true);