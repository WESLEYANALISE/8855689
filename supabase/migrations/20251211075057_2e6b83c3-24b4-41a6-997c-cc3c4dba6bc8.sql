-- Limpar registros incorretos do Estatuto do Desarmamento que foram inseridos erroneamente
-- na tabela do Estatuto da Pessoa com Deficiência

-- Verificar quantos registros serão removidos (ids >= 2000 são do Desarmamento)
-- DELETE apenas os registros que contêm conteúdo de armas/Desarmamento

DELETE FROM "ESTATUTO - PESSOA COM DEFICIÊNCIA"
WHERE id >= 2000;