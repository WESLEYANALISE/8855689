-- Adicionar novas colunas à tabela JURIFLIX para integração com TMDB
ALTER TABLE "JURIFLIX" 
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
ADD COLUMN IF NOT EXISTS tipo_tmdb TEXT,
ADD COLUMN IF NOT EXISTS poster_path TEXT,
ADD COLUMN IF NOT EXISTS backdrop_path TEXT,
ADD COLUMN IF NOT EXISTS titulo_original TEXT,
ADD COLUMN IF NOT EXISTS popularidade DECIMAL,
ADD COLUMN IF NOT EXISTS votos_count INTEGER,
ADD COLUMN IF NOT EXISTS elenco JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS diretor TEXT,
ADD COLUMN IF NOT EXISTS generos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS duracao INTEGER,
ADD COLUMN IF NOT EXISTS orcamento BIGINT,
ADD COLUMN IF NOT EXISTS bilheteria BIGINT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS idioma_original TEXT,
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS onde_assistir JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS similares JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ultima_atualizacao TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance de buscas por tmdb_id
CREATE INDEX IF NOT EXISTS idx_juriflix_tmdb_id ON "JURIFLIX"(tmdb_id);

-- Criar índice para filtros por gênero
CREATE INDEX IF NOT EXISTS idx_juriflix_generos ON "JURIFLIX" USING GIN(generos);

-- Comentários para documentação
COMMENT ON COLUMN "JURIFLIX".tmdb_id IS 'ID do título no The Movie Database';
COMMENT ON COLUMN "JURIFLIX".tipo_tmdb IS 'Tipo no TMDB: movie ou tv';
COMMENT ON COLUMN "JURIFLIX".poster_path IS 'Caminho do poster no TMDB CDN';
COMMENT ON COLUMN "JURIFLIX".backdrop_path IS 'Caminho do backdrop/banner no TMDB CDN';
COMMENT ON COLUMN "JURIFLIX".elenco IS 'Array JSON com elenco principal';
COMMENT ON COLUMN "JURIFLIX".generos IS 'Array JSON com gêneros do TMDB';
COMMENT ON COLUMN "JURIFLIX".videos IS 'Array JSON com trailers e vídeos';
COMMENT ON COLUMN "JURIFLIX".onde_assistir IS 'JSON com plataformas de streaming por região';
COMMENT ON COLUMN "JURIFLIX".similares IS 'Array JSON com títulos similares';