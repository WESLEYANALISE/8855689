
# Plano: Corrigir Cache de Aulas Interativas e Botão "Começar Leitura"

## Problema Identificado

### 1. Aula sendo recriada quando já existe
A verificação de cache no React Query (`useQuery`) está correta, mas há uma condição de corrida:
- O `useEffect` que dispara `generateSlidesFromScratch` verifica `!cachedAula && !slidesData && !isGenerating`
- Porém, durante o tempo em que `isCheckingCache` é `true` e a query está pendente, pode haver um ciclo onde a geração é disparada antes do cache retornar

### 2. Botão "Começar Leitura" não clicável
O botão está vinculado a `handleStartSlides()`, que verifica se `slidesData?.secoes` existe. Quando a aula vem do cache:
- O `useEffect` que seta `setSlidesData(cachedAula)` depende de `cachedAula` mudar
- Mas se `slidesData` já tiver um valor (mesmo que incompleto), o efeito não roda novamente

## Solução Técnica

### Arquivo: `src/components/AulaArtigoSlidesViewer.tsx`

1. **Corrigir race condition na verificação de cache:**
   - Garantir que a geração NUNCA seja disparada enquanto `isCheckingCache === true`
   - Adicionar log detalhado para debug

2. **Usar `cachedAula` diretamente quando disponível:**
   - Em vez de depender de um `useEffect` para setar `slidesData`, usar diretamente nos handlers
   - O `handleStartSlides` deve verificar `cachedAula || slidesData`

3. **Refatorar estado para evitar duplicação:**
   - Usar um único estado derivado: se `cachedAula` existe, usar ele; senão usar `slidesData` gerado
   - Remover a dependência de múltiplos `useEffect`

4. **Corrigir a lógica do botão "Começar Leitura":**
   - O botão deve usar `currentSlidesData` (memoizado) que combina cache + gerado
   - Garantir que `etapaAtual` vá para `'intro'` imediatamente quando cache existe

## Mudanças Específicas

```text
1. Criar variável memoizada:
   const currentSlidesData = cachedAula || slidesData;

2. Corrigir useEffect de etapa inicial:
   - Se !isCheckingCache && cachedAula -> setEtapaAtual('intro')
   - Não depender mais de slidesData para isso

3. Corrigir condição de geração:
   if (isOpen && !isCheckingCache && !cachedAula && !slidesData && !isGenerating)
   -> Garantir que isCheckingCache seja verificado PRIMEIRO

4. Atualizar handleStartSlides:
   - Usar currentSlidesData em vez de slidesData
   - Adicionar fallback se secoes não existir

5. Atualizar renderização da tela de intro:
   - Usar currentSlidesData para exibir dados
   - Garantir botões responsivos
```

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/AulaArtigoSlidesViewer.tsx` | Refatorar lógica de cache e estado |

## Resultado Esperado

- Ao abrir aula que já existe, carregar instantaneamente do cache sem regenerar
- Botão "Começar Leitura" funcionar imediatamente quando cache carrega
- Toast "Aula carregada!" aparecer (não "Aula criada!")
- Nenhuma chamada à Edge Function se a aula já existir no banco
