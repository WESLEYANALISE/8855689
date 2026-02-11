
# Reverter redirecionamento externo - Abrir FlipHTML5 dentro do app

## Problema
A correção anterior classificou URLs do FlipHTML5 como "externas" e passou a abrir em nova aba, mas o FlipHTML5 foi projetado para funcionar em iframes. O usuário quer que todos os livros abram dentro do modal do app.

## Solução
Remover a lógica de detecção de URL externa do `PDFViewerModal.tsx` que redireciona para o navegador. Deixar todas as URLs (Google Drive e FlipHTML5) serem renderizadas normalmente no iframe do modal.

## Arquivo a editar

**`src/components/PDFViewerModal.tsx`**
- Remover import de `isGoogleDriveUrl` (não é mais necessário aqui)
- Remover imports não usados: `Loader2`, `ExternalLink`
- Remover estados `iframeLoading` e `iframeError`
- Remover variável `isExternalUrl`
- Remover o `useEffect` que faz `window.open` para URLs externas (linhas 50-55)
- Remover o `if (isExternalUrl) return null` (linha 286)

Resultado: tanto Google Drive quanto FlipHTML5 abrem normalmente no iframe dentro do modal do app.
