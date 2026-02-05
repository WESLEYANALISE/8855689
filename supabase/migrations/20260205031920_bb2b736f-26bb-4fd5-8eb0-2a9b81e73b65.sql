-- Fix profiles.intencao check constraint to include 'oab'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'profiles'
      AND c.conname = 'profiles_intencao_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_intencao_check;
  END IF;
END $$;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_intencao_check
CHECK (intencao = ANY (ARRAY['estudante'::text, 'advogado'::text, 'concurseiro'::text, 'oab'::text]));
