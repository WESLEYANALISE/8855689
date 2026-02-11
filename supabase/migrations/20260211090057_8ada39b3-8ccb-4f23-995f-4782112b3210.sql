
DROP FUNCTION IF EXISTS public.get_admin_online_details();

CREATE OR REPLACE FUNCTION public.get_admin_online_details()
RETURNS TABLE(
  user_id uuid,
  session_id text,
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
  SELECT DISTINCT ON (COALESCE(pv.user_id::text, pv.session_id))
    pv.user_id,
    pv.session_id,
    p.nome,
    p.email,
    p.telefone,
    COALESCE(p.dispositivo, pv.device) as dispositivo,
    pv.page_path,
    pv.created_at as last_seen
  FROM page_views pv
  LEFT JOIN profiles p ON p.id = pv.user_id
  WHERE pv.created_at >= NOW() - INTERVAL '5 minutes'
  ORDER BY COALESCE(pv.user_id::text, pv.session_id), pv.created_at DESC;
$$;
