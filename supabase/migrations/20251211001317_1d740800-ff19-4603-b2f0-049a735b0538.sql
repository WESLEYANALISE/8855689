-- Adicionar colunas para armazenar conteúdo formatado universalmente
ALTER TABLE leitura_interativa 
ADD COLUMN IF NOT EXISTS paginas_formatadas jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS capitulos_conteudo jsonb DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN leitura_interativa.paginas_formatadas IS 'Páginas formatadas pelo Gemini, indexadas por número: {"1": "<html>...", "2": "<html>..."}';
COMMENT ON COLUMN leitura_interativa.capitulos_conteudo IS 'Metadados dos capítulos: {"1": {"titulo": "...", "pagina_inicio": 5, "pagina_fim": 10, "paginas": [5,6,7,8,9,10]}}';