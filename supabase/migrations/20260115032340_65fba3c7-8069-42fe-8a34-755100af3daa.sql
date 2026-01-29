
-- Limpar todas as páginas formatadas
DELETE FROM leitura_paginas_formatadas;

-- Limpar todos os índices de capítulos
DELETE FROM leitura_livros_indice;

-- Limpar também o status de formatação na tabela antiga (se existir)
UPDATE leitura_interativa 
SET paginas_formatadas = '{}', 
    formatacao_status = 'pendente', 
    formatacao_progresso = 0;
