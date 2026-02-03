
# Plano: Melhorias na Geração de Conteúdo OAB Trilhas

## Problemas Identificados

### 1. Exemplo Prático em Todos os Slides
O prompt atual instrui "Sempre incluir exemplo prático em slides de texto", causando repetição excessiva de cards de caso prático em cada slide.

### 2. Linguagem Ainda Técnica
Apesar das instruções existentes, o conteúdo ainda está sendo gerado com termos técnicos sem explicação imediata.

### 3. Scroll não Resetando ao Topo
Quando passa de slide, o conteúdo pode não começar do topo.

### 4. Dois Exemplos no Mesmo Slide
O sistema pode gerar um slide tipo "caso" E ainda incluir exemplo prático dentro do texto.

---

## Solução Proposta

### Etapa 1: Ajustar Prompt de Geração de Conteúdo

Modificar o arquivo `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`:

**Mudanças no promptBase (linhas 325-413):**

1. **Remover regra de "sempre incluir exemplo prático"** - Substituir por regra de distribuição inteligente
2. **Reforçar linguagem acessível** com exemplos mais claros
3. **Adicionar regra explícita** contra múltiplos exemplos no mesmo slide
4. **Melhorar instruções de tradução imediata de termos**

Nova estrutura do prompt:

```
## REGRA SOBRE EXEMPLOS PRÁTICOS (CRÍTICO!)

❌ NÃO inclua exemplo prático em TODOS os slides de texto
✅ Distribua exemplos de forma inteligente:
   - Máximo 1 exemplo por slide
   - Apenas 1 em cada 3-4 slides de texto deve ter exemplo
   - Se o slide é do tipo "caso", o conteúdo JÁ É o exemplo
   - NUNCA coloque "> 📚 **EXEMPLO PRÁTICO:**" dentro de slide tipo "caso"
```

### Etapa 2: Ajustar Scroll to Top

Modificar `src/components/conceitos/slides/ConceitoSlideCard.tsx`:

O scroll atual usa `behavior: 'smooth'` que pode não completar antes da animação do slide. Mudar para `behavior: 'instant'` para garantir posicionamento imediato.

Também adicionar scroll no container pai (`overflow-y-auto`).

### Etapa 3: Melhorar Instruções de Linguagem Acessível

Adicionar exemplos mais concretos no prompt:

```
## LINGUAGEM ACESSÍVEL - EXEMPLOS PRÁTICOS DE ESCRITA

ERRADO: "A culpabilidade exige imputabilidade, potencial consciência..."
CERTO: "Para alguém ser culpado de um crime, precisa primeiro de 3 coisas:
       1. Ser 'imputável' (ou seja, ter capacidade de entender o que fez - 
          por exemplo, um adulto saudável é imputável, mas um bebê não é)
       2. Ter 'potencial consciência da ilicitude' (saber que aquilo é errado)
       3. ..."

REGRA DE OURO: Cada termo técnico = explicação IMEDIATA entre parênteses ou na frase seguinte
```

---

## Arquivos a Modificar

1. **supabase/functions/gerar-conteudo-oab-trilhas/index.ts**
   - Linha 325-413: Reestruturar promptBase com novas regras
   - Linha 393: Remover "Sempre incluir exemplo prático em slides de texto"
   - Adicionar seção específica sobre distribuição de exemplos
   - Reforçar linguagem acessível com mais exemplos práticos

2. **src/components/conceitos/slides/ConceitoSlideCard.tsx**
   - Linha 119-122: Melhorar lógica de scroll to top
   - Usar `behavior: 'instant'` ao invés de `'smooth'`
   - Garantir scroll do container correto

---

## Detalhes Técnicos

### Novo Bloco de Regras para Exemplos (substituir linhas 391-394):

```typescript
## 📚 EXEMPLOS PRÁTICOS (REGRAS CRÍTICAS!):

1. NUNCA coloque mais de 1 exemplo prático por slide
2. Slides tipo "caso" JÁ SÃO o exemplo - não adicione outro dentro
3. Em slides tipo "texto", inclua exemplo em apenas 1 de cada 3-4 slides
4. O formato é: "> 📚 **EXEMPLO PRÁTICO:** João comprou..."
5. VARIE os exemplos: use nomes diferentes (Ana, Pedro, Maria, Carlos)
6. Faça exemplos do COTIDIANO: compra de celular, aluguel de apartamento, 
   acidente de carro, contrato de trabalho
```

### Novo Bloco de Linguagem (reforçar nas linhas 328-360):

```typescript
## 🎯 REGRA FUNDAMENTAL DE ESCRITA

Imagine que está explicando para seu IRMÃO MAIS NOVO de 16 anos.
Ele é inteligente, mas nunca estudou Direito.

ESTRUTURA OBRIGATÓRIA para cada conceito:
1. Primeiro explica COM SUAS PALAVRAS (simples)
2. Depois diz o TERMO TÉCNICO
3. Se tiver expressão em LATIM, traduz IMEDIATAMENTE

EXEMPLO DE COMO DEVE ESCREVER:

"Quando alguém comete um crime, a polícia pode prender essa pessoa 
imediatamente se pegar ela no ato - isso se chama 'prisão em flagrante' 
(do latim 'flagrante delicto', que significa 'enquanto o crime ainda 
está acontecendo'). Funciona como pegar alguém 'com a mão na massa'."

O QUE NUNCA FAZER:
"A prisão em flagrante, prevista no art. 302 do CPP, ocorre quando..."
(Isso é técnico demais para quem está começando!)
```

### Scroll to Top Melhorado:

```typescript
// Scroll to top when page changes - INSTANT para garantir posição
useEffect(() => {
  // Scroll imediato (não suave) para garantir que comece do topo
  window.scrollTo({ top: 0, behavior: 'instant' });
  
  // Também scrollar o container interno se existir
  if (containerRef.current) {
    containerRef.current.scrollTop = 0;
  }
  
  // E o container pai de overflow
  const scrollContainer = document.querySelector('.overflow-y-auto');
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
  }
}, [paginaIndex]);
```

---

## Resultado Esperado

Após as mudanças:

1. Slides de texto terão exemplos práticos de forma **esparsa e inteligente**, não em todos
2. Slides do tipo "caso" não terão exemplo duplicado dentro do conteúdo
3. A linguagem será mais **acessível e didática**, com explicações imediatas de termos
4. Ao passar de slide, a página sempre começará do **topo**
5. O conteúdo seguirá o padrão "simples primeiro, técnico depois"
