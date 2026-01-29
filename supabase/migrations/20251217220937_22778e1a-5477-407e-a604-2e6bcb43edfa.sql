-- Adicionar constraint UNIQUE na coluna url da tabela noticias_politicas_cache
ALTER TABLE noticias_politicas_cache ADD CONSTRAINT noticias_politicas_cache_url_key UNIQUE (url);