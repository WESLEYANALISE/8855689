
# Plano: Alinhar Geração de Conteúdo Conceitos com OAB Trilhas

## Problema Identificado

Após análise detalhada dos dados gerados e comparação direta entre OAB Trilhas e Conceitos, identifiquei as seguintes discrepâncias:

### 1. Quadro Comparativo: "Conteúdo não disponível"
- **OAB Trilhas:** Gera tabelas completas (ex: 7 colunas comparando todas as Escolas Penais)
- **Conceitos:** Mostra "Conteúdo não disponível para esta seção"
- **Causa:** O prompt não está sendo seguido, provavelmente por falta de contexto ou instruções mais enfáticas

### 2. Desmembrando o Tema: Estrutura Diferente
- **OAB Trilhas:** Análise por conceito com bullets (Premissas, Método, Conclusões, Exemplo)
- **Conceitos:** Análise com "Significado jurídico:", "Etimologia/Origem:", "Pronúncia correta:" - muito acadêmico
- **Causa:** O prompt de Conceitos pede análise etimológica/linguística, não análise prática

### 3. Conteúdo Completo: Sem Quadros Comparativos Internos
- **OAB Trilhas:** Inclui tabelas comparativas dentro do Conteúdo Completo quando apropriado
- **Conceitos:** Apenas texto corrido, tabelas só na página dedicada
- **Solução:** Instruir a incluir tabelas comparativas no Conteúdo Completo

### 4. Introdução: Estilo Ainda Conversacional
- **OAB Trilhas:** Tom acolhedor mas direto ao ponto
- **Conceitos:** Ainda usando "Vamos falar sobre um tema super importante..."
- **Causa:** Prompt não está sendo estritamente seguido

### 5. Elementos Visuais: Alguns Sem Fundo
- Alguns elementos `💡 **DICA:**` aparecem sem o `>` prefix

### 6. Títulos do PDF: Não Utilizados
- Os títulos originais dos capítulos do PDF devem ser usados como subtítulos

---

## Alterações Planejadas

### Arquivo: `supabase/functions/gerar-conteudo-conceitos/index.ts`

#### 1. Corrigir Prompt "Desmembrando o Tema" (linhas 58-79)
Substituir a estrutura etimológica/linguística por análise prática igual OAB Trilhas:

**De:**
```text
Para CADA termo ou conceito, analise com esta estrutura:
### [Nome do Conceito]
**Significado jurídico:** ...
**Etimologia/Origem:** ...
**Pronúncia correta:** ...
```

**Para:**
```text
Para CADA conceito principal, estruture assim:

### [Nome do Conceito/Instituto]

*   **Premissas:** Quais são os pressupostos ou fundamentos deste conceito?
*   **Aplicação:** Como funciona na prática jurídica?
*   **Consequências:** Quais são os efeitos jurídicos?
*   **Exemplo:** Dê um caso concreto de aplicação

Use bullets (*) para organizar cada ponto.
```

#### 2. Corrigir Prompt "Quadro Comparativo" (linhas 103-139)
Tornar as instruções mais enfáticas e adicionar fallback:

**Adicionar:**
```text
⛔ ATENÇÃO CRÍTICA: Esta página DEVE conter tabelas Markdown.
Se você não gerar tabelas, a página ficará vazia.

MESMO que o tema pareça não ter comparações óbvias, CRIE tabelas:
- Compare conceitos vs exceções
- Compare requisitos de diferentes situações
- Compare efeitos jurídicos de diferentes hipóteses
- Compare posicionamentos doutrinários

NUNCA, em hipótese alguma, escreva "Conteúdo não disponível".
```

#### 3. Atualizar Prompt "Conteúdo Completo" (linhas 32-56)
Adicionar instrução para incluir tabelas comparativas quando apropriado:

**Adicionar ao promptExtra:**
```text
### TABELAS COMPARATIVAS NO CONTEÚDO:
Quando houver institutos, classificações ou conceitos que possam ser comparados, 
INCLUA tabelas Markdown dentro do texto para facilitar a visualização.

Exemplo:
| Tipo | Característica A | Característica B |
|------|------------------|------------------|
| X    | ...              | ...              |
| Y    | ...              | ...              |
```

#### 4. Reforçar Introdução Enxuta (linhas 11-31)
Manter a estrutura atual mas reforçar que NÃO deve usar frases como "Vamos falar sobre":

**Adicionar:**
```text
⛔ NÃO USE estas frases:
- "Vamos falar sobre..."
- "É um tema super importante..."
- "Vamos lá..."

✅ COMECE ASSIM:
- "[Nome do tema] é o [definição breve]."
- "Este tema aborda [pontos principais]."
```

#### 5. Instruir Uso de Títulos do PDF (linhas 486-497)
Adicionar instrução no promptBase para usar os subtítulos do PDF:

**Adicionar:**
```text
### TÍTULOS E SUBTÍTULOS:
Use os MESMOS títulos e subtítulos que aparecem no PDF.
Se o PDF tiver "1. Escola Clássica", use "## 1. Escola Clássica" no conteúdo.
Mantenha a estrutura original do material.
```

---

## Resumo das Mudanças

| Seção | Problema | Solução |
|-------|----------|---------|
| Desmembrando | Análise etimológica/linguística | Análise prática com bullets (Premissas, Aplicação, Consequências, Exemplo) |
| Quadro Comparativo | "Conteúdo não disponível" | Instruções enfáticas + nunca deixar vazio |
| Conteúdo Completo | Sem tabelas internas | Adicionar tabelas quando há comparações |
| Introdução | "Vamos falar sobre..." | Proibir explicitamente essas frases |
| Títulos | Genéricos | Usar títulos originais do PDF |

---

## Impacto

Após as alterações:
1. **Desmembrando** terá estrutura idêntica ao OAB Trilhas (bullets com Premissas/Método/Conclusões/Exemplo)
2. **Quadro Comparativo** sempre terá tabelas Markdown
3. **Conteúdo Completo** incluirá tabelas comparativas quando apropriado
4. **Introdução** será mais direta sem frases coloquiais
5. Os títulos do PDF original serão preservados na estrutura

Os tópicos existentes precisarão ser regenerados para aplicar o novo formato.
