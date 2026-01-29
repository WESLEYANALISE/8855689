-- Criar bucket para imagens do Vade Mecum
INSERT INTO storage.buckets (id, name, public)
VALUES ('vademecum-images', 'vademecum-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar tabela para registrar as imagens
CREATE TABLE IF NOT EXISTS public.vademecum_hero_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  tipo TEXT DEFAULT 'hero',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vademecum_hero_images ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Imagens são públicas para leitura" 
ON public.vademecum_hero_images 
FOR SELECT 
USING (true);

-- Política para upload de arquivos no bucket
CREATE POLICY "Permitir upload público de imagens vademecum"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'vademecum-images');

-- Política para leitura pública de arquivos
CREATE POLICY "Permitir leitura pública de imagens vademecum"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vademecum-images');