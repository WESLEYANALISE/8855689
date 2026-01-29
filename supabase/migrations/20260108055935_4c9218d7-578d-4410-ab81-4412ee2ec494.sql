-- Corrigir trigger que impede exclusão de usuários
-- O problema é que o trigger tenta atualizar a tabela durante o CASCADE delete

CREATE OR REPLACE FUNCTION public.update_documentario_comentarios_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_id UUID;
BEGIN
  -- Determinar o documentario_id baseado na operação
  IF TG_OP = 'INSERT' THEN
    doc_id := NEW.documentario_id;
  ELSE
    doc_id := OLD.documentario_id;
  END IF;
  
  -- Verificar se o registro existe antes de atualizar (evita erro no CASCADE)
  IF doc_id IS NOT NULL AND EXISTS (SELECT 1 FROM politica_documentarios WHERE id = doc_id) THEN
    UPDATE politica_documentarios 
    SET total_comentarios = (
      SELECT COUNT(*) FROM politica_documentarios_comentarios 
      WHERE documentario_id = doc_id
    )
    WHERE id = doc_id;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Logar erro mas não bloquear a operação de exclusão
    RAISE WARNING 'Erro ao atualizar contador de comentários: %', SQLERRM;
    IF TG_OP = 'INSERT' THEN
      RETURN NEW;
    ELSE
      RETURN OLD;
    END IF;
END;
$$;

-- Também atualizar o trigger handle_new_user para capturar full_name e avatar do Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, avatar_url)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data ->> 'nome', 
      new.raw_user_meta_data ->> 'full_name', 
      new.raw_user_meta_data ->> 'name'
    ),
    new.email,
    COALESCE(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  RETURN new;
END;
$$;