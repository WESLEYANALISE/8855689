-- Atualizar a função handle_new_user para incluir dispositivo
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, email, avatar_url, dispositivo)
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
    ),
    new.raw_user_meta_data ->> 'dispositivo'
  );
  RETURN new;
END;
$function$;