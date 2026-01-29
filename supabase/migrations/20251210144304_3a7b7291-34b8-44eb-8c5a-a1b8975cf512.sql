-- Criar tabela leitura_interativa para armazenar configurações de leitura interativa
CREATE TABLE public.leitura_interativa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  livro_titulo TEXT NOT NULL,
  biblioteca_classicos_id BIGINT REFERENCES public."BIBLIOTECA-CLASSICOS"(id),
  autor TEXT,
  capa_url TEXT,
  total_paginas INTEGER NOT NULL DEFAULT 0,
  estrutura_capitulos JSONB DEFAULT '{"capitulos": []}'::jsonb,
  fonte_tabela TEXT NOT NULL DEFAULT 'AULAS INTERATIVAS',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leitura_interativa ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Leitura interativa é pública para leitura"
ON public.leitura_interativa
FOR SELECT
USING (true);

-- Política para sistema atualizar
CREATE POLICY "Sistema pode atualizar leitura interativa"
ON public.leitura_interativa
FOR UPDATE
USING (true);

-- Política para sistema inserir
CREATE POLICY "Sistema pode inserir leitura interativa"
ON public.leitura_interativa
FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_leitura_interativa_updated_at
BEFORE UPDATE ON public.leitura_interativa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir o primeiro livro: O Espírito das Leis de Montesquieu
INSERT INTO public.leitura_interativa (
  livro_titulo,
  biblioteca_classicos_id,
  autor,
  capa_url,
  total_paginas,
  fonte_tabela,
  ativo
) VALUES (
  'O Espírito das Leis',
  130,
  'Montesquieu',
  'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS//classicos/espirito-das-leis.png',
  684,
  'AULAS INTERATIVAS',
  true
);