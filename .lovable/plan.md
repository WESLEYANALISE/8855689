
# Plano: Correções nos Prompts de Conceitos para Alinhar com OAB Trilhas

## Problemas Identificados

Após análise comparativa entre `gerar-conteudo-conceitos` e `gerar-conteudo-oab-trilhas`, identifiquei as seguintes diferenças que causam os problemas reportados:

### 1. Quadro Comparativo (Página 5)
**Problema:** O prompt atual permite texto explicativo antes das tabelas. A renderização no Reader também exibe o texto antes da tabela.

**Solução:** 
- Alterar prompt para gerar APENAS tabelas Markdown, sem texto introdutório
- Alterar renderização para não exibir texto antes das tabelas

### 2. Conteúdo Completo (Página 2) - Saudação Redundante
**Problema:** O prompt permite iniciar com "E aí, tudo bem?" ou saudações, mas a saudação já está na Introdução.

**Solução:** 
- Adicionar instrução explícita: "NÃO faça saudações - vá direto ao conteúdo"

### 3. Desmembrando (Página 3) - Deve usar conceitos do Conteúdo Completo
**Problema:** O prompt genérico não deixa claro que deve desmembrar os conceitos específicos do PDF/Conteúdo.

**Solução:** 
- Alinhar com OAB Trilhas: "Pegue os conceitos-chave do conteúdo completo e desmembre cada um em partes menores"

### 4. Dicas para Memorizar (Página 6) - Muito Texto
**Problema:** 600-800 palavras pode gerar conteúdo extenso demais.

**Solução:** 
- Reduzir para 400-600 palavras
- Focar em mnemônicos curtos e pegadinhas objetivas

### 5. Correspondências (Página 7) - Não gera pares
**Problema:** O prompt apenas pede "instrução breve" mas os pares devem vir da geração principal de extras. O problema está na estrutura separada.

**Solução:**
- Alinhar com OAB Trilhas: gerar tudo em uma única chamada JSON com campo `correspondencias` separado

### 6. Síntese Final (Página 8) - Alinhar Tom
**Problema:** Deve seguir o mesmo estilo conversacional sem ser extenso.

**Solução:**
- Reduzir para 400-600 palavras
- Estilo: "Recapitulando tudo que vimos..."

## Alterações Técnicas

### Arquivo 1: `supabase/functions/gerar-conteudo-conceitos/index.ts`

**Mudanças no PAGINAS_CONFIG:**

```text
Página 2 (Conteúdo Completo):
- Adicionar: "NÃO comece com saudações como 'E aí' ou 'Tudo bem'. A introdução já fez isso."
- Adicionar: "Vá direto ao primeiro conceito do tema."

Página 3 (Desmembrando):
- Alterar: "Pegue os conceitos-chave apresentados no Conteúdo Completo e desmembre cada um."
- Adicionar: "Identifique 4-6 termos/conceitos principais e analise cada um em profundidade."

Página 5 (Quadro Comparativo):
- Alterar: "Gere APENAS as tabelas comparativas. SEM texto introdutório ou explicativo."
- Adicionar: "Comece diretamente com a primeira tabela Markdown."

Página 6 (Dicas para Memorizar):
- Reduzir: "400-600 palavras (máximo)"
- Adicionar: "Seja objetivo. Mnemônicos curtos. Pegadinhas em formato de lista."

Página 8 (Síntese Final):
- Reduzir: "400-600 palavras"
- Alterar: "Comece direto com 'Então, recapitulando...'"
```

**Mudanças na estrutura de geração:**
- Alinhar geração de correspondências para incluir no EXTRAS_CONFIG corretamente
- Garantir que o campo `correspondencias` é salvo separadamente e acessível pelo Reader

### Arquivo 2: `src/components/oab/OABTrilhasReader.tsx`

**Mudança na renderização do Quadro Comparativo (linha ~1172-1188):**

```typescript
// ANTES: Renderiza texto antes da tabela
{topicoData.conteudo && (
  <EnrichedMarkdownRenderer 
    content={topicoData.conteudo.split('|')[0].trim()}
    fontSize={fontSize}
    theme="classicos"
  />
)}
<QuadroComparativoVisual ... />

// DEPOIS: Renderiza APENAS a tabela visual
<QuadroComparativoVisual 
  cabecalhos={tabelaExtraida.cabecalhos}
  linhas={tabelaExtraida.linhas}
/>
```

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `gerar-conteudo-conceitos/index.ts` | Atualizar 5 prompts de páginas |
| `OABTrilhasReader.tsx` | Remover texto antes de tabelas |

## Resultado Esperado

Após as alterações:
- Página 2: Inicia direto com explicação, sem saudações
- Página 3: Desmembra conceitos específicos do tema
- Página 5: Mostra APENAS as tabelas comparativas
- Página 6: Dicas objetivas e concisas
- Página 7: Jogo de ligar termos funcional
- Página 8: Síntese concisa e direta
