-- Inserir artigos sobre salários para cada carreira jurídica
INSERT INTO "BLOGGER_JURIDICO" (categoria, titulo, descricao_curta, ordem, termo_wikipedia, fonte)
VALUES
  ('carreiras_advogado', 'Salário de Advogado', 'Quanto ganha um advogado no Brasil? Conheça a média salarial, variações por área e estado, e como aumentar seus rendimentos na advocacia.', 10, 'Advocacia_no_Brasil', 'gemini'),
  ('carreiras_juiz', 'Salário de Juiz', 'Quanto ganha um juiz no Brasil? Descubra os subsídios da magistratura estadual e federal, benefícios e a evolução na carreira.', 10, 'Magistratura', 'gemini'),
  ('carreiras_delegado', 'Salário de Delegado', 'Quanto ganha um delegado de polícia? Veja os salários por estado, benefícios, adicionais e perspectivas de carreira.', 10, 'Delegado_de_polícia', 'gemini'),
  ('carreiras_promotor', 'Salário de Promotor', 'Quanto ganha um promotor de justiça? Conheça os subsídios do Ministério Público, benefícios e progressão na carreira.', 10, 'Ministério_Público_do_Brasil', 'gemini'),
  ('carreiras_prf', 'Salário de PRF', 'Quanto ganha um policial rodoviário federal? Veja o salário inicial, benefícios, auxílios e evolução na carreira da PRF.', 10, 'Polícia_Rodoviária_Federal', 'gemini'),
  ('carreiras_pf', 'Salário na Polícia Federal', 'Quanto ganha um agente ou delegado da PF? Descubra os salários, benefícios e progressão nos cargos da Polícia Federal.', 10, 'Polícia_Federal_do_Brasil', 'gemini')
ON CONFLICT DO NOTHING;