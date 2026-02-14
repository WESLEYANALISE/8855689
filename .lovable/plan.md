

# Corrigir Tela Cinza e Melhorar Trilha de Conceitos

## Problema 1: Tela cinza ao voltar
O botao "Voltar" na pagina de materia (`ConceitosMateria.tsx`) navega para `/?tab=iniciante`, que nao e uma aba valida. As abas validas sao: `jornada`, `estudos`, `leis`, `explorar`. Isso causa a tela cinza/vazia que aparece na segunda screenshot.

**Correcao:** Trocar `/?tab=iniciante` por `/?tab=jornada` no botao Voltar de `ConceitosMateria.tsx`.

---

## Problema 2: Legenda de cores na barra de progresso
A pagina OAB Trilhas Topicos possui uma legenda de cores abaixo da barra de progresso geral (Leitura em laranja, Flashcards em roxo, Praticar em verde). A pagina de Conceitos nao tem essa legenda.

**Correcao:** Adicionar a mesma legenda de cores abaixo da barra de progresso geral no header de `ConceitosMateria.tsx`, identica a da OAB.

---

## Problema 3: Tres botoes ao clicar em uma aula (Ler, Flashcards, Questoes)
Atualmente, ao clicar em um topico da lista, o usuario e levado diretamente para a pagina de estudo. O usuario quer que, ao clicar, apareca uma expansao inline (ou drawer) com tres botoes de acao: **Ler**, **Flashcards** e **Questoes**, igual ao comportamento das trilhas diarias.

**Implementacao:** Ao clicar em um topico na lista, em vez de navegar diretamente, expandir o card selecionado mostrando tres botoes de acao:
- **Ler** - navega para `/conceitos/topico/:id` (modo leitura)
- **Flashcards** - navega para `/conceitos/topico/:id/flashcards`
- **Questoes** - navega para `/conceitos/topico/:id/questoes`

Cada botao tera um icone e a porcentagem de progresso correspondente. O card expandido tera animacao suave de abertura.

---

## Detalhes Tecnicos

### Arquivo: `src/pages/ConceitosMateria.tsx`

1. **Linha 184** - Trocar `'/?tab=iniciante'` por `'/?tab=jornada'`

2. **Apos linha 254** (depois da barra Progress do header) - Adicionar legenda de cores:
   ```
   Leitura (laranja) | Flashcards (roxo) | Praticar (verde)
   ```

3. **Novo estado** - Adicionar `const [topicoExpandido, setTopicoExpandido] = useState<number | null>(null)` para controlar qual topico esta expandido

4. **Lista de topicos (linhas 291-407)** - Modificar o `onClick` do `motion.button` para alternar a expansao do card em vez de navegar diretamente. Abaixo do conteudo existente do card, adicionar uma secao animada (AnimatePresence) com tres botoes:
   - Botao "Ler" com icone BookOpen e progresso de leitura
   - Botao "Flashcards" com icone Layers e progresso de flashcards  
   - Botao "Questoes" com icone Target e progresso de questoes

   Cada botao navega para a rota correspondente ao ser clicado.

