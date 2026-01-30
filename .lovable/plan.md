
# Plano: Reset Completo de Conceitos e Corrigir Erro de Parse JSON

## Problema Identificado

O erro `SyntaxError: Expected property name or '}' in JSON at position 1` ocorre porque:
1. O Gemini retorna respostas com texto/markdown antes ou depois do JSON (ex: "```json\n{...}\n```")
2. A sanitizacao atual (linhas 397-402 e 407-426) esta substituindo `\n` por `\\n` em todo o texto, inclusive FORA de strings JSON, o que quebra a estrutura
3. A funcao `gerarComContinuacao` concatena respostas truncadas, resultando em JSON mal formado

## Solucao em Duas Partes

### Parte 1: Reset Completo do Banco de Dados (SQL)

Apagar todos os topicos de todas as materias de Conceitos:

```sql
-- 1. Deletar todas as paginas de topicos
DELETE FROM conceitos_topico_paginas;

-- 2. Deletar todos os topicos
DELETE FROM conceitos_topicos;

-- 3. Resetar status das materias para que o usuario possa reenviar PDF
UPDATE conceitos_materias
SET 
  status_processamento = NULL,
  temas_identificados = NULL,
  total_paginas = NULL
WHERE 1=1;

-- 4. Deletar paginas extraidas das materias (opcional, mas recomendado)
DELETE FROM conceitos_materia_paginas;
```

Apos rodar este SQL, voce podera reenviar o link do PDF em cada materia e os temas serao identificados do zero.

### Parte 2: Corrigir Edge Function gerar-conteudo-conceitos

O problema de parse JSON precisa de uma correcao mais robusta. Vou copiar a logica exata que funciona na OAB:

**Mudancas principais:**

1. **Extrair JSON corretamente** - Usar regex para encontrar o bloco JSON real:
```typescript
// Remover markdown fences e texto extra
let jsonStr = responseText;
jsonStr = jsonStr.replace(/```json\s*/g, "");
jsonStr = jsonStr.replace(/```\s*/g, "");

// Encontrar o objeto JSON principal
const match = jsonStr.match(/\{[\s\S]*\}/);
if (match) {
  jsonStr = match[0];
}
```

2. **Sanitizar apenas caracteres de controle** - Nao substituir `\n` por `\\n` globalmente:
```typescript
// Remover apenas caracteres de controle invalidos (nao \n, \r, \t que sao validos em JSON)
const sanitized = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
```

3. **Parse mais robusto** - Tentar multiplas estrategias:
```typescript
try {
  conteudoGerado = JSON.parse(sanitized);
} catch {
  // Tentar corrigir trailing commas
  const fixed = sanitized.replace(/,\s*([}\]])/g, "$1");
  conteudoGerado = JSON.parse(fixed);
}
```

## Resumo dos Arquivos

### Arquivos que serao alterados:
- `supabase/functions/gerar-conteudo-conceitos/index.ts` - Corrigir parse JSON

### SQL para rodar manualmente:
O usuario devera rodar o SQL de reset no Supabase Cloud View > Run SQL

## Sequencia de Execucao

1. Rodar SQL de reset no Supabase (limpar todos os topicos)
2. Corrigir a edge function `gerar-conteudo-conceitos`
3. Deploy da edge function
4. Reenviar PDF em cada materia
5. Confirmar temas identificados
6. Geracao automatica ira iniciar

## Resultado Esperado

- Todos os topicos de Conceitos serao apagados
- O usuario podera reenviar PDFs para identificar temas
- A geracao de conteudo funcionara sem erros de parse JSON
