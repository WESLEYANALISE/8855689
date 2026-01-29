# Instruções para Configurar Cache de PLPs e CRON Jobs

## Passo 1: Criar a Tabela `cache_plp_recentes`

Vá no **Supabase Dashboard** > **SQL Editor** e execute:

```sql
-- Criar tabela para cache de PLPs (Leis Complementares) recentes
CREATE TABLE IF NOT EXISTS public.cache_plp_recentes (
  id bigserial PRIMARY KEY,
  id_proposicao bigint UNIQUE NOT NULL,
  sigla_tipo text NOT NULL,
  numero integer NOT NULL,
  ano integer NOT NULL,
  ementa text NOT NULL,
  titulo_gerado_ia text,
  data_apresentacao timestamp with time zone,
  autor_principal_id bigint,
  autor_principal_nome text,
  autor_principal_foto text,
  autor_principal_partido text,
  autor_principal_uf text,
  url_inteiro_teor text,
  ordem_cache INTEGER DEFAULT 0,
  autores_completos JSONB DEFAULT '[]'::jsonb,
  status TEXT,
  situacao TEXT,
  tema TEXT,
  keywords TEXT[],
  resumo_executivo_ia TEXT,
  quantidade_votacoes INTEGER DEFAULT 0,
  orgao_tramitacao TEXT,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cache_plp_recentes ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "PLPs são públicas para leitura"
ON public.cache_plp_recentes
FOR SELECT
USING (true);

-- Política para sistema inserir
CREATE POLICY "Sistema pode inserir PLPs"
ON public.cache_plp_recentes
FOR INSERT
WITH CHECK (true);

-- Política para sistema atualizar
CREATE POLICY "Sistema pode atualizar PLPs"
ON public.cache_plp_recentes
FOR UPDATE
USING (true);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_plp_data ON public.cache_plp_recentes(data_apresentacao DESC);
CREATE INDEX IF NOT EXISTS idx_plp_updated ON public.cache_plp_recentes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_plp_ordem ON public.cache_plp_recentes(ordem_cache DESC);
CREATE INDEX IF NOT EXISTS idx_plp_id ON public.cache_plp_recentes(id_proposicao);

-- Comentários
COMMENT ON TABLE cache_plp_recentes IS 'Cache de PLPs (Leis Complementares) recentes da Câmara dos Deputados';
COMMENT ON COLUMN cache_plp_recentes.ordem_cache IS 'Ordem de inserção para sistema FIFO - mantém apenas as mais recentes';
```

## Passo 2: Configurar CRON Jobs para Atualização Automática

Execute no **SQL Editor**:

```sql
-- Habilitar extensões necessárias para CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar job CRON para atualizar PLPs a cada 1 hora
SELECT cron.schedule(
  'atualizar-plp-recentes-hora',
  '0 * * * *', -- A cada hora no minuto 0
  $$
  SELECT
    net.http_post(
        url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-plp-recentes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
        body:='{"auto": true}'::jsonb
    ) as request_id;
  $$
);

-- Criar job CRON para atualizar PLs a cada 1 hora (15 minutos depois)
SELECT cron.schedule(
  'atualizar-pl-recentes-hora',
  '15 * * * *', -- A cada hora no minuto 15
  $$
  SELECT
    net.http_post(
        url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-proposicoes-recentes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
        body:='{"auto": true}'::jsonb
    ) as request_id;
  $$
);
```

## Passo 3: Verificar se os CRON Jobs foram criados

```sql
-- Listar todos os jobs CRON ativos
SELECT * FROM cron.job;
```

Você deve ver dois jobs:
- `atualizar-plp-recentes-hora` (roda no minuto 0 de cada hora)
- `atualizar-pl-recentes-hora` (roda no minuto 15 de cada hora)

## Passo 4: Testar Manualmente (Opcional)

Antes de esperar a execução automática, você pode testar manualmente:

```sql
-- Invocar função de PLPs manualmente
SELECT
  net.http_post(
      url:='https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/buscar-plp-recentes',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y"}'::jsonb,
      body:='{"auto": true}'::jsonb
  ) as request_id;
```

## Passo 5: Verificar Dados na Tabela

```sql
-- Ver PLPs mais recentes no cache
SELECT 
  sigla_tipo,
  numero,
  ano,
  titulo_gerado_ia,
  autor_principal_nome,
  data_apresentacao,
  updated_at
FROM cache_plp_recentes
ORDER BY ordem_cache DESC
LIMIT 15;
```

## Como Desabilitar os CRON Jobs (se necessário)

```sql
-- Desabilitar job de PLPs
SELECT cron.unschedule('atualizar-plp-recentes-hora');

-- Desabilitar job de PLs
SELECT cron.unschedule('atualizar-pl-recentes-hora');
```

## Notas Importantes

⏰ **Horários de Execução:**
- PLPs: A cada hora no minuto 0 (00:00, 01:00, 02:00, ...)
- PLs: A cada hora no minuto 15 (00:15, 01:15, 02:15, ...)

📊 **Cache:**
- O cache é válido por 5 horas
- Após 5 horas, os dados são atualizados automaticamente
- Limite de 100 proposições por tipo

🔄 **Sincronização:**
- A tabela `cache_proposicoes_progresso` controla o estado
- Evita processamento duplicado
- Permite retomada em caso de falha

✅ **Pronto!** Agora o sistema vai:
1. Buscar PLPs e PLs automaticamente a cada hora
2. Gerar títulos com IA
3. Buscar fotos dos autores
4. Salvar no cache
5. Exibir nos carrosséis da página principal
