-- Limpar todos os flashcards gerados para regenerar com base_legal
TRUNCATE TABLE public."FLASHCARDS_GERADOS";

-- Limpar também os áudios e imagens relacionados (URLs ficam inválidas após deletar)
-- Os arquivos no storage permanecerão, mas não serão mais referenciados