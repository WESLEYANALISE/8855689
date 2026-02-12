
# Corrigir Cards de Categorias e Menu de Rodape

## Problema 1: Cards de Categorias com tamanho diferente
Os cards das Categorias ja usam a mesma estrutura de codigo dos cards de Conceitos (`min-h-[180px]`, `h-16` de capa). Porem, o componente `MobileCategoriasDireito` esta sendo renderizado **dentro** do `MobileTrilhasAprender`, que ja possui seu proprio padding e container. Isso pode causar compressao dos cards. Vou garantir que o container e identico.

Alem disso, vou revisar se ha alguma diferenca sutil nos estilos (tamanho de fonte do titulo, espacamento, etc.) para garantir paridade visual total.

**Arquivo**: `src/components/mobile/MobileCategoriasDireito.tsx`
- Remover o wrapper externo `py-4 flex flex-col items-center` que duplica o padding do pai
- Garantir que as classes dos cards sejam identicas as de Conceitos

## Problema 2: Menu de Rodape (CategoriasBottomNav) na Home
Atualmente o `CategoriasBottomNav` so aparece nas paginas internas (`/categorias/:categoria`, `/categorias/progresso`, etc.). O usuario quer que ele apareca ja na home quando a aba "Categorias" estiver selecionada.

**Arquivo**: `src/components/mobile/MobileTrilhasAprender.tsx`
- Importar e renderizar `CategoriasBottomNav` quando `activeTab === 'categorias'`
- Adicionar padding-bottom para evitar que o conteudo fique por tras do menu fixo

**Arquivo**: `src/components/categorias/CategoriasBottomNav.tsx`
- Atualizar a rota de "Aulas" para navegar de volta a home com a aba Categorias ativa (em vez de `/categorias` que nao existe como rota separada)

## Detalhes Tecnicos

### MobileTrilhasAprender.tsx
- Adicionar import do `CategoriasBottomNav`
- Renderizar `<CategoriasBottomNav activeTab="aulas" />` dentro do bloco `activeTab === 'categorias'`
- Envolver o conteudo de categorias em um div com `pb-24` para dar espaco ao rodape fixo

### MobileCategoriasDireito.tsx
- Ajustar o wrapper para nao duplicar padding/centralizacao que o pai ja fornece
- Confirmar que `pr-[52%]` / `pl-[52%]` e identico ao Conceitos (ja esta)
