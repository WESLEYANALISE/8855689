-- Inserir carreiras que estão faltando na tabela carreiras_capas
INSERT INTO public.carreiras_capas (carreira, url_capa) VALUES
  ('defensor', 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS/carreiras/defensor-placeholder.webp'),
  ('pf', 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS/carreiras/pf-placeholder.webp'),
  ('pcivil', 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS/carreiras/pcivil-placeholder.webp'),
  ('pmilitar', 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS/carreiras/pmilitar-placeholder.webp'),
  ('prf', 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS/carreiras/prf-placeholder.webp'),
  ('procurador', 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/CAPAS/carreiras/procurador-placeholder.webp')
ON CONFLICT (carreira) DO NOTHING;