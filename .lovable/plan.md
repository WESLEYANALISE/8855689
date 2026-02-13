

## Reorganizacao da Aba "Aulas"

### Mudancas Propostas

A reorganizacao move o titulo "Jornada de Estudos" para o topo da pagina, antes da secao "Seu Progresso", criando uma hierarquia visual mais clara:

```text
+----------------------------------+
|     JORNADA DE ESTUDOS           |
|     Fundamentos do Direito       |
+----------------------------------+
|                                  |
|  (play) Seu Progresso            |
|  +-----------------------------+ |
|  | Trilha de Conceitos     >   | |
|  | Iniciante - Fundamentos     | |
|  +-----------------------------+ |
|                                  |
|  +-------------+  +------------+ |
|  | Areas do    |  | Iniciando  | |
|  | Direito     |  | em         | |
|  | 27 areas  > |  | Concursos >| |
|  +-------------+  +------------+ |
|  +-------------+  +------------+ |
|  | Portugues   |  | OAB        | |
|  | Juridico    |  | 1a Fase    | |
|  | Gramatica > |  |          > | |
|  +-------------+  +------------+ |
+----------------------------------+
```

### Detalhes Tecnicos

**Arquivo**: `src/components/mobile/MobileTrilhasAprender.tsx`

1. **Mover o bloco "Jornada de Estudos"** (linhas 283-293) para antes da secao "Seu Progresso" (linha 232), tornando-o o primeiro elemento visivel na aba.

2. **Ajustar espacamento**: adicionar `mb-4` ao titulo e `mb-5` entre "Seu Progresso" e o grid de categorias para manter respiracao visual adequada.

3. **Manter tudo o mais intacto**: capas de imagem, grid 2x2, card da Trilha de Conceitos, logica de navegacao e progresso permanecem identicos.

