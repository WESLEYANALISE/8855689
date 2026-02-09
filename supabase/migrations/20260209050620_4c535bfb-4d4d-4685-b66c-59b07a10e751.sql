-- Atualizar trigger para notificar admin quando intencao é preenchida
-- (não depender mais de telefone, que não é coletado no onboarding)

CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
BEGIN
  -- Notificar quando intencao for preenchida pela primeira vez
  -- (não depender de telefone, pois não é mais coletado no onboarding)
  IF (OLD.intencao IS NULL OR OLD.intencao = '') 
     AND (NEW.intencao IS NOT NULL AND NEW.intencao != '') THEN
    
    payload := jsonb_build_object(
      'tipo', 'novo_cadastro',
      'dados', jsonb_build_object(
        'nome', NEW.nome,
        'email', NEW.email,
        'telefone', NEW.telefone,
        'dispositivo', NEW.dispositivo,
        'area', NEW.intencao,
        'created_at', NEW.created_at,
        'device_info', NEW.device_info
      )
    );

    PERFORM net.http_post(
      url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/notificar-admin-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', current_setting('supabase.service_role_key', true)
      ),
      body := payload
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Falha ao notificar admin: %', SQLERRM;
  RETURN NEW;
END;
$function$;