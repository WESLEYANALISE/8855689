-- Tabela para armazenar resumos de artigos de lei
CREATE TABLE public."RESUMOS_ARTIGOS_LEI" (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  tema TEXT NOT NULL,
  conteudo_original TEXT,
  resumo_markdown TEXT,
  exemplos TEXT,
  termos TEXT,
  url_audio_resumo TEXT,
  url_audio_exemplos TEXT,
  url_audio_termos TEXT,
  url_imagem_resumo TEXT,
  url_imagem_exemplo_1 TEXT,
  url_imagem_exemplo_2 TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX idx_resumos_artigos_lei_area_tema ON public."RESUMOS_ARTIGOS_LEI" (area, tema);

-- Enable RLS
ALTER TABLE public."RESUMOS_ARTIGOS_LEI" ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Resumos de artigos são públicos para leitura" 
ON public."RESUMOS_ARTIGOS_LEI" 
FOR SELECT 
USING (true);

-- Política para inserção pelo sistema
CREATE POLICY "Sistema pode inserir resumos de artigos"
ON public."RESUMOS_ARTIGOS_LEI"
FOR INSERT
WITH CHECK (true);

-- Política para atualização pelo sistema
CREATE POLICY "Sistema pode atualizar resumos de artigos"
ON public."RESUMOS_ARTIGOS_LEI"
FOR UPDATE
USING (true);