
# Plano: Alinhar OAB Trilhas 100% com Conceitos

## Problema Identificado

Há **duplicação de elementos** nos slides do OAB Trilhas:
1. O prompt pede para incluir emojis no conteúdo: `"💡 Dica de memorização..."`
2. O componente `ConceitoSlideCard.tsx` TAMBÉM adiciona header com emoji: `> 💡 **DICA DE MEMORIZAÇÃO:**`
3. O título do slide já contém "Dica de Memorização"
4. O label do tipo já mostra "Dica de memorização"

Resultado: **4 repetições** do mesmo conceito!

---

## Diferenças Encontradas (OAB vs Conceitos)

| Aspecto | Conceitos | OAB Trilhas |
|---------|-----------|-------------|
| Emojis no prompt de seção | Tem (problema igual) | Tem (problema igual) |
| imagemPrompt | Sim | Não |
| Referências à prova | Não | Sim ("CAI NA OAB", "prova OAB") |
| Componente renderizador | ConceitoSlideCard | ConceitoSlideCard (mesmo!) |

---

## Solução Proposta

### 1. Corrigir o Prompt de Seção do OAB Trilhas

**Arquivo:** `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`

Remover emojis dos exemplos de conteúdo para evitar duplicação (o componente já adiciona):

```
// ANTES (linha 523-529)
6. Para tipo "atencao":
   {"tipo": "atencao", "conteudo": "⚠️ Ponto importante que CAI NA OAB..."}
7. Para tipo "dica":
   {"tipo": "dica", "conteudo": "💡 Dica de memorização ou macete para a prova OAB..."}
8. Para tipo "caso":
   {"tipo": "caso", "conteudo": "💼 Caso prático que pode aparecer na OAB..."}

// DEPOIS
6. Para tipo "atencao":
   {"tipo": "atencao", "conteudo": "Ponto importante sobre o tema, explicando a pegadinha..."}
7. Para tipo "dica":
   {"tipo": "dica", "conteudo": "Técnica ou macete para memorizar este conceito..."}
8. Para tipo "caso":
   {"tipo": "caso", "conteudo": "Descrição do caso prático com análise jurídica..."}
```

### 2. Remover Referências Desnecessárias à OAB no Prompt de Seção

Remover frases como:
- "que CAI NA OAB" 
- "para a prova OAB"
- "que pode aparecer na OAB"
- "Recapitulando para a OAB"
- "Foco em como o tema CAI NA OAB"

O contexto OAB já está no `promptBase` - não precisa repetir em cada slide.

### 3. Remover Duplicação no Componente `ConceitoSlideCard.tsx`

O componente adiciona manualmente header para "dica":

```typescript
// Linha 233-242
case 'dica':
  const dicaMarkdown = `> 💡 **DICA DE MEMORIZAÇÃO:**\n\n${slide.conteudo}`;
  return (
    <EnrichedMarkdownRenderer 
      content={dicaMarkdown}
      ...
    />
  );
```

**Solução:** Remover esse tratamento especial - deixar o conteúdo ser renderizado diretamente como qualquer outro tipo de texto, já que o label do slide ("Dica de memorização") e o título já identificam o tipo.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/gerar-conteudo-oab-trilhas/index.ts` | Remover emojis e referências "OAB" do prompt de seção (linhas 522-550) |
| `src/components/conceitos/slides/ConceitoSlideCard.tsx` | Remover tratamento especial do caso 'dica' que adiciona header duplicado |

---

## Resultado Esperado

Slides sem duplicação:
- **Antes:** Label "DICA DE MEMORIZAÇÃO" + Título "Dica de Memorização" + Header "💡 DICA DE MEMORIZAÇÃO:" + Conteúdo "💡 Dica de memorização: ..."
- **Depois:** Label "Dica de memorização" + Título descritivo + Conteúdo limpo

O conteúdo gerado será idêntico ao padrão de Conceitos, com tom conversacional e sem repetições.
