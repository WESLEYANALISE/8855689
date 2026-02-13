

# Mover Navegacao da Biblioteca para o Topo

## O que muda

Atualmente a Biblioteca Juridica tem um menu de rodape (bottom nav) com 5 abas: Acervo, Plano, Procurar, Historico e Favoritos. O usuario quer:

1. **Remover o menu de rodape** da Biblioteca
2. **Criar um menu de abas no topo**, logo abaixo do header, com as mesmas 5 opcoes
3. **Adicionar barra de pesquisa** acima do grid de capas (integrada na aba Acervo)
4. A busca por livros ficara embutida na propria pagina, sem precisar ir para uma pagina separada

## Nova Estrutura Visual

```text
+----------------------------------+
| <- Biblioteca Juridica           |
+----------------------------------+
| Acervo | Plano | Historico | Fav |
+----------------------------------+
| [🔍 Buscar livro...]             |
+----------------------------------+
| +----------+ +----------+       |
| |  [CAPA]  | |  [CAPA]  |       |
| | Estudos  | | Classicos|       |
| +----------+ +----------+       |
| +----------+ +----------+       |
| |  [CAPA]  | |  [CAPA]  |       |
| | OAB      | | Oratoria |       |
| +----------+ +----------+       |
+----------------------------------+
```

## Detalhes Tecnicos

### Arquivos a modificar:

1. **`src/pages/Bibliotecas.tsx`**
   - Remover `BibliotecaBottomNav` do rodape
   - Adicionar componente de abas horizontais (estilo pill/segmented) no topo, logo apos o header
   - As abas navegam para as mesmas rotas: `/bibliotecas`, `/biblioteca/plano-leitura`, `/biblioteca/historico`, `/biblioteca/favoritos`
   - Remover o botao central "Procurar" como aba separada - a busca sera uma barra de input diretamente na pagina do Acervo
   - Adicionar `Input` de pesquisa acima do grid que filtra as 8 bibliotecas por nome
   - Ajustar padding inferior (remover `pb-24` pois nao ha mais bottom nav)

2. **`src/components/biblioteca/BibliotecaTopNav.tsx`** (novo componente)
   - Menu horizontal com 4 abas: Acervo, Plano, Historico, Favoritos
   - Estilo: fundo escuro semi-transparente, aba ativa com destaque amber, sticky abaixo do header
   - Icones menores ao lado dos rotulos
   - Scroll horizontal em telas muito pequenas (improvavel com 4 abas, mas seguro)

3. **`src/pages/BibliotecaPlanoLeitura.tsx`** - Substituir `BibliotecaBottomNav` por `BibliotecaTopNav`
4. **`src/pages/BibliotecaHistorico.tsx`** - Substituir `BibliotecaBottomNav` por `BibliotecaTopNav`
5. **`src/pages/BibliotecaFavoritos.tsx`** - Substituir `BibliotecaBottomNav` por `BibliotecaTopNav`
6. **`src/pages/BibliotecaBusca.tsx`** - Substituir `BibliotecaBottomNav` por `BibliotecaTopNav` (manter pagina de busca avancada acessivel)
7. **`src/pages/BibliotecaIniciante.tsx`** - Substituir `BibliotecaBottomNav` por `BibliotecaTopNav`

### Design do menu superior:
- Posicao: sticky, logo abaixo do StandardPageHeader
- Tema amber/dourado consistente com o visual atual
- Aba ativa: texto amber-400 com underline ou fundo amber-500/15
- Abas inativas: texto muted-foreground
- Compacto: altura de ~44px para nao ocupar muito espaco vertical

