-- Adicionar colunas para extração granular de alterações
ALTER TABLE public.historico_alteracoes 
ADD COLUMN IF NOT EXISTS elemento_tipo TEXT,
ADD COLUMN IF NOT EXISTS elemento_numero TEXT,
ADD COLUMN IF NOT EXISTS elemento_texto TEXT,
ADD COLUMN IF NOT EXISTS url_lei_alteradora TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.historico_alteracoes.elemento_tipo IS 'Tipo do elemento: artigo, inciso, alinea, paragrafo';
COMMENT ON COLUMN public.historico_alteracoes.elemento_numero IS 'Número do elemento: I, II, a, b, § 1º, etc.';
COMMENT ON COLUMN public.historico_alteracoes.elemento_texto IS 'Texto completo do elemento alterado';
COMMENT ON COLUMN public.historico_alteracoes.url_lei_alteradora IS 'URL da lei que fez a alteração';