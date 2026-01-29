-- Tabela para armazenar localizações do usuário (casa, universidade, trabalho)
CREATE TABLE public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (label IN ('casa', 'universidade', 'trabalho', 'outro')),
  nome TEXT,
  cep TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, label)
);

-- Tabela para armazenar lugares favoritos do usuário
CREATE TABLE public.user_favorite_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  nome TEXT,
  endereco TEXT,
  tipo TEXT,
  foto_url TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  telefone TEXT,
  website TEXT,
  sobre TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- Habilitar RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_places ENABLE ROW LEVEL SECURITY;

-- Políticas para user_locations
CREATE POLICY "Users can view own locations"
  ON public.user_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations"
  ON public.user_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
  ON public.user_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
  ON public.user_locations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para user_favorite_places
CREATE POLICY "Users can view own favorites"
  ON public.user_favorite_places FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.user_favorite_places FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.user_favorite_places FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_locations_updated_at
  BEFORE UPDATE ON public.user_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Garantir que apenas um local seja padrão por usuário
CREATE OR REPLACE FUNCTION public.ensure_single_default_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE public.user_locations 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_location_trigger
  BEFORE INSERT OR UPDATE ON public.user_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_location();