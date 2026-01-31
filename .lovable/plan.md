
# Plano: Páginas Interativas com Tela Inicial Completa e Conteúdo Aprimorado

## Resumo das Alterações Solicitadas

1. **Nomenclatura**: Trocar "slides" por "páginas" em toda a interface
2. **Tela Inicial Completa**: Adicionar flashcards, praticar e ruído marrom igual ao modo leitura
3. **Melhorar Estrutura de Conteúdo**: Cards mais explicativos, citações, dicas de estudo, exemplos
4. **Remover Collapsibles**: Converter tudo para texto fluido

---

## Parte 1: Nova Tela de Introdução (Igual ao Modo Leitura)

A tela de introdução atual (`ConceitosTopicoIntro.tsx`) está muito simples. Precisamos reformulá-la para ter:

### Design da Nova Tela Inicial

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│              [IMAGEM DE CAPA COM DEGRADÊ]                       │
│                                                                  │
│  ─────────────── ✦ ───────────────                              │
│                                                                  │
│                 NOME DO TÓPICO                                  │
│                  (Matéria)                                      │
│                                                                  │
│  ─────────────── ✦ ───────────────                              │
│                                                                  │
│  ┌───────────────────┐  ┌────────────────────┐                  │
│  │ 📚 8 páginas      │  │ 🎧 Ruído Marrom    │                  │
│  └───────────────────┘  │    [  Switch  ]    │                  │
│                         └────────────────────┘                  │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║  1  ▶ Começar Leitura                                      ║  │
│  ║     ███████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  35%       ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  2  🔮 Flashcards                              🔒 Bloq.   │  │
│  │     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0%        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  3  🎯 Praticar                                🔒 Bloq.   │  │
│  │     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0%        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│        Card Explicativo do Ruído Marrom (quando ativo)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Elementos a Adicionar

| Elemento | Origem | Funcionalidade |
|----------|--------|----------------|
| Ruído Marrom | `OABTrilhasReader.tsx` | Toggle com Switch + card explicativo |
| Módulo Flashcards | `OABTrilhasReader.tsx` | Botão bloqueado até completar leitura |
| Módulo Praticar | `OABTrilhasReader.tsx` | Botão bloqueado até completar flashcards |
| Progresso por módulo | `OABTrilhasReader.tsx` | Barra de progresso individual |
| Índice expandível | `OABTrilhasReader.tsx` | Lista de páginas clicável |

---

## Parte 2: Renomear "Slides" para "Páginas"

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `ConceitosTopicoIntro.tsx` | "slides" → "páginas", props renomeadas |
| `ConceitosSlidesViewer.tsx` | Variáveis e textos de "slides" → "páginas" |
| `ConceitoSlideCard.tsx` | Comentários e labels |
| `ConceitosTopicoEstudo.tsx` | Mensagens e variáveis |
| `types.ts` | Manter tipos (internos), apenas comentários |

### Exemplos de Mudanças

```tsx
// ANTES
<span className="text-sm">{totalSlides} slides</span>

// DEPOIS
<span className="text-sm">{totalPaginas} páginas</span>
```

```tsx
// ANTES
"A IA está criando slides interativos para este tópico."

// DEPOIS
"A IA está criando páginas interativas para este tópico."
```

---

## Parte 3: Melhorar Estrutura de Conteúdo na Edge Function

### Problemas Identificados

1. O prompt atual pede "collapsible" que será removido
2. Falta ênfase em citações de artigos/doutrina
3. Falta instrução para incluir mais exemplos práticos
4. Conteúdo de cada página pode ser mais extenso

### Novo Prompt Aprimorado

O prompt em `gerar-conteudo-conceitos` será atualizado para:

```typescript
const promptSlides = `
...

REGRAS CRÍTICAS ATUALIZADAS:

1. **CONTEÚDO EXTENSO E EXPLICATIVO**
   - Cada página deve ter conteúdo COMPLETO e auto-suficiente
   - Mínimo de 200-400 palavras por página de tipo "texto"
   - Explique conceitos de forma DIDÁTICA e DETALHADA

2. **CITAÇÕES OBRIGATÓRIAS**
   - Sempre que o PDF contiver citações de artigos de lei, INCLUA formatado:
     > "Art. 5º, inciso X - São invioláveis a intimidade, a vida privada..." (CF/88)
   - Citações de doutrinadores:
     > "A dignidade da pessoa humana..." - FLÁVIO TARTUCE
   - Jurisprudência:
     > STJ, REsp 1.234.567/SP - "Ementa..."

3. **EXEMPLOS PRÁTICOS EM CADA EXPLICAÇÃO**
   Use o formato:
   > 📚 **EXEMPLO PRÁTICO:** Maria comprou um celular com defeito...

4. **EXPLICAÇÃO DE TERMOS TÉCNICOS**
   Sempre que usar termo em latim ou juridiquês:
   "...o princípio *pacta sunt servanda* (que significa 'os pactos devem ser cumpridos')..."

5. **CARDS DE ATENÇÃO E DICAS**
   Use abundantemente:
   > ⚠️ **ATENÇÃO:** Este ponto costuma cair em provas!
   > 💡 **DICA DE MEMORIZAÇÃO:** Use o mnemônico SOLAR...
   > 🎯 **VOCÊ SABIA?:** O STF decidiu que...

6. **NÃO USE TIPO "collapsible"**
   - Substitua por tipo "texto" com subtítulos internos
   - Use ### dentro do conteúdo para organizar subtópicos

TIPOS DE PÁGINAS PERMITIDOS (removido collapsible):
- introducao
- texto
- termos
- linha_tempo
- tabela
- atencao
- dica
- caso
- resumo
- quickcheck
`;
```

### Estrutura Sugerida de Páginas por Tópico

```
Página 1: introducao - Boas-vindas e objetivos
Página 2-5: texto - Conceitos principais (cada um com ~300 palavras)
Página 6: termos - Glossário de termos técnicos
Página 7: linha_tempo - Se houver evolução histórica/etapas
Página 8: tabela - Quadro comparativo
Página 9: atencao - Pontos que caem em prova
Página 10: caso - Exemplo prático detalhado
Página 11: dica - Técnicas de memorização
Página 12: quickcheck - Verificação rápida #1
Página 13-16: texto - Mais conceitos
Página 17: quickcheck - Verificação rápida #2
Página 18: resumo - Síntese final
```

---

## Parte 4: Integrar Flashcards e Praticar no Modo Páginas

### Fluxo Atualizado

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DO MODO PÁGINAS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. TELA INICIAL (intro)                                        │
│     ├─> Módulo 1: Começar Leitura (páginas)                     │
│     ├─> Módulo 2: Flashcards (bloqueado até 100% leitura)       │
│     └─> Módulo 3: Praticar (bloqueado até 100% flashcards)      │
│                                                                  │
│  2. LEITURA DE PÁGINAS                                          │
│     ├─> Navega entre páginas (1/N, 2/N...)                      │
│     ├─> Ao chegar na última: "Concluir" marca leitura 100%      │
│     └─> Volta para tela inicial                                 │
│                                                                  │
│  3. FLASHCARDS (após leitura)                                   │
│     ├─> Reutiliza FlashcardStack existente                      │
│     └─> Marca flashcards como concluídos                        │
│                                                                  │
│  4. PRATICAR (após flashcards)                                  │
│     ├─> Navega para /conceitos/questoes/{id}                    │
│     └─> Marca prática como concluída                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Props Necessárias no Viewer

O `ConceitosSlidesViewer` precisará receber:

```typescript
interface ConceitosSlidesViewerProps {
  // Existentes
  secoes: ConceitoSecao[];
  titulo: string;
  materiaName?: string;
  onClose: () => void;
  onComplete?: () => void;
  
  // Novos para flashcards/praticar
  flashcards?: Flashcard[];
  questoes?: Questao[];
  topicoId?: number;
  capaUrl?: string;
  
  // Progresso
  progressoLeitura?: number;
  progressoFlashcards?: number;
  progressoQuestoes?: number;
  onProgressUpdate?: (type: 'leitura' | 'flashcards' | 'questoes', value: number) => void;
}
```

---

## Parte 5: Arquivos a Criar/Modificar

### Arquivos a MODIFICAR

| Arquivo | Modificações |
|---------|--------------|
| `src/components/conceitos/slides/ConceitosTopicoIntro.tsx` | Redesign completo com flashcards, praticar, ruído marrom |
| `src/components/conceitos/slides/ConceitosSlidesViewer.tsx` | Integrar tela inicial, gerenciar estados de progresso, "slides"→"páginas" |
| `src/components/conceitos/slides/ConceitoSlideCard.tsx` | Remover renderização de collapsible, converter para texto |
| `src/pages/ConceitosTopicoEstudo.tsx` | Passar flashcards/questoes para viewer, "slides"→"páginas" |
| `supabase/functions/gerar-conteudo-conceitos/index.ts` | Melhorar prompt de geração, remover collapsible, enfatizar citações |

### Tipos a Atualizar

```typescript
// types.ts - remover collapsible do tipo
export interface ConceitoSlide {
  tipo: 
    | 'introducao'
    | 'texto'
    | 'termos'
    | 'explicacao'
    // | 'collapsible'  <-- REMOVIDO
    | 'linha_tempo'
    | 'tabela'
    | 'atencao'
    | 'dica'
    | 'caso'
    | 'resumo'
    | 'quickcheck';
  
  // ... resto mantido
}
```

---

## Parte 6: Código da Nova Tela Inicial

A nova `ConceitosTopicoIntro.tsx` terá estrutura similar ao bloco de boas-vindas do `OABTrilhasReader.tsx`:

### Funcionalidades Incluídas

1. **Imagem de capa com degradê**
2. **Título centralizado com decoração ✦**
3. **Badge de quantidade de páginas**
4. **Toggle de ruído marrom com Switch**
5. **Módulo 1: Começar Leitura** (sempre desbloqueado)
6. **Módulo 2: Flashcards** (bloqueado até leitura 100%)
7. **Módulo 3: Praticar** (bloqueado até flashcards 100%)
8. **Card explicativo do ruído marrom** (modal ao ativar)
9. **Índice expandível** (dropdown com lista de páginas)

### Estados Gerenciados

```typescript
// Estados de progresso
const [leituraCompleta, setLeituraCompleta] = useState(false);
const [flashcardsCompletos, setFlashcardsCompletos] = useState(false);
const [praticaCompleta, setPraticaCompleta] = useState(false);
const [progressoLeitura, setProgressoLeitura] = useState(0);
const [progressoFlashcards, setProgressoFlashcards] = useState(0);
const [progressoQuestoes, setProgressoQuestoes] = useState(0);

// Ruído marrom
const [brownNoiseEnabled, setBrownNoiseEnabled] = useState(false);
const [showBrownNoiseInfo, setShowBrownNoiseInfo] = useState(false);
const brownNoiseRef = useRef<HTMLAudioElement | null>(null);

// Índice
const [mostrarIndice, setMostrarIndice] = useState(false);
```

---

## Resumo das Alterações

| Categoria | Alteração |
|-----------|-----------|
| **Nomenclatura** | "Slides" → "Páginas" em toda interface |
| **Tela Inicial** | Redesign com flashcards, praticar, ruído marrom, índice |
| **Conteúdo** | Prompt melhorado: mais citações, exemplos, explicações de termos |
| **Collapsible** | Removido - convertido para texto com subtítulos |
| **Progresso** | Salvar no banco por módulo (leitura, flashcards, questões) |
| **Áudio** | Integrar ruído marrom (/audio/ruido-marrom.mp3) |

---

## Ordem de Implementação

1. Modificar `types.ts` - remover collapsible do enum de tipos
2. Modificar `ConceitoSlideCard.tsx` - converter collapsible para texto
3. Modificar `ConceitosTopicoIntro.tsx` - redesign completo com todos os módulos
4. Modificar `ConceitosSlidesViewer.tsx` - integrar estados, renomear, mostrar intro primeiro
5. Modificar `ConceitosTopicoEstudo.tsx` - passar props adicionais, renomear mensagens
6. Modificar `gerar-conteudo-conceitos` - melhorar prompt, remover collapsible
7. Testar fluxo completo
