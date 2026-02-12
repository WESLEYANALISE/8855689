
-- Tabela para plano de leitura
CREATE TABLE public.biblioteca_plano_leitura (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  biblioteca_tabela TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  capa_url TEXT,
  status TEXT NOT NULL DEFAULT 'quero_ler',
  comentario TEXT,
  progresso INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, biblioteca_tabela, item_id)
);

ALTER TABLE public.biblioteca_plano_leitura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading plan" ON public.biblioteca_plano_leitura FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reading plan" ON public.biblioteca_plano_leitura FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reading plan" ON public.biblioteca_plano_leitura FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reading plan" ON public.biblioteca_plano_leitura FOR DELETE USING (auth.uid() = user_id);

-- Tabela para favoritos
CREATE TABLE public.biblioteca_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  biblioteca_tabela TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  capa_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, biblioteca_tabela, item_id)
);

ALTER TABLE public.biblioteca_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.biblioteca_favoritos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.biblioteca_favoritos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.biblioteca_favoritos FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at no plano de leitura
CREATE TRIGGER update_biblioteca_plano_leitura_updated_at
BEFORE UPDATE ON public.biblioteca_plano_leitura
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
