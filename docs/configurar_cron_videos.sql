-- =====================================================
-- CONFIGURAÇÃO DE CRON JOBS PARA VÍDEOS RESUMO DO DIA
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Após executar, os vídeos serão gerados e enviados automaticamente

-- Habilitar extensões necessárias (se não estiverem habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- 1. GERAR VÍDEOS - Executar às 20:50 BRT (23:50 UTC)
-- =====================================================

-- Vídeo de Direito
SELECT cron.schedule(
  'gerar-video-resumo-direito',
  '50 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-video-resumo-dia',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('area', 'direito')
  );
  $$
);

-- Vídeo de Política
SELECT cron.schedule(
  'gerar-video-resumo-politica',
  '52 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-video-resumo-dia',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('area', 'politica')
  );
  $$
);

-- Vídeo de Concursos
SELECT cron.schedule(
  'gerar-video-resumo-concurso',
  '54 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-video-resumo-dia',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('area', 'concurso')
  );
  $$
);

-- =====================================================
-- 2. ENVIAR VÍDEOS - Executar às 21:00 BRT (00:00 UTC)
-- =====================================================

SELECT cron.schedule(
  'enviar-videos-resumo-dia',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/enviar-video-resumo-dia',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- =====================================================
-- COMANDOS DE GERENCIAMENTO
-- =====================================================

-- Ver todos os cron jobs de vídeo
-- SELECT * FROM cron.job WHERE jobname LIKE '%video%';

-- Remover jobs (se precisar)
-- SELECT cron.unschedule('gerar-video-resumo-direito');
-- SELECT cron.unschedule('gerar-video-resumo-politica');
-- SELECT cron.unschedule('gerar-video-resumo-concurso');
-- SELECT cron.unschedule('enviar-videos-resumo-dia');

-- =====================================================
-- TESTES MANUAIS
-- =====================================================

-- Gerar vídeo manualmente (via SQL):
-- SELECT net.http_post(
--   url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-video-resumo-dia',
--   headers := '{"Content-Type": "application/json"}'::jsonb,
--   body := '{"area": "direito", "forcar": true}'::jsonb
-- );

-- Enviar vídeos manualmente:
-- SELECT net.http_post(
--   url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/enviar-video-resumo-dia',
--   headers := '{"Content-Type": "application/json"}'::jsonb,
--   body := '{}'::jsonb
-- );
