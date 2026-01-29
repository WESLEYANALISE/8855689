-- Criar política de INSERT para CPI - Código de Propriedade Industrial (se ainda não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'CPI - Código de Propriedade Industrial'
    AND policyname = 'Sistema pode inserir'
  ) THEN
    EXECUTE 'CREATE POLICY "Sistema pode inserir" ON public."CPI - Código de Propriedade Industrial" FOR INSERT WITH CHECK (true)';
  END IF;
END $$;