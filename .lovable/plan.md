

# Criar Proxy para FlipHTML5 funcionar no iframe (Web + Mobile)

## Problema

O FlipHTML5 envia o header `X-Frame-Options: SAMEORIGIN`, que impede navegadores web de exibir o conteudo em iframes de outros dominios. Isso nao e um bug do app -- e uma restricao do servidor do FlipHTML5.

## Solucao

Criar uma Edge Function que funciona como proxy: ela busca a pagina do FlipHTML5 no servidor, remove o header de bloqueio, e retorna o conteudo para o iframe do app. Assim o iframe carrega normalmente em qualquer ambiente.

## Mudancas

### 1. Nova Edge Function: `supabase/functions/proxy-reader/index.ts`
- Recebe a URL do livro como parametro
- Faz fetch da pagina no servidor
- Remove o header `X-Frame-Options` da resposta
- Retorna o conteudo HTML para o iframe
- Inclui headers CORS para funcionar no preview e producao

### 2. Atualizar `src/lib/driveUtils.ts`
- Adicionar funcao `proxyExternalUrl(url)` que gera a URL do proxy para links que nao sao do Google Drive
- Exemplo: `https://supabase-url/functions/v1/proxy-reader?url=https://online.fliphtml5.com/zmzll/fcvw/`

### 3. Atualizar `src/components/PDFViewerModal.tsx`
- Para URLs que nao sao do Google Drive, usar a URL do proxy em vez da URL direta
- URLs do Google Drive continuam funcionando como sempre (sem proxy)

## Fluxo

```text
Usuario clica no livro FlipHTML5
        |
        v
PDFViewerModal detecta que nao e Google Drive
        |
        v
Gera URL do proxy: /functions/v1/proxy-reader?url=...
        |
        v
Edge Function busca o conteudo do FlipHTML5
        |
        v
Remove X-Frame-Options e retorna o HTML
        |
        v
iframe exibe o conteudo normalmente
```

## Detalhes tecnicos

### Edge Function (proxy-reader)
```typescript
// Recebe ?url=https://online.fliphtml5.com/...
// Faz fetch da URL
// Remove X-Frame-Options da resposta
// Retorna com headers CORS
```

### driveUtils.ts
```typescript
export const getProxyUrl = (url: string): string => {
  const supabaseUrl = "..."; // URL do Supabase
  return `${supabaseUrl}/functions/v1/proxy-reader?url=${encodeURIComponent(url)}`;
};
```

### PDFViewerModal.tsx
```typescript
const processedUrl = isGoogleDriveUrl(urlToUse) 
  ? processDriveUrl(urlToUse, viewMode)
  : getProxyUrl(urlToUse);
```

## Observacao importante

O proxy funciona bem para a pagina HTML inicial do FlipHTML5, mas o FlipHTML5 carrega muitos recursos adicionais (JavaScript, CSS, imagens) de seus proprios servidores. Esses recursos continuarao carregando diretamente do FlipHTML5 (o que normalmente funciona, pois a restricao X-Frame-Options se aplica apenas ao documento principal no iframe, nao aos sub-recursos).

