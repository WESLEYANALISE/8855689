-- Atualizar configuração da Evelyn para usar a nova Evolution API do Railway
UPDATE evelyn_config 
SET 
  evolution_url = 'https://evolution-api-production-ab02.up.railway.app',
  qr_code = NULL,
  pairing_code = NULL,
  status = 'desconectado',
  telefone_conectado = NULL,
  updated_at = NOW()
WHERE instance_name = 'evelyn-principal';