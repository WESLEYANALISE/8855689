
# Ajustes no Hero Mobile e Cards

## 1. Subir a saudacao para nao ficar atras dos tabs
- Mover o texto de saudacao de `bottom-16` para `bottom-20` ou mais, garantindo que fique acima do menu de alternancia

## 2. Remover barra de pesquisa e adicionar icone de busca no hero
- Remover o bloco `SearchBarAnimatedText` do conteudo mobile
- Adicionar um icone de busca (Search) no canto inferior direito da imagem hero, como um botao circular que navega para `/pesquisar`

## 3. Remover botao Evelyn da divisa hero/conteudo
- Remover completamente o bloco do botao `GraduationCap` que esta entre o hero e o conteudo (linhas 306-314), pois ja existe no BottomNav

## 4. Tabs com mesmo tamanho
- O `TabButton` ja usa `flex-1`, mas precisa garantir que todos os tres botoes tenham exatamente o mesmo tamanho visual. Verificar se o texto nao esta causando diferenca e ajustar com `min-w-0` e `truncate` se necessario

## 5. Cards de Aulas e Biblioteca com cor diferente do fundo
- Mudar o `bg-muted` dos cards para uma cor mais escura/distinta, como `bg-card` ou `bg-neutral-800` (dark mode) com borda mais visivel, para se destacarem do fundo cinza (`bg-muted`)

## Detalhes Tecnicos

### Arquivo: `src/pages/Index.tsx`

**Saudacao (linha 283):** Mudar `bottom-16` para `bottom-24` para subir acima dos tabs.

**Icone de busca no hero (dentro do bloco hero, linhas 270-289):** Adicionar botao circular com icone Search posicionado `absolute bottom-16 right-5` dentro da imagem hero, navegando para `/pesquisar`.

**Remover botao Evelyn (linhas 306-314):** Deletar todo o bloco do botao central na divisa.

**Remover barra de pesquisa (linhas 357-368):** Deletar o bloco da search bar animada e seu container.

**Cards Aulas/Biblioteca (linhas 321-351):** Trocar `bg-muted` por `bg-card` ou `bg-neutral-900/80` nos cards, adicionando contraste com o fundo.
