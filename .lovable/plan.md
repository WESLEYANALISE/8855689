

## Plano: Transicoes fluidas entre abas da Home

### Objetivo
Adicionar animacoes suaves e engajantes ao alternar entre as abas (Jornada, Estudos, Leis, Explorar), cobrindo:
- Troca da imagem hero (crossfade)
- Troca do titulo/saudacao (fade + slide)
- Troca do conteudo principal (fade-in)

### Mudancas

**1. Crossfade na imagem hero (`src/pages/Index.tsx`, linhas 270-305)**

Substituir a tag `<img>` unica por duas imagens sobrepostas com transicao CSS de opacidade. Uma mostra a imagem atual, outra faz o fade-in da nova imagem.

- Guardar a imagem anterior em um `useRef` (ou `useState`)
- Quando `heroImage` mudar, a nova imagem entra com `opacity: 0 -> 1` (400ms ease) enquanto a anterior sai com `opacity: 1 -> 0`
- Usar `transition-opacity duration-500 ease-in-out` nas duas imagens empilhadas com `absolute inset-0`

**2. Animacao no titulo/saudacao (linhas 286-303)**

Aplicar uma animacao CSS de fade + translate sutil no bloco de texto ao trocar de aba:

- Usar uma `key={mainTab}` no container do titulo para forcar remontagem
- Adicionar classe `animate-fade-in` (ja existe no projeto) para o efeito de entrada
- O texto fara um fade-in suave (300ms) a cada troca

**3. Animacao no conteudo principal (linhas 325-420)**

Adicionar transicao de entrada no conteudo de cada aba:

- Usar `key={mainTab}` no container principal do conteudo mobile
- Aplicar `animate-fade-in` para entrada suave do conteudo
- Isso cria uma sensacao de fluidez ao navegar entre abas

**4. Animacao nos botoes de tab (linhas 213-246)**

Adicionar `transition-all duration-300` nos botoes (ja tem `transition-all`) para garantir que a troca do estado ativo/inativo seja suave.

### Detalhes tecnicos

```text
Imagem Hero (crossfade):
  - Novo state: prevHeroImage (useRef)
  - Duas <img> empilhadas com position absolute
  - Imagem anterior: opacity 1 -> 0 (500ms)
  - Imagem nova: opacity 0 -> 1 (500ms)
  - onTransitionEnd limpa a imagem anterior

Titulo (fade-in):
  - key={mainTab} no container de texto
  - className="animate-fade-in"

Conteudo (fade-in):
  - key={mainTab} no container de conteudo
  - className="animate-fade-in"
```

### Resultado esperado
Ao trocar de aba, a imagem de fundo faz um crossfade elegante, o titulo desliza suavemente e o conteudo aparece com fade, criando uma experiencia visual premium e fluida.
