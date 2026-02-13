

# Reestruturar Biblioteca Juridica - Layout Grid "Estante"

## Por que mudar?

O layout atual de timeline alternada (esquerda/direita) tem problemas:
- Cards ocupam apenas ~45% da largura da tela, desperdicando espaco
- Exige muito scroll vertical para ver 8 bibliotecas
- O padrao alternado dificulta a leitura rapida
- A timeline (linha central + martelo) e decorativa mas nao agrega valor funcional

## Nova Estrutura Proposta

### Layout: Grid 2 colunas "Estante de Livros"

```text
+---------------------------+
|   Biblioteca Juridica     |
|   8 colecoes - 1236 obras |
+---------------------------+
| +----------+ +----------+ |
| |  [CAPA]  | |  [CAPA]  | |
| |  490     | |  28      | |
| | Estudos  | | Classicos| |
| +----------+ +----------+ |
| +----------+ +----------+ |
| |  [CAPA]  | |  [CAPA]  | |
| |  OAB     | | Oratoria | |
| +----------+ +----------+ |
| +----------+ +----------+ |
| |  [CAPA]  | |  [CAPA]  | |
| | Portugues| | Lideranca| |
| +----------+ +----------+ |
| +----------+ +----------+ |
| |  [CAPA]  | |  [CAPA]  | |
| |Fora Toga | | Pesquisa | |
| +----------+ +----------+ |
+---------------------------+
```

### Design de cada card:
- Aspect ratio **3:4** (formato livro) mantido
- Capa ocupa o card inteiro como background
- Badge de contagem no canto superior esquerdo (estilo atual)
- Gradiente escuro na parte inferior com titulo e botao "Acessar"
- Borda sutil com a cor tematica de cada biblioteca
- Hover: leve scale + brilho na borda

### Responsividade:
- **Mobile**: Grid 2 colunas com gap de 12px
- **Tablet (md)**: Grid 2 colunas com cards maiores
- **Desktop (lg)**: Grid 3-4 colunas, centralizado com max-width

## Vantagens:
- Capas 2x maiores e mais visiveis
- Todas as 8 bibliotecas visiveis com menos scroll
- Layout familiar (tipo Netflix, Kindle, Apple Books)
- Mais facil de escanear visualmente
- Melhor aproveitamento do espaco em todas as telas

## Detalhes Tecnicos

### Arquivo a modificar:
**`src/pages/Bibliotecas.tsx`**

- Remover o componente `BibliotecaCard` com logica de timeline (isLeft, linha central, martelo)
- Criar novo componente de card simplificado com grid layout
- Substituir a section de timeline por:
  ```
  grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3
  ```
- Manter: hero section, stats, imagem de fundo, BibliotecaBottomNav
- Manter: contagens do Supabase, animacoes fade-in
- Remover: linha central da timeline, marcador Gavel, logica de alternancia esquerda/direita

