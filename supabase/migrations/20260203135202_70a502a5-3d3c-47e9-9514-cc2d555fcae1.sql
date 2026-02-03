-- Função para inserir tópicos no OAB Trilhas
CREATE OR REPLACE FUNCTION public.inserir_topico_oab_trilhas(
  p_materia_id INTEGER,
  p_titulo TEXT,
  p_ordem INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  novo_id INTEGER;
BEGIN
  INSERT INTO oab_trilhas_topicos (materia_id, titulo, ordem, status)
  VALUES (p_materia_id, p_titulo, p_ordem, 'pendente')
  RETURNING id INTO novo_id;
  
  RETURN novo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.inserir_topico_oab_trilhas(INTEGER, TEXT, INTEGER) TO anon, authenticated;