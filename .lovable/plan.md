

# Corrigir PDFViewerModal para funcionar como a versao do GitHub

## Problema identificado

Ao comparar o codigo do GitHub (que funciona) com o codigo atual, encontrei as seguintes diferencas no iframe:

1. **`scrolling="no"`** -- Este atributo esta BLOQUEANDO o scroll dentro do iframe. Isso quebra completamente o modo vertical (scroll continuo) e tambem impede navegacao no modo paginas.
2. **`seamless`** -- Atributo obsoleto que pode causar comportamentos inesperados em diferentes navegadores.
3. **`frameBorder="0"`, `allow`, `allowFullScreen`, `allowTransparency`** -- Atributos extras que nao existem na versao funcional e podem interferir.

## Solucao

Reverter o iframe para ficar identico ao da versao do GitHub que funciona:

### Arquivo: `src/components/PDFViewerModal.tsx`

**Remover** todos os atributos extras do iframe e deixar apenas o basico:

```tsx
// DE (atual - quebrado):
<iframe
  ref={iframeRef}
  src={processedUrl}
  className="w-full h-full"
  title={title}
  seamless
  scrolling="no"
  frameBorder="0"
  allow="autoplay; encrypted-media"
  allowFullScreen
  allowTransparency
  style={{ touchAction: 'pan-y pinch-zoom', border: 'none' }}
/>

// PARA (igual GitHub - funciona):
<iframe
  ref={iframeRef}
  src={processedUrl}
  className="w-full h-full"
  title={title}
  style={{ touchAction: 'pan-y pinch-zoom' }}
/>
```

### Tambem no `driveUtils.ts`

A versao do GitHub NAO tem a funcao `getProxyUrl`. O `processDriveUrl` ja retorna URLs nao-Drive como estao (sem proxy). O codigo atual ja faz isso corretamente, entao nenhuma mudanca necessaria aqui.

## Resumo

A unica mudanca necessaria e remover os atributos extras do iframe que foram adicionados nas tentativas anteriores de correcao. O iframe simples (como no GitHub) e o que funciona.
