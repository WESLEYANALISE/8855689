-- Deletar os 6 temas do tópico "Constitucionalismo e Classificação das Constituições"
-- para que o usuário possa usar o fluxo de PDF para gerar novamente
DELETE FROM "RESUMO" 
WHERE tema = 'Constitucionalismo e Classificação das Constituições'
AND id IN (5052, 5053, 5054, 5055, 5056, 5057);