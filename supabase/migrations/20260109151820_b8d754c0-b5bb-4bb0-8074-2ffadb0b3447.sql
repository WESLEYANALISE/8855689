-- Dropar o trigger atual que dispara no INSERT
DROP TRIGGER IF EXISTS trigger_notify_admin_new_signup ON public.profiles;

-- Criar novo trigger que dispara no UPDATE quando telefone e intencao forem preenchidos
CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
BEGIN
  -- Só notificar quando telefone e intencao forem preenchidos pela primeira vez
  -- (OLD não tinha e NEW tem)
  IF (OLD.telefone IS NULL OR OLD.telefone = '') 
     AND (NEW.telefone IS NOT NULL AND NEW.telefone != '')
     AND (NEW.intencao IS NOT NULL AND NEW.intencao != '') THEN
    
    -- Preparar payload com dados do usuário
    payload := jsonb_build_object(
      'tipo', 'novo_cadastro',
      'dados', jsonb_build_object(
        'nome', NEW.nome,
        'email', NEW.email,
        'telefone', NEW.telefone,
        'dispositivo', NEW.dispositivo,
        'area', NEW.intencao,
        'created_at', NEW.created_at
      )
    );

    -- Chamar edge function via pg_net
    PERFORM net.http_post(
      url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/notificar-admin-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'
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

-- Criar trigger no UPDATE ao invés de INSERT
CREATE TRIGGER trigger_notify_admin_new_signup
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_signup();