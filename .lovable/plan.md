
# Plano: Alinhar Conceitos com OAB Trilhas - Formatação de Conteúdo

## Problema Identificado

Após análise detalhada do código e dos dados gerados, identifiquei as seguintes discrepâncias entre Conceitos e OAB Trilhas:

### 1. Blocos Especiais Sem Fundo Colorido
O renderizador (`EnrichedMarkdownRenderer.tsx`) exige que blocos especiais comecem com `>` (blockquote):
- **Formato correto:** `> 💡 **DICA:** texto aqui`
- **Formato atual (errado):** `💡 **DICA:** texto aqui`

Sem o `>`, os blocos são tratados como texto normal e não recebem o fundo colorido diferenciado.

### 2. Introdução Muito Longa
O prompt pede 300-500 palavras, mas o conteúdo gerado está muito extenso, não seguindo a estrutura enxuta com pontos-chave.

### 3. Quadro Comparativo Incompleto
As tabelas comparativas não estão sendo geradas corretamente - alguns aparecem como "Conteúdo não disponível".

### 4. Discrepâncias no Estilo
O OAB Trilhas usa tom conversacional com elementos estruturados, enquanto Conceitos está misturando estilos.

---

## Alterações Planejadas

### Arquivo 1: `supabase/functions/gerar-conteudo-conceitos/index.ts`

#### 1.1 Corrigir Prompt da Introdução (linhas 11-23)
- Reduzir limite para **150-250 palavras**
- Estruturar como lista de pontos-chave (3-5 bullets)
- Remover texto introdutório longo

**Novo formato:**
```text
Escreva uma introdução BREVE de 150-250 palavras MÁXIMO.
Estrutura OBRIGATÓRIA:
1. Uma frase engajadora sobre o tema
2. Por que isso é importante (1-2 frases)
3. Lista de 3-5 pontos-chave que serão abordados:
   - Ponto 1
   - Ponto 2
   - Ponto 3

Termine com:
> 🎯 **VOCÊ SABIA?:** [curiosidade relevante]
```

#### 1.2 Corrigir Formato dos Elementos Visuais (linhas 24-40)
Enfatizar o uso obrigatório de blockquote `>` em todos os elementos:

**Instruir claramente:**
```text
FORMATO OBRIGATÓRIO (com > no início da linha):
> ⚠️ **ATENÇÃO:** [texto]
> 💡 **DICA:** [texto]
> 📌 **EM RESUMO:** [texto]
> 💼 **CASO PRÁTICO:** [texto]
> 🎯 **VOCÊ SABIA?:** [texto]

⛔ ERRADO (não usar):
⚠️ **ATENÇÃO:** texto (SEM o > no início)
```

#### 1.3 Melhorar Quadro Comparativo (linhas 88-115)
Adicionar exemplos mais claros e exigir no mínimo 3 tabelas:

```text
CRIE OBRIGATORIAMENTE pelo menos 3 tabelas comparativas.
Cada tabela deve comparar institutos jurídicos do tema.
NÃO escreva "Conteúdo não disponível".
```

#### 1.4 Atualizar Prompt Base (linhas 417-456)
Adicionar regra explícita sobre o formato blockquote para elementos visuais.

---

## Resumo Técnico

| Componente | Problema | Solução |
|------------|----------|---------|
| Introdução | Muito longa (300-500 palavras) | Reduzir para 150-250 palavras com bullets |
| Elementos visuais | Sem `>` prefix | Instruir uso obrigatório de blockquote |
| Quadro Comparativo | "Conteúdo não disponível" | Exigir mínimo 3 tabelas, exemplos claros |
| Desmembrando | Estilo narrativo | Focar em análise técnica por conceito |

---

## Impacto

Após as alterações:
1. Os blocos de ATENÇÃO, DICA, CASO PRÁTICO terão fundo colorido diferenciado
2. A introdução será enxuta com pontos-chave claros
3. Os quadros comparativos terão tabelas completas e úteis
4. O conteúdo seguirá o mesmo padrão visual do OAB Trilhas

**Nota:** Será necessário regenerar os tópicos existentes para aplicar o novo formato.
