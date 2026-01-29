-- Adicionar colunas para configuração de IA personalizada
ALTER TABLE public.evelyn_config 
ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT 'Olá! Sou a Evelyn, sua assistente jurídica. Como posso te ajudar hoje?',
ADD COLUMN IF NOT EXISTS fontes_ativas JSONB DEFAULT '["CF - Constituição Federal", "CP - Código Penal", "CC - Código Civil", "CPC - Código de Processo Civil", "CLT - Consolidação das Leis do Trabalho"]'::jsonb,
ADD COLUMN IF NOT EXISTS personalidade TEXT DEFAULT 'profissional',
ADD COLUMN IF NOT EXISTS temperatura NUMERIC DEFAULT 0.7;

-- Habilitar Realtime para evelyn_mensagens
ALTER TABLE public.evelyn_mensagens REPLICA IDENTITY FULL;

-- Adicionar à publicação supabase_realtime se ainda não estiver
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'evelyn_mensagens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evelyn_mensagens;
  END IF;
END $$;