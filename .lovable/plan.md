
# Plano: Corrigir Geração de Conceitos e Atualizar Modelo Gemini

## Problemas Identificados

### 1. Prompt Vazando no Conteúdo
Na imagem, aparece o texto "Não inclua nenhuma saudação ou comentários adicionais" no início do conteúdo gerado. Isso acontece porque a IA está repetindo as instruções do prompt no início da resposta.

**Causa**: O prompt na linha 364 da edge function diz:
```
Retorne APENAS o conteúdo em formato Markdown. Não inclua o título da seção...
```
A IA interpretou isso como parte do texto a ser gerado.

### 2. Título Mostrando "Página X" em vez do Nome Real
Na UI está aparecendo "TÓPICO 2 / Página 2" quando deveria mostrar "Conteúdo Completo".

**Causa**: O frontend `ConceitosReader.tsx` está pegando o título da seção `##`, mas o parsing não está funcionando corretamente. A função `extrairTopicos` divide por `## ` e pega o título, mas pode haver problemas na extração.

### 3. Modelo desatualizado gemini-2.0-flash
Você quer atualizar de `gemini-2.0-flash` para `gemini-2.5-flash` em todas as edge functions.

**Funções afetadas** (lista parcial - mais de 50 funções):
- gerar-conteudo-conceitos
- gemini-chat
- formatar-leitura
- gerar-analise-documentario
- gerar-flashcards
- gerar-questoes
- gerar-resumo-obra
- explicar-com-gemini
- ... e muitas outras

## Solução Proposta

### Parte 1: Corrigir Vazamento de Prompt
Modificar o prompt para deixar mais claro que as instruções são APENAS para a IA, não para incluir no texto:

**Antes**:
```
Retorne APENAS o conteúdo em formato Markdown. Não inclua o título da seção (já será adicionado automaticamente).
```

**Depois**:
```
INSTRUÇÕES DE FORMATO (não inclua estas instruções no texto):
- Retorne APENAS o conteúdo em Markdown
- Comece diretamente com o primeiro parágrafo do conteúdo
- O título da seção já será adicionado automaticamente pelo sistema
```

Também vou adicionar uma função de limpeza no edge function para remover frases que parecem instruções caso a IA ainda as inclua.

### Parte 2: Corrigir Títulos (remover "Página X")
O problema está na montagem do conteúdo. Atualmente o título é:
```typescript
const tituloSecao = `## ${p.titulo.split(':')[0]}\n\n`;
```

Isso gera `## Introdução`, `## Conteúdo Completo`, etc. O frontend deve estar lendo corretamente, mas preciso verificar se o parser está extraindo os títulos das seções geradas.

Vou ajustar a função `extrairTopicos` no `ConceitosReader.tsx` para garantir que o título real seja usado e não "Página X".

### Parte 3: Atualizar Modelo para gemini-2.5-flash
Atualizar todas as edge functions que usam `gemini-2.0-flash` para `gemini-2.5-flash`:

| Edge Function | Mudança |
|--------------|---------|
| gerar-conteudo-conceitos | gemini-2.0-flash → gemini-2.5-flash |
| gemini-chat | gemini-2.0-flash → gemini-2.5-flash |
| formatar-leitura | gemini-2.0-flash → gemini-2.5-flash |
| gerar-analise-documentario | gemini-2.0-flash → gemini-2.5-flash |
| chat-professora-jurista | gemini-2.0-flash → gemini-2.5-flash |
| gerar-flashcards | gemini-2.0-flash → gemini-2.5-flash |
| gerar-questoes | gemini-2.0-flash → gemini-2.5-flash |
| explicar-com-gemini | gemini-2.0-flash → gemini-2.5-flash |
| gerar-resumo-obra | gemini-2.0-flash → gemini-2.5-flash |
| (todas as outras ~50+ funções) | gemini-2.0-flash → gemini-2.5-flash |

## Arquivos a Serem Alterados

### Edge Functions (principais):
1. `supabase/functions/gerar-conteudo-conceitos/index.ts`
   - Corrigir prompt para não vazar instruções
   - Adicionar função de limpeza de texto
   - Atualizar modelo para gemini-2.5-flash

2. `supabase/functions/gemini-chat/index.ts`
   - Atualizar modelo para gemini-2.5-flash

3. `supabase/functions/formatar-leitura/index.ts`
   - Atualizar modelo para gemini-2.5-flash

4. `supabase/functions/gerar-analise-documentario/index.ts`
   - Atualizar modelo para gemini-2.5-flash

5. Mais ~50 outras edge functions com gemini-2.0-flash

### Frontend:
6. `src/components/conceitos/ConceitosReader.tsx`
   - Corrigir extração de títulos das seções
   - Garantir que "Introdução", "Conteúdo Completo", etc apareçam corretamente

## Detalhes Técnicos

### Nova Função de Limpeza (edge function):
```typescript
function limparInstrucoesDoTexto(texto: string): string {
  // Remove frases que parecem instruções da IA
  const padroesInstrucoes = [
    /^(Não inclua|INSTRUÇÕES|Retorne APENAS)[^\n]*\n*/gi,
    /^(Comece diretamente|O título será)[^\n]*\n*/gi,
    /^(Aqui está|Segue o conteúdo)[^\n]*\n*/gi,
  ];
  
  let limpo = texto;
  for (const padrao of padroesInstrucoes) {
    limpo = limpo.replace(padrao, '');
  }
  return limpo.trim();
}
```

### Correção do Parser de Títulos (frontend):
```typescript
// Na função extrairTopicos
const titulo = tituloRaw
  .replace(/^\d+\.\s*/, '') // Remove números
  .replace(/[🔍🃏📌💡💼🎯⚠️]/g, '') // Remove emojis
  .split(':')[0] // Pega apenas a primeira parte antes de ":"
  .trim();
```

## Resultado Esperado

Após as correções:
1. O conteúdo gerado NÃO terá mais frases como "Não inclua nenhuma saudação..."
2. Os títulos aparecerão como "Introdução", "Conteúdo Completo", "Desmembrando o Tema", etc.
3. Todas as edge functions usarão o modelo gemini-2.5-flash (mais avançado e estável)

## Observações Importantes

- O modelo gemini-2.5-flash é mais recente e tem melhor compreensão de instruções
- A mudança será feita em todas as ~50+ edge functions que usam gemini-2.0-flash
- Após as alterações, será necessário resetar um tópico de Conceitos para testar a nova geração
