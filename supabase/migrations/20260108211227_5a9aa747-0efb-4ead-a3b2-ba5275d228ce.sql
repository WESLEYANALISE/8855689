-- Criar função para notificar admin via WhatsApp quando novo usuário se cadastrar
CREATE OR REPLACE FUNCTION notify_admin_new_signup()
RETURNS TRIGGER AS $$
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

  -- Chamar edge function via pg_net (assíncrono)
  PERFORM net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/notificar-admin-whatsapp',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não falhar o insert se a notificação falhar
  RAISE WARNING 'Falha ao notificar admin: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para novos cadastros
DROP TRIGGER IF EXISTS trigger_notify_admin_new_signup ON profiles;
CREATE TRIGGER trigger_notify_admin_new_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_signup();