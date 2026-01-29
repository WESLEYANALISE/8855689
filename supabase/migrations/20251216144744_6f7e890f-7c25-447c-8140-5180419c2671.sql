-- Limpar cache de formatação para reaplicar nova formatação premium
-- Isso forçará todas as páginas a serem reformatadas com o novo prompt melhorado

DELETE FROM leitura_paginas_formatadas;

-- Notificar quantas páginas foram limpas
SELECT 'Cache de formatação limpo. Todas as páginas serão reformatadas com o novo estilo premium.' as status;