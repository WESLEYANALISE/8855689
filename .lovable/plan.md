

## Plano de Ajustes - Parallax, Fonte e Busca

### 1. Efeito Parallax na imagem de fundo do Hero

**Problema**: A imagem de fundo do hero e fixa e estatica. O usuario quer que, ao rolar a tela, a imagem se mova junto, criando um efeito de profundidade.

**Solucao**: Adicionar um listener de scroll no componente da pagina inicial que aplica um `transform: translateY(...)` na imagem de fundo proporcional ao scroll, criando um efeito parallax suave. A imagem vai se mover mais devagar que o conteudo, dando sensacao de profundidade.

- Usar `useEffect` + `addEventListener('scroll')` com `requestAnimationFrame` para performance
- Aplicar `transform: translateY(scrollY * 0.3)` na imagem (ela se move a 30% da velocidade do scroll)
- Manter o `will-change: transform` para aceleracao por GPU

---

### 2. Trocar a fonte da saudacao ("Boa noite, Wesley")

**Problema**: A saudacao usa a fonte padrao (Inter/sans-serif) em negrito. O usuario quer uma fonte mais elegante e agradavel.

**Solucao**: Aplicar a fonte `Playfair Display` (ja disponivel no projeto como `font-playfair`) na saudacao, que e uma fonte serifada elegante e combina com o tema juridico. Tambem ajustar o peso e tamanho para melhor legibilidade.

- Saudacao ("Boa noite,"): `font-playfair text-2xl font-semibold`
- Nome do usuario: `font-playfair text-4xl font-bold`

---

### 3. Corrigir o icone de busca que nao funciona

**Problema**: O botao de busca no canto superior direito do hero nao responde ao toque. Isso acontece porque o container pai do hero tem `pointer-events-none` (linha 240) e o z-index do hero (1) e menor que o z-index do conteudo principal (2), fazendo com que o conteudo cubra o botao em certas areas.

**Solucao**: Aumentar o z-index do botao de busca para ficar acima de todos os elementos. Extrair o botao de busca para fora do container `pointer-events-none`, posicionando-o como um elemento `fixed` independente com z-index mais alto que o conteudo.

---

### Detalhes Tecnicos

**Arquivo a modificar**: `src/pages/Index.tsx`

| Alteracao | Detalhes |
|---|---|
| Parallax | Adicionar `useState` para `scrollY`, `useEffect` com scroll listener + rAF, aplicar `transform` dinamico na `img` |
| Fonte | Trocar classes da saudacao para `font-playfair` |
| Botao busca | Mover o botao de busca para fora do container hero fixo, como elemento `fixed` independente com `zIndex: 10` |

