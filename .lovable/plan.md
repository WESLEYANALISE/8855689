

# Plano: Aprimorar Significativamente a Geração de Slides OAB

## Resumo dos Problemas Identificados

| Problema | Causa | Solução |
|----------|-------|---------|
| Citações de artigos sem destaque | Não há instrução para usar markdown de citação (`>`) | Adicionar regra obrigatória de blockquote |
| Introdução repetida no meio | Não há bloqueio claro de "introducao" após seção 1 | Bloquear tipo "introducao" após primeira seção |
| Falta ênfase em termos-chave | Apenas aspas simples, sem formatação forte | Usar `**negrito**` + aspas para termos críticos |
| Introdução sem tópicos | Exemplo no prompt está incompleto | Melhorar template com lista de tópicos obrigatória |
| Falta slides "atencao" | Não há obrigatoriedade no prompt | Exigir 3-4 slides tipo "atencao" por aula |
| Falta slides "dica" | Opcional atualmente | Exigir 2-3 slides tipo "dica" de memorização |
| Falta "isso cai muito" | Tipo não existe | Criar indicador dentro de slides "atencao" |
| Falta exemplos práticos | Slides "caso" são opcionais | Exigir 3-5 slides tipo "caso" por aula |
| Falta grifo/destaque forte | Apenas aspas simples | Usar `**'termo'**` para grifo visual |

---

## Alterações Técnicas Detalhadas

### 1. Adicionar Regra de Citação em Blockquote (Markdown)

**Arquivo:** `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`

Adicionar nova seção no `promptBase` (após linha 592):

```text
═══ CITAÇÕES DE ARTIGOS (OBRIGATÓRIO) ═══
Sempre que citar um artigo de lei, use BLOCKQUOTE do Markdown para destacar:

FORMATO:
> "Art. 5º - Todos são iguais perante a lei..." (CF/88)

EXEMPLOS:
✅ CERTO:
> "Art. 14, § 1º - O alistamento eleitoral e o voto são obrigatórios para os maiores de dezoito anos." (CF/88)

✅ CERTO:
> "Art. 121 - Matar alguém: Pena - reclusão, de seis a vinte anos." (Código Penal)

❌ ERRADO: Citar o artigo apenas no texto corrido sem destaque.

REGRA: Toda citação literal de artigo DEVE estar em blockquote (>).
```

---

### 2. Bloquear "introducao" Após Primeira Seção

**Alterar prompt de seção (linhas 732-734):**

Adicionar condição para remover "introducao" de seções > 1:

```typescript
// Se não é a primeira seção, remover tipo "introducao" das páginas
if (i > 0) {
  secaoEstrutura.paginas = secaoEstrutura.paginas.filter(
    (p: any) => p.tipo !== 'introducao'
  );
}
```

---

### 3. Melhorar Formatação de Ênfase (Grifo Forte)

**Atualizar seção GRIFO DE TERMOS-CHAVE (linhas 560-579):**

```text
═══ GRIFO E ÊNFASE (OBRIGATÓRIO) ═══
Para destacar termos-chave, use NEGRITO + ASPAS SIMPLES:

• TERMOS TÉCNICOS CRÍTICOS: **'competência absoluta'**, **'litispendência'**
• IDADES: **'16 anos'**, **'18 anos'**, **'35 anos de idade'**
• LEIS E ARTIGOS: **'Art. 5º da CF'**, **'Lei 9.504/97'**
• PRAZOS: **'30 dias'**, **'prazo de 15 dias'**
• VALORES: **'R$ 5.000'**, **'10 salários mínimos'**
• PORCENTAGENS: **'50%'**, **'10,5%'**
• DATAS: **'15 de agosto'**, **'1º de janeiro'**

EXEMPLO:
❌ ERRADO: "O prazo é de 30 dias para interpor recurso."
✅ CERTO: "O prazo é de **'30 dias'** para interpor recurso."

REGRA: Informações numéricas e termos técnicos DEVEM estar em negrito + aspas.
```

---

### 4. Melhorar Template de Introdução

**Atualizar exemplo de introducao (linhas 732-734):**

```json
1. Para tipo "introducao" (APENAS NA PRIMEIRA SEÇÃO - ENGAJAMENTO OBRIGATÓRIO):
   {
     "tipo": "introducao", 
     "titulo": "${topicoTitulo}",
     "conteudo": "☕ Prepare seu café, pois vamos mergulhar juntos em um tema muito importante para a OAB!\n\nNesta aula sobre **${topicoTitulo}**, vamos estudar de forma clara e prática. Ao final, você vai dominar:\n\n• **Conceito principal**: O que é e para que serve\n• **Requisitos legais**: O que a lei exige\n• **Casos práticos**: Como aplicar na prova\n• **Pegadinhas**: O que a banca adora cobrar\n• **Dicas de memorização**: Macetes para não esquecer\n\nVamos juntos? Bora começar! 🎯"
   }
   ⚠️ ATENÇÃO: O slide "introducao" SÓ aparece na PRIMEIRA seção. Nas demais seções, vá direto ao conteúdo.
```

---

### 5. Exigir Slides de Atenção e Dicas

**Atualizar regras de estrutura (linhas 674-685):**

```text
REGRAS OBRIGATÓRIAS:
1. Gere entre 6-8 seções (para alcançar 40-55 páginas totais)
2. Cada seção deve ter 6-9 páginas
3. TIPOS DISPONÍVEIS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck, correspondencias

DISTRIBUIÇÃO MÍNIMA OBRIGATÓRIA:
- "introducao": 1 slide (APENAS na primeira seção)
- "texto": 15-20 slides (conteúdo principal detalhado)
- "atencao": 4-5 slides com "⚠️ ISSO CAI MUITO NA PROVA!" ou "CUIDADO: Pegadinha clássica!"
- "dica": 3-4 slides com técnicas de memorização e macetes
- "caso": 4-5 slides com exemplos práticos do cotidiano
- "tabela": 2-3 slides comparativos
- "quickcheck": 5-6 slides (pelo menos 1 por seção)
- "correspondencias": 1 slide no meio (entre páginas 25-30)
- "termos": 2-3 slides com vocabulário jurídico
- "resumo": 1 slide ao final de cada seção

6. NUNCA repita o slide "introducao" após a primeira seção - vá direto ao conteúdo
7. INCLUA frases de destaque nos slides "atencao": "⚠️ ISSO CAI MUITO NA PROVA!", "ATENÇÃO: A banca adora cobrar isso!"
8. Cada seção deve ter MIX de tipos - não apenas "texto"
```

---

### 6. Melhorar Template do Slide "atencao"

**Atualizar exemplo (linhas 756-758):**

```json
6. Para tipo "atencao" (ALERTA IMPORTANTE - COM INDICADOR DE PROVA):
   {
     "tipo": "atencao", 
     "titulo": "⚠️ ISSO CAI MUITO NA PROVA!", 
     "conteudo": "**Atenção redobrada aqui!**\n\nA banca ADORA cobrar esse ponto. Veja:\n\n> \"Art. XX - [texto do artigo relevante]\" (Lei X)\n\nMuita gente confunde [conceito A] com [conceito B], mas a diferença é crucial:\n\n• **'Conceito A'**: significa X\n• **'Conceito B'**: significa Y\n\n💡 **Dica para não errar**: Lembre-se que [macete de memorização]."
   }
   ⚠️ Obrigatório: 4-5 slides "atencao" por aula para destacar pegadinhas da banca!
```

---

### 7. Melhorar Template do Slide "dica"

**Atualizar exemplo (linhas 759-761):**

```json
7. Para tipo "dica" (TÉCNICA DE MEMORIZAÇÃO):
   {
     "tipo": "dica", 
     "titulo": "💡 Macete para Memorizar", 
     "conteudo": "**Técnica de Memorização: [Nome da técnica]**\n\nPara lembrar de **'[termo técnico]'**, use esta associação:\n\n📌 **Mnemônico**: [frase ou acrônimo]\n\n**Por que funciona?**\nQuando você [explicação simples da associação]...\n\n✅ **Teste agora**: Feche os olhos e repita o mnemônico 3 vezes!"
   }
   ⚠️ Obrigatório: 3-4 slides "dica" por aula com técnicas reais de memorização!
```

---

### 8. Melhorar Template do Slide "caso"

**Atualizar exemplo (linhas 762-764):**

```json
8. Para tipo "caso" (EXEMPLO PRÁTICO DO COTIDIANO):
   {
     "tipo": "caso", 
     "titulo": "📋 Na Prática: Caso de [Contexto]", 
     "conteudo": "**Situação Real:**\n\nImagine que João, um [profissão/situação], está enfrentando [problema concreto do dia-a-dia]...\n\n**Análise Jurídica:**\n\nAqui, aplica-se o **'[termo jurídico]'** (ou seja, [explicação simples]). Conforme:\n\n> \"Art. XX - [citação do artigo]\" ([Lei])\n\n**Conclusão Prática:**\n\nJoão [resultado/solução]. Isso mostra que, na prova, sempre que aparecer [situação similar], você deve pensar em [conceito-chave]."
   }
   ⚠️ Obrigatório: 4-5 slides "caso" por aula para contextualizar a teoria!
```

---

### 9. Adicionar Pós-processamento para Remover Introduções Extras

**Após linha 821, adicionar:**

```typescript
// Remover slides "introducao" de seções que não são a primeira
if (i > 0) {
  secaoCompleta.slides = secaoCompleta.slides.filter(
    (slide: any) => slide.tipo !== 'introducao'
  );
}
```

---

### 10. Aplicar Mesmas Melhorias no Modo Resumo (Subtema)

**Atualizar promptBase e promptSecao do Modo Resumo (linhas 1456-1644)** com:
- Regras de blockquote para citações
- Formatação de ênfase (negrito + aspas)
- Template melhorado de introdução com tópicos
- Exigência de slides "atencao" e "dica"
- Bloqueio de "introducao" após seção 1

---

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/gerar-conteudo-oab-trilhas/index.ts` | Prompts, templates, pós-processamento |

---

## Resultado Esperado

1. **Citações em blockquote**: Artigos citados em formato destacado (`>`)
2. **Introdução única**: Apenas na primeira seção, com lista completa de tópicos
3. **Grifo forte**: Termos-chave em `**'negrito + aspas'**`
4. **Slides "atencao"**: 4-5 por aula com "ISSO CAI NA PROVA!"
5. **Slides "dica"**: 3-4 por aula com técnicas de memorização
6. **Slides "caso"**: 4-5 por aula com exemplos práticos
7. **Exemplos contextualizados**: Situações do cotidiano jurídico
8. **Sem repetição de introdução**: Demais seções vão direto ao conteúdo

