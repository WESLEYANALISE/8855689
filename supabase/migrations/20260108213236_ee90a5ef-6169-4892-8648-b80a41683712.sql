-- Recriar função de notificação de novos cadastros com anon key hardcoded
CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
BEGIN
  -- Preparar payload com dados do novo usuário
  payload := jsonb_build_object(
    'tipo', 'novo_cadastro',
    'dados', jsonb_build_object(
      'nome', NEW.nome,
      'email', NEW.email,
      'created_at', NEW.created_at
    )
  );

  -- Chamar edge function via pg_net usando anon key (pública)
  PERFORM net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/notificar-admin-whatsapp',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não falhar o insert se a notificação falhar
  RAISE WARNING 'Falha ao notificar admin: %', SQLERRM;
  RETURN NEW;
END;
$function$;