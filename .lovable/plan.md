
# Plano: Correção do Scroll e Destaque de Artigos no Vade Mecum

## Problemas Identificados

### 1. Scroll não funciona ao clicar em resultado de busca
Quando o usuário busca "67" no Vade Mecum e clica no resultado "Constituição Federal", a página `/constituicao?artigo=67` abre, mas:
- Não é possível rolar a página manualmente
- O artigo 67 não é exibido em destaque na posição correta

### 2. Causa Raiz

O componente `ArtigoListaCompacta.tsx` tem uma **condição de corrida** no mecanismo de scroll:

```typescript
// Linha 712-745: useEffect para scroll
useEffect(() => {
  if (!targetArticleNumber) return;
  
  // Problema: busca em articlesWithNumber mas os refs podem não existir ainda
  const targetArticle = articlesWithNumber.find(...);
  
  setTimeout(() => {
    const element = articleRefs.current.get(targetArticle.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100); // Timeout muito curto!
}, [targetArticleNumber, articlesWithNumber, onScrollComplete]);
```

**Problemas específicos:**

1. **Timeout insuficiente (100ms)**: Os artigos são carregados via `useProgressiveArticles` em chunks progressivos. 100ms pode não ser suficiente para React renderizar os elementos e criar as refs.

2. **Refs não sincronizadas**: Os `articleRefs` são populados apenas quando o elemento é renderizado (`ref={(el) => articleRefs.current.set(article.id, el)}`), mas o useEffect pode executar antes da renderização.

3. **Sub-modo de visualização**: A lista de artigos só é renderizada quando `subModoConteudo === 'lista'`, mas não há verificação disso no useEffect.

4. **Scroll interrompido por animações**: O componente tem um sticky header que pode interferir com o cálculo de posição do scroll.

---

## Solução Proposta

### 1. Aumentar timeout e adicionar retry com verificação de elemento

```typescript
// Scroll para artigo específico com retry robusto
useEffect(() => {
  if (!targetArticleNumber) return;

  const normalizeNumber = (num: string) => num.replace(/\D/g, '').replace(/^0+/, '');
  const targetNormalized = normalizeNumber(targetArticleNumber);
  
  const targetArticle = articlesWithNumber.find(article => {
    const articleNum = normalizeNumber(article["Número do Artigo"] || "");
    return articleNum === targetNormalized || 
           (article["Número do Artigo"] || "").toLowerCase().includes(targetArticleNumber.toLowerCase());
  });

  if (!targetArticle) {
    onScrollComplete?.();
    return;
  }

  // Destacar artigo imediatamente
  setHighlightedArticleId(targetArticle.id);
  
  // Forçar modo de visualização correto
  setSubModoConteudo('lista');

  // Função de scroll com retry
  const scrollToArticle = (retries = 0) => {
    const element = articleRefs.current.get(targetArticle.id);
    
    if (element) {
      // Usar requestAnimationFrame para garantir que o DOM está pronto
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        onScrollComplete?.();
      });
    } else if (retries < 10) {
      // Retry com delay progressivo (até ~2 segundos total)
      setTimeout(() => scrollToArticle(retries + 1), 200);
    } else {
      // Fallback: completar mesmo sem scroll
      console.warn('Não foi possível scrollar para artigo:', targetArticleNumber);
      onScrollComplete?.();
    }
  };

  // Iniciar após pequeno delay para garantir renderização inicial
  setTimeout(() => scrollToArticle(0), 300);

  // Limpar destaque após 4 segundos
  const highlightTimer = setTimeout(() => {
    setHighlightedArticleId(null);
  }, 4000);

  return () => clearTimeout(highlightTimer);
}, [targetArticleNumber, articlesWithNumber, onScrollComplete]);
```

### 2. Garantir que refs existem antes de tentar scroll

Adicionar verificação de que o componente está montado e os refs estão populados:

```typescript
// Adicionar estado para controlar quando refs estão prontos
const [refsReady, setRefsReady] = useState(false);

// Atualizar quando artigos são renderizados
useEffect(() => {
  if (articlesWithNumber.length > 0 && articleRefs.current.size > 0) {
    setRefsReady(true);
  }
}, [articlesWithNumber]);

// Incluir refsReady como dependência do scroll
useEffect(() => {
  if (!targetArticleNumber || !refsReady) return;
  // ... resto da lógica de scroll
}, [targetArticleNumber, articlesWithNumber, refsReady, onScrollComplete]);
```

### 3. Forçar sub-modo correto ao receber targetArticleNumber

Na Constituicao.tsx, garantir que o modo de visualização está correto:

```typescript
// Auto-search based on URL parameter
useEffect(() => {
  const artigoParam = searchParams.get('artigo');
  if (artigoParam) {
    setSearchInput(artigoParam);
    setTargetArticleNumber(artigoParam);
    setSearchQuery(artigoParam);
    setActiveTab('artigos'); // Garantir que está na tab correta
  }
}, [searchParams]);
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/ArtigoListaCompacta.tsx` | Refatorar useEffect de scroll com retry robusto e forçar subModo correto |
| `src/pages/Constituicao.tsx` | Garantir que activeTab é 'artigos' ao receber parâmetro de artigo |

---

## Mudanças Técnicas Detalhadas

### ArtigoListaCompacta.tsx

**Linha 712-745**: Substituir useEffect atual por versão robusta:

```text
Antes:
- setTimeout de 100ms (insuficiente)
- Não verifica se elemento realmente existe
- Não força modo de visualização correto

Depois:
- Retry com até 10 tentativas (delay progressivo)
- requestAnimationFrame para sincronizar com render
- Força subModoConteudo = 'lista' antes do scroll
- Fallback graceful se scroll não funcionar
```

### Constituicao.tsx

**Linha 75-82**: Adicionar setActiveTab:

```typescript
useEffect(() => {
  const artigoParam = searchParams.get('artigo');
  if (artigoParam) {
    setSearchInput(artigoParam);
    setTargetArticleNumber(artigoParam);
    setSearchQuery(artigoParam);
    setActiveTab('artigos'); // ADICIONAR ESTA LINHA
  }
}, [searchParams]);
```

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Busca "67" no VadeMecum → clica CF | Página abre mas não rola | Rola suavemente até Art. 67 |
| Artigo 67 visível | Não destacado | Destacado com borda amarela por 4s |
| Scroll manual | Bloqueado/travado | Funciona normalmente |
| Carregamento progressivo | Falha se artigo não carregou | Aguarda com retry até artigo carregar |
