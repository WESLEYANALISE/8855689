
# Plano: Melhorias nos Flashcards das Trilhas OAB

## Resumo das Mudanças

Este plano implementa três melhorias principais nos flashcards do módulo OAB Trilhas:

1. **Mostrar exemplo prático** quando o usuário virar o flashcard
2. **Remover botão "Marcar como Concluído"** - conclusão automática ao ver todos os flashcards
3. **Ajustar quantidades geradas**: 15-25 flashcards e 15-20 questões por subtema

---

## Mudanças Necessárias

### 1. Componente FlashcardStack (Interface Visual)

**Arquivo**: `src/components/conceitos/FlashcardStack.tsx`

**O que fazer**:
- Adicionar campo `exemplo?` na interface `Flashcard`
- Mostrar seção "Exemplo Prático" abaixo da resposta quando o card está virado e tem exemplo
- Usar o mesmo visual do componente `VideoaulaFlashcards` (caixa amarela com ícone de lâmpada)
- Adicionar callback `onComplete` que será chamado automaticamente quando o usuário chegar no último card

**Resultado visual**: Quando o usuário virar um flashcard, além da resposta verá uma caixa amarela com "Exemplo Prático" contendo uma situação real que ilustra o conceito.

---

### 2. Página de Flashcards OAB Trilhas

**Arquivo**: `src/pages/oab/OABTrilhasSubtemaFlashcards.tsx`

**O que fazer**:
- Remover completamente o botão "Marcar como Concluído" e estados relacionados (`allReviewed`)
- Passar o campo `exemplo` junto com `pergunta` e `resposta` para o FlashcardStack
- Adicionar callback `onComplete` no FlashcardStack que marca automaticamente como concluído quando o usuário chega no último flashcard
- A conclusão automática salva o progresso no banco e exibe a tela de sucesso

---

### 3. Geração de Conteúdo - Subtemas (RESUMO)

**Arquivo**: `supabase/functions/gerar-conteudo-resumo-oab/index.ts`

**O que fazer**:
- Alterar a quantidade de flashcards de `15+` para `15-25`
- Alterar a quantidade de questões de `8+` para `15-20`
- Garantir que cada flashcard tenha um exemplo prático

**Trecho atual** (linha ~483):
```
QUANTIDADES: correspondencias: 8+, flashcards: 15+, questoes: 8+
```

**Novo**:
```
QUANTIDADES: correspondencias: 8+, flashcards: 15-25, questoes: 15-20
```

---

### 4. Geração de Conteúdo - Tópicos (oab_trilhas_topicos)

**Arquivo**: `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`

**O que fazer**:
- Alterar a quantidade de flashcards de `15-20` para `15-25`
- Alterar a quantidade de questões de `8-12` para `15-20`

**Trecho atual** (linhas ~670-671):
```
- flashcards: 15-20 cards
- questoes: 8-12 questões estilo OAB
```

**Novo**:
```
- flashcards: 15-25 cards
- questoes: 15-20 questões estilo OAB
```

---

## Sequência de Implementação

1. Atualizar `FlashcardStack.tsx` - adicionar suporte a exemplo e callback de conclusão
2. Atualizar `OABTrilhasSubtemaFlashcards.tsx` - remover botão manual, passar exemplo, usar callback
3. Atualizar `gerar-conteudo-resumo-oab/index.ts` - ajustar quantidades
4. Atualizar `gerar-conteudo-oab-trilhas/index.ts` - ajustar quantidades
5. Deploy das edge functions

---

## Detalhes Técnicos

### Novo fluxo de conclusão

```text
Usuário abre flashcards
       ↓
Navega pelos cards (pode virar e ver exemplos)
       ↓
Chega no ÚLTIMO card
       ↓
Callback onComplete é chamado automaticamente
       ↓
Salva progresso no banco (flashcards_completos: true)
       ↓
Mostra tela de sucesso com opção "Ir para Questões"
```

### Interface Flashcard atualizada

```typescript
interface Flashcard {
  pergunta: string;
  resposta: string;
  exemplo?: string;  // Novo campo
}
```

### Props FlashcardStack atualizadas

```typescript
interface FlashcardStackProps {
  flashcards: Flashcard[];
  titulo?: string;
  onGoToQuestions?: () => void;
  onComplete?: () => void;  // Novo - chamado ao ver último card
}
```

---

## Observações Importantes

- Conteúdos já gerados continuarão funcionando normalmente
- Os novos flashcards terão exemplos automaticamente (já são gerados com o campo `exemplo`)
- Conteúdos antigos que não têm o campo `exemplo` simplesmente não mostrarão a seção de exemplo
- Para regenerar conteúdos existentes com as novas quantidades, seria necessário reprocessar manualmente cada subtema
