-- Atualizar trigger para ler device_info de string JSON
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  device_info_value jsonb;
BEGIN
  -- Tentar converter device_info_json de string para jsonb
  BEGIN
    device_info_value := (new.raw_user_meta_data ->> 'device_info_json')::jsonb;
  EXCEPTION WHEN OTHERS THEN
    device_info_value := NULL;
  END;
  
  INSERT INTO public.profiles (id, nome, email, avatar_url, dispositivo, device_info)
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
    new.raw_user_meta_data ->> 'dispositivo',
    device_info_value
  );
  RETURN new;
END;
$function$;