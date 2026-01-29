-- Adicionar regra de validação de escopo para evitar expansão artificial
INSERT INTO oab_geracao_regras (categoria, regra, prioridade, ativo) VALUES
('fidelidade', 'LIMITE DE EXPANSÃO: Se o conteúdo fonte (PDF) tiver menos de 500 palavras, adapte proporcionalmente. NÃO invente conceitos para atingir metas de palavras. Fidelidade ao fonte > quantidade. Expanda apenas com explicações e exemplos do que JÁ ESTÁ no texto.', 0, true),
('proibicoes', 'PROIBIDO ABSOLUTAMENTE adicionar conceitos do seu treinamento geral que NÃO estejam LITERALMENTE no texto fonte. Se o PDF não menciona "Poder Constituinte", "Eficácia das Normas", "Princípios Fundamentais", você NÃO pode adicioná-los.', 0, true)
ON CONFLICT DO NOTHING;