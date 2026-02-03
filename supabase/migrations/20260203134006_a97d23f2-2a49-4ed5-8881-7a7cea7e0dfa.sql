-- Criar função para atualizar ordem dos temas
CREATE OR REPLACE FUNCTION public.atualizar_ordem_tema(
  p_area TEXT,
  p_tema TEXT,
  p_nova_ordem INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE "RESUMO"
  SET "ordem Tema" = p_nova_ordem::text
  WHERE area = p_area AND tema = p_tema;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;

-- Conceder permissão para chamar a função
GRANT EXECUTE ON FUNCTION public.atualizar_ordem_tema(TEXT, TEXT, INTEGER) TO anon, authenticated;