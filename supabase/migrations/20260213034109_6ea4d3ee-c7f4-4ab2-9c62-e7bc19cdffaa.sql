
-- RPC: Online 30 minutos count
CREATE OR REPLACE FUNCTION public.get_admin_online_30min_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))::integer
  FROM page_views
  WHERE created_at >= NOW() - INTERVAL '30 minutes';
$$;

-- RPC: Online 30 minutos detalhes
CREATE OR REPLACE FUNCTION public.get_admin_online_30min_details()
RETURNS TABLE(
  user_id text,
  nome text,
  email text,
  telefone text,
  dispositivo text,
  page_path text,
  last_seen timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_views AS (
    SELECT 
      pv.user_id,
      pv.session_id,
      pv.page_path,
      pv.device,
      MAX(pv.created_at) as last_seen
    FROM page_views pv
    WHERE pv.created_at >= NOW() - INTERVAL '30 minutes'
    GROUP BY pv.user_id, pv.session_id, pv.page_path, pv.device
  ),
  ranked AS (
    SELECT 
      lv.user_id,
      lv.session_id,
      lv.page_path,
      lv.device,
      lv.last_seen,
      ROW_NUMBER() OVER (PARTITION BY COALESCE(lv.user_id::text, lv.session_id) ORDER BY lv.last_seen DESC) as rn
    FROM latest_views lv
  )
  SELECT 
    COALESCE(r.user_id::text, r.session_id) as user_id,
    p.nome::text,
    p.email::text,
    p.telefone::text,
    COALESCE(p.dispositivo, r.device)::text as dispositivo,
    r.page_path::text,
    r.last_seen
  FROM ranked r
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.rn = 1
  ORDER BY r.last_seen DESC;
$$;

-- Tabela de cache para feedback diário da IA
CREATE TABLE public.admin_daily_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data date NOT NULL UNIQUE,
  feedback_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_daily_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read daily feedback"
ON public.admin_daily_feedback
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert daily feedback"
ON public.admin_daily_feedback
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete daily feedback"
ON public.admin_daily_feedback
FOR DELETE
USING (public.is_admin(auth.uid()));
