
-- RPC para detalhes dos usuários online agora (últimos 5 minutos)
CREATE OR REPLACE FUNCTION public.get_admin_online_details()
RETURNS TABLE(
  user_id uuid,
  nome text,
  email text,
  telefone text,
  dispositivo text,
  page_path text,
  last_seen timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (pv.user_id)
    pv.user_id,
    p.nome,
    p.email,
    p.telefone,
    p.dispositivo,
    pv.page_path,
    pv.created_at as last_seen
  FROM page_views pv
  LEFT JOIN profiles p ON p.id = pv.user_id
  WHERE pv.created_at >= NOW() - INTERVAL '5 minutes'
    AND pv.user_id IS NOT NULL
  ORDER BY pv.user_id, pv.created_at DESC;
$$;

-- RPC para detalhes dos usuários ativos no período
CREATE OR REPLACE FUNCTION public.get_admin_ativos_detalhes(p_dias integer DEFAULT 7)
RETURNS TABLE(
  user_id uuid,
  nome text,
  email text,
  telefone text,
  dispositivo text,
  total_views bigint,
  last_seen timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pv.user_id,
    p.nome,
    p.email,
    p.telefone,
    p.dispositivo,
    COUNT(*)::BIGINT as total_views,
    MAX(pv.created_at) as last_seen
  FROM page_views pv
  LEFT JOIN profiles p ON p.id = pv.user_id
  WHERE pv.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    AND pv.user_id IS NOT NULL
  GROUP BY pv.user_id, p.nome, p.email, p.telefone, p.dispositivo
  ORDER BY last_seen DESC;
$$;

-- RPC para detalhes dos novos usuários no período
CREATE OR REPLACE FUNCTION public.get_admin_novos_detalhes(p_dias integer DEFAULT 7)
RETURNS TABLE(
  user_id uuid,
  nome text,
  email text,
  telefone text,
  dispositivo text,
  intencao text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id as user_id,
    p.nome,
    p.email,
    p.telefone,
    p.dispositivo,
    p.intencao,
    p.created_at
  FROM profiles p
  WHERE 
    CASE 
      WHEN p_dias = 0 THEN 
        p.created_at >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE AT TIME ZONE 'America/Sao_Paulo'
      ELSE 
        p.created_at >= NOW() - (p_dias || ' days')::INTERVAL
    END
  ORDER BY p.created_at DESC;
$$;
