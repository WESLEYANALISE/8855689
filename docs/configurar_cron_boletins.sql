-- ============================================================
-- CONFIGURAÇÃO DOS CRON JOBS PARA BOLETINS JURÍDICOS
-- ============================================================
-- Execute este SQL no Supabase SQL Editor para configurar
-- a geração automática dos 3 tipos de boletins diários.
--
-- Os boletins serão gerados às 21:50 horário de Brasília (00:50 UTC)
-- ============================================================

-- Habilitar extensões necessárias (se ainda não estiverem ativas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- REMOVER CRON JOBS ANTIGOS (executar primeiro)
-- ============================================================
SELECT cron.unschedule('gerar-boletim-direito-diario');
SELECT cron.unschedule('gerar-boletim-concurso-diario');
SELECT cron.unschedule('gerar-boletim-politica-diario');
SELECT cron.unschedule('verificar-boletins-faltantes');

-- ============================================================
-- CRON JOB 1: Boletim JURÍDICO (não "direito")
-- IMPORTANTE: O tipo correto é "juridica"
-- ============================================================
SELECT cron.schedule(
  'gerar-boletim-juridica-diario',
  '50 0 * * *', -- 00:50 UTC = 21:50 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "juridica"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- CRON JOB 2: Boletim de CONCURSOS
-- ============================================================
SELECT cron.schedule(
  'gerar-boletim-concurso-diario',
  '52 0 * * *', -- 00:52 UTC = 21:52 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "concurso"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- CRON JOB 3: Boletim de POLÍTICA
-- ============================================================
SELECT cron.schedule(
  'gerar-boletim-politica-diario',
  '0 0 * * *', -- 00:00 UTC = 21:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"tipo": "politica"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- CRON JOB 4: Verificação e Retry Automático
-- Roda às 02:00 BRT para verificar boletins faltantes
-- ============================================================
SELECT cron.schedule(
  'verificar-boletins-faltantes',
  '0 5 * * *', -- 05:00 UTC = 02:00 BRT
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/verificar-boletins-faltantes',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
    body := '{"diasVerificar": 5, "tipos": ["juridica", "politica", "concurso"], "autoRegenerar": true}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================
-- VERIFICAR CRON JOBS CRIADOS
-- ============================================================
-- Execute para ver todos os jobs agendados:
SELECT * FROM cron.job WHERE jobname LIKE 'gerar-boletim%' OR jobname LIKE 'verificar-boletins%';

-- ============================================================
-- TESTAR MANUALMENTE (opcional)
-- ============================================================
-- Para verificar boletins faltantes:
-- SELECT net.http_post(
--   url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/verificar-boletins-faltantes',
--   headers := '{"Content-Type": "application/json", "Authorization": "Bearer SEU_ANON_KEY"}'::jsonb,
--   body := '{"diasVerificar": 5, "tipos": ["juridica", "politica"], "autoRegenerar": true}'::jsonb
-- );

-- Para gerar um boletim específico manualmente:
-- SELECT net.http_post(
--   url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-resumo-diario',
--   headers := '{"Content-Type": "application/json", "Authorization": "Bearer SEU_ANON_KEY"}'::jsonb,
--   body := '{"tipo": "juridica", "data": "2026-01-08", "forceRegenerate": true}'::jsonb
-- );
