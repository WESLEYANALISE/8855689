-- ============================================================================
-- CONFIGURAÇÃO DE CRON JOBS PARA ATUALIZAÇÃO DE RANKINGS POLÍTICOS
-- ============================================================================
-- Este arquivo contém os comandos SQL para configurar cron jobs que atualizam
-- automaticamente os rankings de deputados federais.
--
-- REQUISITOS:
-- 1. Extensões pg_cron e pg_net habilitadas no Supabase
-- 2. Edge Function 'atualizar-rankings-politicos' deployada
--
-- FREQUÊNCIAS:
-- - Despesas: Dia 5 de cada mês às 3h (dados do mês anterior)
-- - Mandato: Domingos às 4h (consolidado geral)
-- - Proposições: Sábados às 2h (projetos de lei)
-- - Presença: Diário às 23h (sessões plenárias)
-- - Comissões: Dia 1 de cada mês às 5h (participação em comissões)
-- - Discursos: Sábados às 3h (discursos em plenário)
-- ============================================================================

-- ============================================================================
-- PASSO 1: HABILITAR EXTENSÕES (se ainda não habilitadas)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- PASSO 2: CRIAR OS CRON JOBS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 RANKING DE DESPESAS - Mensal (dia 5 às 3h)
-- Atualiza ranking de gastos com cota parlamentar
-- ----------------------------------------------------------------------------
SELECT cron.schedule(
  'ranking-deputados-despesas-mensal',
  '0 3 5 * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/atualizar-rankings-politicos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "despesas"}'::jsonb
  ) AS request_id;
  $$
);

-- ----------------------------------------------------------------------------
-- 2.2 RANKING POR MANDATO - Semanal (domingos às 4h)
-- Atualiza ranking consolidado do mandato completo
-- ----------------------------------------------------------------------------
SELECT cron.schedule(
  'ranking-deputados-mandato-semanal',
  '0 4 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/atualizar-rankings-politicos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "mandato"}'::jsonb
  ) AS request_id;
  $$
);

-- ----------------------------------------------------------------------------
-- 2.3 RANKING DE PROPOSIÇÕES - Semanal (sábados às 2h)
-- Atualiza ranking de projetos de lei apresentados
-- ----------------------------------------------------------------------------
SELECT cron.schedule(
  'ranking-deputados-proposicoes-semanal',
  '0 2 * * 6',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/atualizar-rankings-politicos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "proposicoes"}'::jsonb
  ) AS request_id;
  $$
);

-- ----------------------------------------------------------------------------
-- 2.4 RANKING DE PRESENÇA - Diário (23h)
-- Atualiza ranking de presença em sessões plenárias
-- ----------------------------------------------------------------------------
SELECT cron.schedule(
  'ranking-deputados-presenca-diario',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/atualizar-rankings-politicos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "presenca"}'::jsonb
  ) AS request_id;
  $$
);

-- ----------------------------------------------------------------------------
-- 2.5 RANKING DE COMISSÕES - Mensal (dia 1 às 5h)
-- Atualiza ranking de participação em comissões
-- ----------------------------------------------------------------------------
SELECT cron.schedule(
  'ranking-deputados-comissoes-mensal',
  '0 5 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/atualizar-rankings-politicos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "comissoes"}'::jsonb
  ) AS request_id;
  $$
);

-- ----------------------------------------------------------------------------
-- 2.6 RANKING DE DISCURSOS - Semanal (sábados às 3h)
-- Atualiza ranking de discursos em plenário
-- ----------------------------------------------------------------------------
SELECT cron.schedule(
  'ranking-deputados-discursos-semanal',
  '0 3 * * 6',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/atualizar-rankings-politicos',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "discursos"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- PASSO 3: VERIFICAR JOBS CRIADOS
-- ============================================================================

-- Listar todos os cron jobs de rankings
SELECT 
  jobid,
  jobname,
  schedule,
  command
FROM cron.job 
WHERE jobname LIKE 'ranking-deputados%'
ORDER BY jobname;

-- ============================================================================
-- PASSO 4: COMANDOS ÚTEIS PARA GERENCIAMENTO
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Remover um job específico
-- ----------------------------------------------------------------------------
-- SELECT cron.unschedule('ranking-deputados-despesas-mensal');
-- SELECT cron.unschedule('ranking-deputados-mandato-semanal');
-- SELECT cron.unschedule('ranking-deputados-proposicoes-semanal');
-- SELECT cron.unschedule('ranking-deputados-presenca-diario');
-- SELECT cron.unschedule('ranking-deputados-comissoes-mensal');
-- SELECT cron.unschedule('ranking-deputados-discursos-semanal');

-- ----------------------------------------------------------------------------
-- 4.2 Remover TODOS os jobs de rankings (use com cuidado!)
-- ----------------------------------------------------------------------------
-- SELECT cron.unschedule(jobname) 
-- FROM cron.job 
-- WHERE jobname LIKE 'ranking-deputados%';

-- ----------------------------------------------------------------------------
-- 4.3 Ver histórico de execuções (últimas 50)
-- ----------------------------------------------------------------------------
SELECT 
  jobid,
  runid,
  job_pid,
  status,
  return_message,
  start_time,
  end_time,
  (end_time - start_time) AS duration
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'ranking-deputados%')
ORDER BY start_time DESC
LIMIT 50;

-- ----------------------------------------------------------------------------
-- 4.4 Ver execuções com erro
-- ----------------------------------------------------------------------------
SELECT 
  j.jobname,
  jrd.status,
  jrd.return_message,
  jrd.start_time
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'ranking-deputados%'
  AND jrd.status = 'failed'
ORDER BY jrd.start_time DESC
LIMIT 20;

-- ----------------------------------------------------------------------------
-- 4.5 Estatísticas de execução por job
-- ----------------------------------------------------------------------------
SELECT 
  j.jobname,
  COUNT(*) AS total_execucoes,
  SUM(CASE WHEN jrd.status = 'succeeded' THEN 1 ELSE 0 END) AS sucesso,
  SUM(CASE WHEN jrd.status = 'failed' THEN 1 ELSE 0 END) AS falhas,
  AVG(EXTRACT(EPOCH FROM (jrd.end_time - jrd.start_time))) AS tempo_medio_segundos
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE 'ranking-deputados%'
GROUP BY j.jobname
ORDER BY j.jobname;

-- ============================================================================
-- REFERÊNCIA RÁPIDA DE CRON EXPRESSIONS
-- ============================================================================
-- ┌───────────── minuto (0-59)
-- │ ┌───────────── hora (0-23)
-- │ │ ┌───────────── dia do mês (1-31)
-- │ │ │ ┌───────────── mês (1-12)
-- │ │ │ │ ┌───────────── dia da semana (0-6) (Domingo=0)
-- │ │ │ │ │
-- * * * * *
--
-- Exemplos:
-- '0 3 5 * *'   = Dia 5 de cada mês às 3h
-- '0 4 * * 0'   = Domingos às 4h
-- '0 2 * * 6'   = Sábados às 2h
-- '0 23 * * *'  = Todos os dias às 23h
-- '*/30 * * * *' = A cada 30 minutos
-- ============================================================================

-- ============================================================================
-- RESUMO DOS JOBS CONFIGURADOS
-- ============================================================================
-- | Job                                    | Frequência        | Horário    |
-- |----------------------------------------|-------------------|------------|
-- | ranking-deputados-despesas-mensal      | Mensal (dia 5)    | 03:00 UTC  |
-- | ranking-deputados-mandato-semanal      | Semanal (domingo) | 04:00 UTC  |
-- | ranking-deputados-proposicoes-semanal  | Semanal (sábado)  | 02:00 UTC  |
-- | ranking-deputados-presenca-diario      | Diário            | 23:00 UTC  |
-- | ranking-deputados-comissoes-mensal     | Mensal (dia 1)    | 05:00 UTC  |
-- | ranking-deputados-discursos-semanal    | Semanal (sábado)  | 03:00 UTC  |
-- ============================================================================
