

# Sistema de Niveis estilo Duolingo para Areas

## Conceito

Dividir as materias de cada area em **10 niveis** (ou menos, se houver poucas materias). Cada nivel tera:
- Um **banner/header** colorido (ex: "Nivel 1", "Nivel 2") com cor distinta
- As materias daquele nivel em layout serpentina abaixo do banner
- Uma **linha separadora** entre niveis com cor temática
- A materia atual permanece maior que as outras

## Distribuicao

Se uma area tem 20 materias e 10 niveis, cada nivel tera 2 materias. Se tem 15 materias, os primeiros niveis terao 2 e os ultimos 1. A logica e: `Math.ceil(totalMaterias / 10)` materias por nivel.

## Visual por Nivel

Cada nivel tera uma cor propria seguindo uma progressao:

| Nivel | Cor do Banner | Tema |
|-------|--------------|------|
| 1 | Verde | Iniciante |
| 2 | Verde-agua | Basico |
| 3 | Azul | Fundamentos |
| 4 | Azul-indigo | Intermediario |
| 5 | Roxo | Avancando |
| 6 | Rosa | Aprofundando |
| 7 | Vermelho | Avancado |
| 8 | Laranja | Expert |
| 9 | Amber | Especialista |
| 10 | Dourado | Mestre |

## Layout

```text
  [====== Nivel 1 ======]  (banner verde arredondado)
       (o)               materia 1 (grande se atual)
      /
    (o)                  materia 2
      \
  [====== Nivel 2 ======]  (banner azul)
       (o)
      /
    (o)
```

- O banner de nivel e um retangulo arredondado centralizado com o texto "Nivel X"
- As materias continuam em serpentina dentro de cada nivel
- A linha conectora muda de cor conforme o nivel
- Barra de progresso geral aparece no topo (progresso linear, como no print)

## Detalhes Tecnicos

### Arquivo a modificar
- `src/pages/AreaTrilhaPage.tsx` - refatorar o componente `SerpentineMaterias`

### Logica de agrupamento
```text
const TOTAL_NIVEIS = 10;
const materiasPorNivel = Math.ceil(livros.length / TOTAL_NIVEIS);

// Agrupar materias em niveis
const niveis = [];
for (let i = 0; i < TOTAL_NIVEIS; i++) {
  const start = i * materiasPorNivel;
  const end = Math.min(start + materiasPorNivel, livros.length);
  if (start < livros.length) {
    niveis.push({ nivel: i + 1, materias: livros.slice(start, end) });
  }
}
```

### Componente NivelBanner
Um componente inline que renderiza o banner colorido entre grupos de materias, com:
- Fundo com gradiente da cor do nivel
- Texto "Nivel X" centralizado em branco
- Icone de cadeado se o nivel estiver bloqueado (todos os anteriores nao completos)

### Serpentina por nivel
Cada nivel reinicia a serpentina com posicoes X do zero, mas o indice global e mantido para o efeito visual. A linha SVG conectora usa a cor do nivel correspondente.

### Barra de progresso no topo
Uma barra de progresso linear (fina, verde) abaixo do header mostrando progresso geral da area (0% por enquanto, placeholder).

