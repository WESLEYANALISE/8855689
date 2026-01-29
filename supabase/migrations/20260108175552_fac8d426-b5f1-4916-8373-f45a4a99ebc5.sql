-- Criar cron jobs para raspar às 8h, 10h e 12h BRT (11h, 13h, 15h UTC)
-- 8h BRT = 11h UTC
SELECT cron.schedule(
  'raspar-resenha-diaria-8h',
  '0 11 * * *',
  $$SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/raspar-resenha-diaria',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'
    ),
    body := '{}'::jsonb
  );$$
);

-- 10h BRT = 13h UTC
SELECT cron.schedule(
  'raspar-resenha-diaria-10h',
  '0 13 * * *',
  $$SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/raspar-resenha-diaria',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'
    ),
    body := '{}'::jsonb
  );$$
);

-- 12h BRT = 15h UTC
SELECT cron.schedule(
  'raspar-resenha-diaria-12h',
  '0 15 * * *',
  $$SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/raspar-resenha-diaria',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y'
    ),
    body := '{}'::jsonb
  );$$
);