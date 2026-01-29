-- Adicionar coluna exemplos (jsonb) na tabela biblioteca_classicos_temas
-- A edge function já salva exemplos como JSON stringify, então usamos text
-- Os termos já existem como jsonb

-- Primeiro verificar se a coluna já existe, se não, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'biblioteca_classicos_temas' 
        AND column_name = 'exemplos'
    ) THEN
        ALTER TABLE public.biblioteca_classicos_temas ADD COLUMN exemplos text;
    END IF;
END $$;