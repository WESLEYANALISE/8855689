-- Remover os cron jobs antigos
SELECT cron.unschedule('gerar-boletim-juridico-diario');
SELECT cron.unschedule('gerar-boletim-politico-diario');

-- Recriar com novos horários (00:50 e 00:55 UTC = 21:50 e 21:55 São Paulo)
SELECT cron.schedule(
  'gerar-boletim-juridico-diario',
  '50 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body:='{"tipo": "juridica"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'gerar-boletim-politico-diario',
  '55 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body:='{"tipo": "politica"}'::jsonb
  ) as request_id;
  $$
);