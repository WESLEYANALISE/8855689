-- Resetar tópico específico para testar geração com capa
UPDATE conceitos_topicos 
SET 
  status = 'pendente',
  capa_url = NULL,
  updated_at = now()
WHERE id = 108;