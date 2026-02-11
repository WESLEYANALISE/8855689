
-- Função: Páginas populares agregadas no banco (evita limite de 1000 linhas)
CREATE OR REPLACE FUNCTION public.get_admin_paginas_populares(p_dias INTEGER DEFAULT 7)
RETURNS TABLE(page_path TEXT, page_title TEXT, total BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pv.page_path,
    MAX(pv.page_title) as page_title,
    COUNT(*)::BIGINT as total
  FROM page_views pv
  WHERE pv.created_at >= (NOW() - (p_dias || ' days')::INTERVAL)
  GROUP BY pv.page_path
  ORDER BY total DESC
  LIMIT 30;
$$;

-- Função: Contagem de sessões online nos últimos 5 minutos
CREATE OR REPLACE FUNCTION public.get_admin_online_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT session_id)::INTEGER
  FROM page_views
  WHERE created_at >= NOW() - INTERVAL '5 minutes';
$$;

-- Função: Novos usuários por período (com timezone de Brasília)
CREATE OR REPLACE FUNCTION public.get_admin_novos_por_periodo(p_dias INTEGER DEFAULT 0)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM profiles
  WHERE 
    CASE 
      WHEN p_dias = 0 THEN 
        created_at >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE AT TIME ZONE 'America/Sao_Paulo'
      ELSE 
        created_at >= NOW() - (p_dias || ' days')::INTERVAL
    END;
$$;

-- Função: Cadastros por dia para gráfico de evolução
CREATE OR REPLACE FUNCTION public.get_admin_cadastros_por_dia(p_dias INTEGER DEFAULT 30)
RETURNS TABLE(dia DATE, total BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    (created_at AT TIME ZONE 'America/Sao_Paulo')::DATE as dia,
    COUNT(*)::BIGINT as total
  FROM profiles
  WHERE created_at >= NOW() - (p_dias || ' days')::INTERVAL
  GROUP BY dia
  ORDER BY dia;
$$;

-- Função: Usuários ativos únicos por período
CREATE OR REPLACE FUNCTION public.get_admin_ativos_periodo(p_dias INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM page_views
  WHERE created_at >= NOW() - (p_dias || ' days')::INTERVAL
    AND user_id IS NOT NULL;
$$;

-- Função: Total de page views no período
CREATE OR REPLACE FUNCTION public.get_admin_total_pageviews(p_dias INTEGER DEFAULT 7)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::BIGINT
  FROM page_views
  WHERE created_at >= NOW() - (p_dias || ' days')::INTERVAL;
$$;
