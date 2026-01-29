-- Habilitar extensões necessárias para cron job
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar job para atualizar proposições recentes a cada 5 horas
SELECT cron.schedule(
  'atualizar-proposicoes-recentes',
  '0 */5 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-proposicoes-recentes',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
      body := '{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);