

# Trilha Estilo Duolingo para Areas do Direito

## O que muda

O componente `MobileAreaTrilha.tsx` sera completamente redesenhado para exibir os temas em um **caminho serpentina** (estilo Duolingo/Woofz), com circulos grandes conectados por uma linha curva, ao inves do layout atual de timeline com cards alternados.

## Design Visual

O caminho tera:
- **Circulos grandes** (70-80px) para cada tema, com icone/emoji ou imagem de capa
- **Linha curva conectora** (SVG path) ligando os circulos em formato serpentina
- **Movimento em S**: os circulos se distribuem da esquerda para a direita e voltam, criando o efeito de caminho sinuoso
- **Titulo do tema** abaixo de cada circulo
- **Indicadores visuais**: borda colorida para temas disponiveis, check verde para completos, cadeado para bloqueados
- Fundo limpo, sem cards pesados

## Estrutura do Caminho

```text
        O
       / 
      O   O
         /
    O   O
   /
  O   O
       \
        O
```

Cada "nivel" do caminho tera 1-3 circulos posicionados com offsets horizontais calculados para criar o efeito serpentina.

## Detalhes Tecnicos

### Arquivo modificado
- `src/components/mobile/MobileAreaTrilha.tsx` - redesign completo

### Logica de posicionamento
- Cada tema recebe uma posicao X calculada usando seno ou um padrao pre-definido de offsets
- Padrao de offsets por linha: centro, direita, centro, esquerda, centro, direita...
- Espacamento vertical fixo entre circulos (~120px)
- Linha SVG curva conectando os centros dos circulos

### Elementos visuais
- Circulo principal: `w-20 h-20 rounded-full` com gradiente da area (usando as cores do AREAS_ORDEM)
- Imagem de capa dentro do circulo (se disponivel) ou numero do tema
- Nome do tema em texto branco abaixo
- Linha conectora SVG com `stroke-dasharray` animado
- Badge de progresso no canto do circulo (check ou numero)

### Animacoes
- Circulos aparecem sequencialmente com `framer-motion`
- Linha conectora desenha progressivamente
- Circulo atual pulsa suavemente

