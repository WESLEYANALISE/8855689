-- Criar tabela para questões por artigo de lei
CREATE TABLE public."QUESTOES_ARTIGOS_LEI" (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  artigo TEXT NOT NULL,
  enunciado TEXT NOT NULL,
  alternativa_a TEXT NOT NULL,
  alternativa_b TEXT NOT NULL,
  alternativa_c TEXT NOT NULL,
  alternativa_d TEXT NOT NULL,
  resposta_correta TEXT NOT NULL,
  comentario TEXT,
  exemplo_pratico TEXT,
  url_audio_enunciado TEXT,
  url_audio_comentario TEXT,
  url_audio_exemplo TEXT,
  url_imagem_exemplo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_questoes_artigos_lei_area ON public."QUESTOES_ARTIGOS_LEI" (area);
CREATE INDEX idx_questoes_artigos_lei_artigo ON public."QUESTOES_ARTIGOS_LEI" (artigo);
CREATE INDEX idx_questoes_artigos_lei_area_artigo ON public."QUESTOES_ARTIGOS_LEI" (area, artigo);

-- Habilitar RLS
ALTER TABLE public."QUESTOES_ARTIGOS_LEI" ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Questões de artigos são públicas para leitura" 
ON public."QUESTOES_ARTIGOS_LEI" 
FOR SELECT 
USING (true);

-- Política de update para sistema
CREATE POLICY "Sistema pode atualizar questões de artigos" 
ON public."QUESTOES_ARTIGOS_LEI" 
FOR UPDATE 
USING (true);

-- Política de insert para sistema
CREATE POLICY "Sistema pode inserir questões de artigos" 
ON public."QUESTOES_ARTIGOS_LEI" 
FOR INSERT 
WITH CHECK (true);