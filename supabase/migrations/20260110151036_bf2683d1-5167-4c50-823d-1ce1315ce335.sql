-- Adicionar coluna device_info para armazenar informações detalhadas do dispositivo
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_info jsonb;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.profiles.device_info IS 'Informações detalhadas do dispositivo: os, os_version, device_model, browser, screen, language, connection_type, user_agent';