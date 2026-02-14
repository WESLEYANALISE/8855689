

# Corrigir Flashcards e Questoes Vazios nas Categorias

## Problema Identificado

A geracao de flashcards e questoes esta falhando silenciosamente em TODOS os topicos recentes. Os logs confirmam:

```
Erro flash/questoes: Unterminated string in JSON at position 24098
```

O `maxOutputTokens: 6144` e insuficiente para gerar 22 flashcards + 17 questoes em um unico JSON. A resposta da IA e cortada no meio, o JSON fica invalido, o parse falha, e arrays vazios sao salvos.

Dados no banco confirmam:
- Topicos 31, 34-37: **0 flashcards, 0 questoes** (todos falharam)
- Topicos 32-33: **22 flashcards, 17 questoes** (os unicos que geraram antes da mudanca de prompt)

## Solucao

### 1. Aumentar maxOutputTokens para flashcards/questoes

Mudar de `6144` para `16384` na chamada `gerarJSON(promptFlashQuestoes, ...)` para dar espaco suficiente ao JSON completo.

### 2. Separar geracao de flashcards e questoes em 2 chamadas

Em vez de pedir tudo em uma unica chamada (que gera JSONs enormes), dividir em:
- Chamada 1: 22 flashcards (maxTokens: 8192)
- Chamada 2: 17 questoes (maxTokens: 8192)

Isso reduz o risco de truncamento e melhora a confiabilidade.

### 3. Adicionar fallback com reparo de JSON truncado

Se o JSON terminar com string nao fechada, tentar fechar automaticamente antes de desistir (adicionar `"}]}`).

### 4. Regenerar topicos com flashcards/questoes vazios

Marcar topicos concluidos mas com flashcards/questoes vazios como "pendente" para regerar apenas os extras.

## Arquivo a Modificar

- `supabase/functions/gerar-conteudo-categorias/index.ts`

## Detalhes Tecnicos

Na funcao de geracao de extras (Etapa 3), substituir a chamada unica:

```text
// ANTES (falha por truncamento)
gerarJSON(promptFlashQuestoes, 2, 6144)

// DEPOIS (separado e com mais tokens)
Promise.all([
  gerarJSON(promptFlashcards, 3, 8192),
  gerarJSON(promptQuestoes, 3, 8192),
])
```

Tambem adicionar na funcao `gerarJSON` um reparo extra para JSONs truncados:

```text
// Se o parse falhar por truncamento, tentar fechar arrays/objetos abertos
if (error.message.includes("Unterminated")) {
  text += '"}]}';
  return JSON.parse(text);
}
```

Para os topicos ja gerados com extras vazios, adicionar logica no inicio da funcao que detecta status "concluido" + flashcards vazio e regera apenas os extras (sem reprocessar slides).

