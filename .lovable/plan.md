

## Corrigir Travamento do Carrossel e Adicionar Animacoes de Texto

### Problema Identificado

O carrossel de screenshots na pagina Welcome trava por tres razoes:

1. **Imagens carregadas com `loading="lazy"`**: As 8 imagens PNG (385KB a 618KB cada) nao estao prontas quando a animacao comeca, causando saltos visuais
2. **Sem aceleracao GPU**: A animacao CSS nao usa `will-change: transform` nem `translateZ(0)`, forcando o navegador a recalcular o layout a cada frame
3. **Framer Motion no hero**: As animacoes do texto acima competem com o carrossel pelo thread principal

### Solucao

**Arquivo: `src/pages/Welcome.tsx`**

1. **Carrossel fluido desde o inicio**:
   - Remover `loading="lazy"` das imagens (ja sao importadas estaticamente, estao no bundle)
   - Adicionar `will-change: transform` e `transform: translateZ(0)` no container do carrossel para forcar composicao GPU
   - Triplicar as imagens (ao inves de duplicar) para garantir loop mais suave sem gap visivel

2. **Animacoes de texto com CSS puro** (substituir framer-motion):
   - Trocar `motion.div` do hero por CSS keyframes (`animate-fade-in` ja existente no projeto)
   - Aplicar animacoes escalonadas (stagger) via `animation-delay` nos elementos de texto
   - Remover import do framer-motion nesta pagina para reduzir carga inicial

3. **Otimizacoes de performance**:
   - Adicionar `fetchPriority="high"` e `decoding="async"` nas imagens do carrossel
   - Usar `backface-visibility: hidden` para evitar repaint

### Detalhes Tecnicos

```text
ANTES:
- motion.div com opacity/y animations (JS thread)
- loading="lazy" nas imagens
- Sem GPU acceleration no carrossel
- Duplicacao simples (2x) das imagens

DEPOIS:
- CSS keyframes com animation-delay (GPU thread)
- Imagens eager com fetchPriority
- will-change: transform + translateZ(0)
- Triplicacao (3x) para loop seamless
```

As animacoes de entrada do texto usarao delays escalonados:
- "Direito Premium" → 0ms
- Titulo principal → 200ms
- Subtitulo → 400ms
- Botao → 600ms

Isso cria um efeito de cascata elegante sem depender do framer-motion.

