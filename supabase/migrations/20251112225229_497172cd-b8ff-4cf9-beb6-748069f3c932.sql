-- Enable required extensions (safe if already enabled)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove existing jobs with the same names to avoid duplicates
select cron.unschedule(jobid)
from cron.job
where jobname in ('atualizar-pl-cada-30min', 'atualizar-plp-cada-30min');

-- Schedule PL updater every 30 minutes
select cron.schedule(
  'atualizar-pl-cada-30min',
  '*/30 * * * *',
  $$
  select
    net.http_post(
        url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-proposicoes-recentes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule PLP updater every 30 minutes
select cron.schedule(
  'atualizar-plp-cada-30min',
  '*/30 * * * *',
  $$
  select
    net.http_post(
        url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-plp-recentes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);