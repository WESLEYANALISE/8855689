-- Atualizar o schedule do cron job para executar a cada 30 minutos
SELECT cron.alter_job(
  job_id := 3,
  schedule := '*/30 * * * *'
);