
# Plano: Aprimorar Geração de Slides (40-55 slides, Introdução Engajada, Correspondências no Meio)

## Resumo das Alterações Solicitadas

| Aspecto | Atual | Novo |
|---------|-------|------|
| Quantidade de slides | 35-55 (mínimo 30) | **40-55** (mínimo 40) |
| Slide de introdução | Genérico | **"Prepare seu café!"** + tópicos que serão abordados |
| Título | Pode ser alterado | **Manter título original do PDF** |
| Detalhamento | Médio | **Alto**: explicar termos jurídicos inline no texto |
| Jogo "Ligar Termos" | Qualquer posição | **Posição: entre slides 25-30** (meio) |
| Estrutura | Básica | **Hierárquica e bem estruturada** |

---

## Alterações Técnicas

### 1. Atualizar Constante MIN_PAGINAS

**Arquivo:** `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`
**Linha:** 15

```typescript
// Antes
const MIN_PAGINAS = 30;

// Depois
const MIN_PAGINAS = 40;
```

---

### 2. Atualizar Prompt da Estrutura (Modo Tópico)

**Linhas:** 666-676

Ajustar as regras para:
- Gerar entre 6-8 seções (para atingir 40-55 slides)
- Cada seção com 6-9 páginas
- Incluir "correspondencias" no meio (entre páginas 25-30)

```text
REGRAS:
1. Gere entre 6-8 seções (para alcançar 40-55 páginas totais)
2. Cada seção deve ter 6-9 páginas
3. TIPOS DISPONÍVEIS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck, correspondencias
4. Distribua bem os tipos (não só "texto")
5. Cada seção deve ter pelo menos 1 quickcheck
6. INCLUA pelo menos 2-3 slides tipo "tabela" no total (comparativos)
7. INCLUA exatamente 1 slide "correspondencias" NA SEÇÃO DO MEIO (entre páginas 25-30)
8. Use títulos descritivos para cada página
9. MANTENHA o título original: "${topicoTitulo}" (não altere)
10. Cubra TODO o conteúdo do material
```

---

### 3. Atualizar Prompt de Introdução

**Linhas:** 712-725

Alterar o exemplo de slide "introducao" para incluir engajamento e tópicos:

```json
1. Para tipo "introducao":
   {
     "tipo": "introducao", 
     "titulo": "${topicoTitulo}",
     "conteudo": "☕ Prepare seu café, pois vamos mergulhar juntos em um tema muito importante para a OAB!\n\nNesta aula, vamos estudar [tema] de forma clara e prática. Ao final, você vai entender:\n\n• Tópico 1 que será abordado\n• Tópico 2 importante\n• Tópico 3 essencial\n• Tópico 4 que cai na prova\n\nBora começar?"
   }
```

---

### 4. Adicionar Regra de Detalhamento Inline

**Linhas:** 581-586 (seção PROFUNDIDADE)**

Expandir para instruir explicação inline de termos:

```text
═══ PROFUNDIDADE E DETALHAMENTO ═══
- Mínimo 250-400 palavras em slides tipo "texto"
- SEMPRE que usar um termo jurídico, explique-o INLINE imediatamente:
  ✅ "A 'competência absoluta' (ou seja, regras que não podem ser mudadas pelas partes) determina..."
  ✅ "Isso configura a 'litispendência' (quando já existe outra ação idêntica em andamento)"
- Cite artigos de lei de forma acessível: "O 'artigo 5º da Constituição' garante que..."
- Estruture o texto com hierarquias claras:
  - Use parágrafos curtos (2-3 frases)
  - Separe conceitos principais de detalhes
  - Crie conexões: "Agora que você entendeu X, vamos ver como isso se aplica em Y..."
- Termos-chave entre aspas simples: 'tipicidade', 'culpabilidade'
```

---

### 5. Atualizar Prompt para Correspondências no Meio

**Linhas:** 729-735

Adicionar tipo "correspondencias" nos prompts de seção:

```json
11. Para tipo "correspondencias" (GAMIFICAÇÃO - COLOCAR NO MEIO DA AULA):
    {
      "tipo": "correspondencias", 
      "titulo": "Vamos praticar?", 
      "conteudo": "Conecte cada termo à sua definição correta:",
      "correspondencias": [
        {"termo": "Termo técnico 1", "definicao": "Definição simples 1"},
        {"termo": "Termo técnico 2", "definicao": "Definição simples 2"},
        {"termo": "Termo técnico 3", "definicao": "Definição simples 3"},
        {"termo": "Termo técnico 4", "definicao": "Definição simples 4"}
      ]
    }
```

---

### 6. Atualizar Regras Críticas por Seção

**Linhas:** 763-770

Adicionar regras sobre estrutura hierárquica e correspondências:

```text
REGRAS CRÍTICAS:
- Use TOM CONVERSACIONAL: "Olha só...", "Percebeu?", "Faz sentido, né?"
- SIMPLES PRIMEIRO → TÉCNICO DEPOIS: Explique o conceito antes de dar o nome técnico
- EXPLICAÇÃO INLINE: Todo termo jurídico deve ser explicado entre parênteses
- Tradução IMEDIATA de latim e juridiquês
- Páginas "texto" devem ter 250-400 palavras
- Use HIERARQUIA clara: conceito principal → detalhes → aplicação prática
- Crie conexões entre os slides: "Lembra do que vimos antes? Agora..."
- Se esta seção está no MEIO (seções 3-4), inclua o slide "correspondencias"
- NUNCA use emojis no texto (a interface já adiciona ícones)
```

---

### 7. Modo Resumo: Mesmas Regras

**Linhas:** 1480-1510

Atualizar prompt de estrutura do modo resumo com regras similares:
- 4-6 seções para 25-40 páginas
- Correspondências no meio
- Introdução engajada

---

## Arquivo Modificado

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/gerar-conteudo-oab-trilhas/index.ts` | Atualizar constante MIN_PAGINAS, prompts de estrutura, introdução, detalhamento e correspondências |

---

## Resultado Esperado

1. **Introdução Engajada**: "☕ Prepare seu café!" + lista de tópicos
2. **40-55 slides** por aula (mínimo garantido de 40)
3. **Título preservado** do PDF original
4. **Termos explicados inline** no texto
5. **Correspondências no meio** da aula (entre slides 25-30)
6. **Estrutura hierárquica** clara e bem organizada
7. **Conteúdo mais detalhado** e engajante

---

## Próximos Passos

1. Implementar as alterações na Edge Function
2. Fazer deploy
3. Regenerar um subtema para testar o novo formato
