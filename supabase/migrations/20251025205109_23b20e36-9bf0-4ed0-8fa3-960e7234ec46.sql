-- Enable required extensions (idempotent)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Replace existing schedule (if any) to avoid duplicates
do $$
begin
  if exists (select 1 from cron.job where jobname = 'gerar_todos_resumos_batched_minutely') then
    perform cron.unschedule((select jid from cron.job where jobname = 'gerar_todos_resumos_batched_minutely' limit 1));
  end if;
end
$$;

-- Schedule the job to run every minute, processing a small batch each time
select cron.schedule(
  'gerar_todos_resumos_batched_minutely',
  '* * * * *',
  $$
  select
    net.http_post(
      url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-todos-resumos',
      headers:='{"Content-Type":"application/json"}'::jsonb,
      body:='{"batchSize":20}'::jsonb
    ) as request_id;
  $$
);
