
## Reorganizacao da Aba "Aulas" - Nova Ordem e Destaques

### Nova Ordem dos Elementos

```text
+----------------------------------+
|  DASHBOARD DE PROGRESSO          |
+----------------------------------+
|  JORNADA DE ESTUDOS              |
|  Fundamentos do Direito          |
+----------------------------------+
|  +-------------+  +------------+ |
|  | Trilha de   |  | Conceitos  | |
|  | Conceitos   |  | p/ Concurso| |
|  +-------------+  +------------+ |
+----------------------------------+
|  -- Areas do Direito --          |
|  (icone) Explore as materias     |
|  +---+ +---+ +---+ (carrossel)  |
|  |Con| |Civ| |Pen|  (maiores)   |
|  +---+ +---+ +---+              |
+----------------------------------+
|  +----------------------------+  |
|  | Portugues Juridico         |  |
|  +----------------------------+  |
+----------------------------------+
|  -- OAB --                       |
|  (icone) Preparacao completa     |
|  +-------------+  +------------+ |
|  | 1a Fase     |  | 2a Fase    | |  (capas diferentes)
|  | (capa 1)    |  | (capa 2)   | |
|  +-------------+  +------------+ |
+----------------------------------+
```

### Mudancas Detalhadas

**1. Trilha de Conceitos + Conceitos para Concurso (primeiro no grid)**
- Mover para logo apos o titulo "Jornada de Estudos"
- Renomear "Iniciando em Concursos" para "Conceitos para Concurso"
- Subtitulo ajustado para "Preparacao"
- Mantém grid 2x2 com h-[140px]

**2. Areas do Direito (segundo, com destaque)**
- Adicionar icone (Scale) antes do titulo
- Adicionar subtitulo "Explore as materias"
- Aumentar cards do carrossel de h-[100px] para h-[120px] e de w-[130px] para w-[150px]
- Sombras mais profundas para destaque

**3. Portugues Juridico (terceiro)**
- Mantém layout horizontal atual
- Sem mudancas visuais

**4. OAB (por ultimo, com destaque)**
- Adicionar icone (Gavel) antes do titulo "OAB"
- Adicionar subtitulo "Preparacao completa"
- Trocar capas: usar `oab-primeira-fase-thumb.jpg` para 1a Fase e `oab-segunda-fase-thumb.jpg` para 2a Fase (ja existem no projeto)
- Cards com h-[140px] para dar mais destaque

### Detalhes Tecnicos

**Arquivo**: `src/components/mobile/MobileTrilhasAprender.tsx`

- Importar os dois novos thumbnails: `oab-primeira-fase-thumb.jpg` e `oab-segunda-fase-thumb.jpg`
- Reordenar as secoes 3-6 no JSX: Conceitos+Concurso -> Areas -> Portugues -> OAB
- Renomear texto "Iniciando em Concursos" para "Conceitos para Concurso"
- Atualizar `<img src>` dos cards OAB para usar as capas individuais
- Aumentar dimensoes dos cards de Areas do Direito no carrossel
- Adicionar icone + subtitulo nos headers de "Areas do Direito" e "OAB"
