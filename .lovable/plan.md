

# Correcao do WebView - CSP bloqueando iframes

## Problema raiz

O `index.html` tem uma Content-Security-Policy com `frame-src` restritivo:

```
frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com;
```

Isso bloqueia **todos** os iframes de FlipHTML5 (`online.fliphtml5.com`) e Google Drive (`drive.google.com`). Esse e o motivo pelo qual nem os PDFs do Drive nem as paginas do FlipHTML5 aparecem.

## Solucao

### 1. Atualizar CSP no `index.html` (linha 12)

Adicionar os dominios necessarios ao `frame-src`:

```
frame-src 'self' https://www.youtube.com https://youtube.com https://player.vimeo.com https://drive.google.com https://*.google.com https://online.fliphtml5.com https://*.fliphtml5.com;
```

### 2. Atualizar `capacitor.config.ts`

Adicionar configuracoes que melhoram compatibilidade do WebView nativo:

- `server.allowNavigation: ['*']` -- permite navegacao para qualquer dominio dentro do WebView
- `android.allowMixedContent: true` -- permite conteudo HTTP e HTTPS misturados
- Manter configuracoes existentes (SplashScreen, StatusBar)

### 3. Nenhuma mudanca no `PDFViewerModal.tsx`

O iframe simplificado (sem `scrolling="no"`, sem `seamless`) ja esta correto. O problema era exclusivamente o CSP bloqueando os dominios.

## Resumo

A unica mudanca critica e adicionar `drive.google.com` e `fliphtml5.com` ao `frame-src` do CSP no `index.html`. Sem isso, o navegador bloqueia silenciosamente o carregamento dos iframes.

## Detalhes tecnicos

### index.html - CSP atualizado (linha 12)

Alterar apenas a diretiva `frame-src` dentro do Content-Security-Policy existente para incluir:
- `https://drive.google.com` -- para PDFs do Google Drive
- `https://*.google.com` -- para preview do Google Drive
- `https://online.fliphtml5.com` -- para livros FlipHTML5
- `https://*.fliphtml5.com` -- para sub-recursos FlipHTML5

### capacitor.config.ts

Adicionar ao objeto `server`:
- `allowNavigation: ['*']`
- `cleartext: true`

Adicionar secao `android`:
- `allowMixedContent: true`

Adicionar secao `ios`:
- `limitsNavigationsToAppBoundDomains: false`

