-- Adicionar coluna para o áudio de boas-vindas personalizado
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS audio_boas_vindas TEXT,
ADD COLUMN IF NOT EXISTS audio_boas_vindas_ouvido BOOLEAN DEFAULT FALSE;