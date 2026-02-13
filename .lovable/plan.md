
# Redesign do Hero Mobile com Saudacao Personalizada e Botao Evelyn

## Resumo
Redesenhar a secao hero da home mobile para incluir uma saudacao personalizada grande ("Bom dia, Wesley") sobre a imagem de fundo, posicionar o botao da Evelyn na divisa entre a imagem e o conteudo cinza, e manter as bordas arredondadas no conteudo.

## Mudancas Visuais

### 1. Saudacao personalizada no hero
- Texto grande e bold sobre a imagem hero, posicionado na parte inferior da imagem (acima dos tabs)
- Logica de horario:
  - 5h-11h59: "Bom dia"
  - 12h-17h59: "Boa tarde"  
  - 18h-4h59: "Boa noite"
- Buscar o primeiro nome do usuario da tabela `profiles` (campo `nome`)
- Formato: "Bom dia," (linha 1) + "Wesley" (linha 2, maior)
- Se nao estiver logado ou sem nome, nao exibe a saudacao

### 2. Botao da Evelyn na divisa imagem/conteudo
- Botao circular (similar ao que ja existe no BottomNav) posicionado no centro horizontal, na fronteira entre a imagem hero e a area de conteudo cinza
- Metade sobre a imagem, metade sobre o conteudo
- Ao clicar, navega para `/chat-professora` (mesmo comportamento do BottomNav)
- Icone: `GraduationCap` com gradiente primario, igual ao botao central do BottomNav

### 3. Bordas arredondadas na area de conteudo
- Ja existe `rounded-b-[32px]` na imagem; a area de conteudo cinza tera `rounded-t-[32px]` para criar o efeito de sobreposicao

## Detalhes Tecnicos

### Arquivo: `src/pages/Index.tsx`

**Novo estado e efeito para buscar nome:**
- Adicionar estado `userName` e `useEffect` que consulta `profiles.nome` do usuario logado
- Extrair apenas o primeiro nome: `nome.split(' ')[0]`

**Funcao de saudacao:**
- Criar funcao `getGreeting()` que retorna "Bom dia", "Boa tarde" ou "Boa noite" baseado em `new Date().getHours()`

**Alteracoes no hero mobile (linhas 252-265):**
- Adicionar texto de saudacao sobre a imagem, na parte inferior, com `text-3xl`/`text-4xl font-bold text-white` e sombra de texto
- Aumentar levemente a altura do hero para acomodar o texto

**Botao Evelyn na divisa:**
- Posicionar um botao circular absoluto no centro, na transicao entre hero e conteudo
- `z-index` alto para ficar acima de ambas as secoes
- Estilo identico ao botao central do BottomNav (gradiente primario, sombra, `GraduationCap`)

**Area de conteudo:**
- Adicionar `rounded-t-[32px]` no container de conteudo mobile para criar o efeito visual de sobreposicao com cantos arredondados

### Estrutura resultante (mobile):
```text
+---------------------------+
|                           |
|     [imagem hero]         |
|                           |
|   Bom dia,                |
|   Wesley                  |
|  [Estudos] [Leis] [Dest.] |
+------rounded-b-[32px]----+
          (O) <-- botao Evelyn na divisa
+------rounded-t-[32px]----+
|                           |
|   [Aulas]  [Biblioteca]  |
|   [Busca...]              |
|   ...conteudo...          |
+---------------------------+
```
