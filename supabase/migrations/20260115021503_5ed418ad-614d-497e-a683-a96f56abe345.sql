-- Adicionar coluna para URL do áudio do capítulo
ALTER TABLE leitura_paginas_formatadas 
ADD COLUMN IF NOT EXISTS url_audio_capitulo TEXT;

-- Criar bucket para áudios da biblioteca
INSERT INTO storage.buckets (id, name, public)
VALUES ('audios-biblioteca', 'audios-biblioteca', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública audios biblioteca
CREATE POLICY "Leitura publica audios biblioteca" ON storage.objects
FOR SELECT USING (bucket_id = 'audios-biblioteca');

-- Política de upload (service role e anon para functions)
CREATE POLICY "Upload audios biblioteca" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audios-biblioteca');

-- Política de update audios biblioteca  
CREATE POLICY "Update audios biblioteca" ON storage.objects
FOR UPDATE USING (bucket_id = 'audios-biblioteca');

-- Política de delete audios biblioteca
CREATE POLICY "Delete audios biblioteca" ON storage.objects
FOR DELETE USING (bucket_id = 'audios-biblioteca');