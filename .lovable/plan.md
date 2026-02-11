

# Corrigir visualização de livros FlipHTML5 no app

## Problema identificado

O livro "Origens e definições do direito administrativo" (id 981) usa uma URL do **FlipHTML5** (`https://online.fliphtml5.com/zmzll/fcvw/`). O FlipHTML5 bloqueia embedding em iframes de outros domínios usando o header `X-Frame-Options: SAMEORIGIN`. Por isso aparece a mensagem "Este conteudo esta bloqueado".

Se antes funcionava, provavelmente era porque o app rodava como app nativo via Capacitor (WebView nativa), que nao respeita essa restricao da mesma forma que o navegador web.

## Solucao

Detectar URLs que nao sao do Google Drive (como FlipHTML5) e abrir usando o **Capacitor Browser** (WebView nativa no app mobile) ou em nova aba (na versao web). Isso ja existe no projeto com o hook `useExternalBrowser`.

## Mudancas

### 1. `src/components/PDFViewerModal.tsx`
- Importar `isGoogleDriveUrl` de `driveUtils` e o hook `useExternalBrowser`
- Quando a URL nao for do Google Drive, ao abrir o modal, usar `openUrl()` do Capacitor Browser (que abre na WebView nativa no mobile, ou em nova aba no web) e fechar o modal
- URLs do Google Drive continuam abrindo normalmente no iframe como sempre

### 2. Logica de deteccao

```text
URL do livro
   |
   v
E Google Drive? --Sim--> Abre no iframe (comportamento atual)
   |
  Nao (FlipHTML5 etc)
   |
   v
E app nativo? --Sim--> Capacitor Browser.open() (WebView nativa)
   |
  Nao (web)
   |
   v
window.open() em nova aba
```

## Detalhes tecnicos

No `PDFViewerModal.tsx`, adicionar um `useEffect` que detecta quando o modal abre com uma URL externa (nao-Drive):

```typescript
import { isGoogleDriveUrl } from "@/lib/driveUtils";
import { useExternalBrowser } from "@/hooks/use-external-browser";

// Dentro do componente:
const { openUrl } = useExternalBrowser();
const isExternalUrl = !isGoogleDriveUrl(urlToUse);

useEffect(() => {
  if (isOpen && isExternalUrl) {
    openUrl(urlToUse); // Capacitor Browser no mobile, nova aba no web
    onClose();
  }
}, [isOpen, isExternalUrl, urlToUse]);

if (isExternalUrl && isOpen) return null;
```

Isso garante que:
- No **app nativo** (Capacitor): abre na WebView do sistema (Safari/Chrome in-app), que funciona com FlipHTML5
- Na **versao web**: abre em nova aba do navegador
- **Google Drive**: continua no iframe dentro do modal como sempre
