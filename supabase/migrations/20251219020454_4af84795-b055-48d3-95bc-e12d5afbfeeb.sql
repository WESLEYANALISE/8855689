-- Atualizar cron jobs para gerar boletins às 22:50 de Brasília (01:50 UTC)
-- Isso permite que os boletins estejam prontos quando der 23h

-- Remover cron jobs antigos
SELECT cron.unschedule(22);
SELECT cron.unschedule(23);

-- Criar novos cron jobs com horário atualizado (22:50 Brasília = 01:50 UTC)
-- Boletim Jurídico às 01:50 UTC (22:50 Brasília)
SELECT cron.schedule(
  'gerar-boletim-juridico-diario',
  '50 1 * * *',
  $$
  SELECT net.http_post(
    url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body:='{"tipo": "juridica"}'::jsonb
  ) as request_id;
  $$
);

-- Boletim Político às 01:55 UTC (22:55 Brasília) - 5 min depois do jurídico
SELECT cron.schedule(
  'gerar-boletim-politico-diario',
  '55 1 * * *',
  $$
  SELECT net.http_post(
    url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body:='{"tipo": "politica"}'::jsonb
  ) as request_id;
  $$
);