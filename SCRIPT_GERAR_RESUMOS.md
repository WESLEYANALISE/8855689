# Script para Gerar Todos os Resumos Automaticamente

Este documento explica como usar o sistema de geração automática de resumos.

## Opção 1: Via Edge Function (Recomendado)

A edge function `gerar-todos-resumos` irá:
- Buscar todos os resumos do banco
- Verificar quais já foram gerados
- Gerar automaticamente os que faltam
- Adicionar delay de 2 segundos entre cada geração para não sobrecarregar

### Como usar:

1. **No Supabase Dashboard:**
   - Vá em Functions
   - Encontre a função `gerar-todos-resumos`
   - Clique em "Invoke"
   - Ou use a URL: `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-todos-resumos`

2. **Via curl:**
```bash
curl -X POST \
  https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-todos-resumos \
  -H "Authorization: Bearer SEU_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

3. **Via JavaScript no console do navegador:**
```javascript
fetch('https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-todos-resumos', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('Resultado:', data);
  console.log(`✅ Processados: ${data.processados}`);
  console.log(`📝 Já existiam: ${data.jaGerados}`);
  console.log(`❌ Erros: ${data.erros}`);
});
```

## Opção 2: Via SQL (Mais simples, mas menos robusto)

Execute no SQL Editor do Supabase:

```sql
-- Criar uma função temporária para gerar resumos
CREATE OR REPLACE FUNCTION gerar_todos_resumos_temp()
RETURNS TABLE (
  resumo_id bigint,
  area text,
  tema text,
  subtema text,
  status text
) AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT id, area, tema, subtema, conteudo, conteudo_gerado
    FROM "RESUMO"
    WHERE subtema IS NOT NULL
    ORDER BY area, tema, "ordem subtema"
  LOOP
    -- Verificar se já foi gerado
    IF r.conteudo_gerado IS NOT NULL AND 
       r.conteudo_gerado->>'markdown' IS NOT NULL THEN
      RETURN QUERY SELECT r.id, r.area, r.tema, r.subtema, 'já_gerado'::text;
    ELSE
      -- Marcar como pendente (precisa gerar manualmente depois)
      RETURN QUERY SELECT r.id, r.area, r.tema, r.subtema, 'pendente'::text;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar para ver o status
SELECT * FROM gerar_todos_resumos_temp();

-- Limpar função temporária
DROP FUNCTION IF EXISTS gerar_todos_resumos_temp();
```

## O que a Edge Function faz:

1. ✅ Busca todos os resumos da tabela RESUMO
2. ✅ Filtra apenas os que têm subtema (resumos válidos)
3. ✅ Verifica quais já têm conteúdo_gerado
4. ✅ Para cada resumo sem conteúdo:
   - Chama a função `gerar-resumo-pronto`
   - Aguarda 2 segundos antes de processar o próximo
   - Registra sucesso ou erro
5. ✅ Retorna um relatório completo com:
   - Total de resumos
   - Quantos foram processados
   - Quantos já existiam
   - Quantos deram erro
   - Lista detalhada de cada resumo

## Resposta da API:

```json
{
  "total": 500,
  "processados": 450,
  "jaGerados": 30,
  "erros": 20,
  "detalhes": [
    {
      "id": 123,
      "area": "Direito Civil",
      "tema": "Contratos",
      "subtema": "Conceito de Contrato",
      "status": "sucesso"
    },
    ...
  ]
}
```

## Melhorias Implementadas:

### 1. ✅ Formatação WhatsApp Aprimorada
- Emojis contextuais (⚖️, 📜, 💡, etc.)
- Estrutura visual com bordas
- Melhor hierarquia de informações
- Listas numeradas com emojis (1️⃣, 2️⃣, etc.)

### 2. ✅ Exportação PDF
- Já estava funcionando corretamente
- Salva temporariamente e faz download automático
- Formato ABNT completo

### 3. ✅ Geração Automática
- Edge function para processar todos os resumos
- Sistema de delay para não sobrecarregar
- Relatório detalhado de progresso

## Notas Importantes:

⚠️ **Tempo de Execução:** 
- Com 2 segundos de delay entre cada resumo
- 500 resumos = ~17 minutos
- Ajuste o delay se necessário na linha: `setTimeout(resolve, 2000)`

⚠️ **Custos:**
- Cada resumo gerado consome créditos da API de IA
- Monitore o uso no dashboard do Supabase

⚠️ **Timeout:**
- Edge functions têm timeout de 150 segundos
- Se houver muitos resumos, pode dar timeout
- Nesse caso, execute várias vezes até processar todos
