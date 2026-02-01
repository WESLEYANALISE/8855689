
# Plano: Unificar OAB Trilhas com Sistema de Conceitos

## Resumo

O objetivo é fazer com que a experiência de estudo na OAB Trilhas (1ª Fase) seja **100% igual** à experiência dos Conceitos, incluindo:
- **Sistema de páginas interativas** (slides)
- **Tela de introdução** com progresso de leitura, flashcards e praticar
- **Footer unificado** com navegação, índice e ruído marrom
- **Boas-vindas focadas na OAB** (única diferença)

---

## Estrutura Atual

### Conceitos (modelo a ser copiado)
```
ConceitosTopicoEstudo.tsx
├── ViewMode: 'intro' | 'slides' | 'reading'
├── ConceitosTopicoIntro (tela de boas-vindas/progresso)
│   ├── Hero image com capa
│   ├── Objetivos do tópico
│   ├── Módulo 1: Leitura (sempre desbloqueado)
│   ├── Módulo 2: Flashcards (desbloqueado após leitura 100%)
│   └── Módulo 3: Praticar (desbloqueado após flashcards 100%)
├── ConceitosSlidesViewer (visualizador de páginas)
│   ├── ConceitoSlideCard (renderiza cada página)
│   └── ConceitosSlidesFooter (navegação, índice, ruído marrom)
└── OABTrilhasReader (fallback para conteúdo antigo)
```

### OAB Trilhas Atual
```
OABTrilhasTopicoEstudo.tsx / OABTrilhasSubtemaEstudo.tsx
├── Direto para OABTrilhasReader
│   ├── Tela de boas-vindas interna
│   ├── Navegação própria (diferente de Conceitos)
│   └── Sem sistema de slides estruturados
```

---

## Implementação

### 1. Criar Componente de Introdução para OAB

**Novo arquivo:** `src/components/oab/OABTrilhasTopicoIntro.tsx`

Baseado no `ConceitosTopicoIntro`, mas com:
- Texto de boas-vindas focado na **OAB 1ª Fase**
- Cores vermelhas (tema OAB) ao invés de laranja/vermelho genérico
- Mensagem motivacional: *"Prepare-se para dominar este tema da OAB!"*

```typescript
interface OABTrilhasTopicoIntroProps {
  titulo: string;
  materiaName?: string;
  capaUrl?: string | null;
  tempoEstimado?: string;
  totalSecoes?: number;
  totalPaginas?: number;
  objetivos?: string[];
  progressoLeitura?: number;
  progressoFlashcards?: number;
  progressoQuestoes?: number;
  hasFlashcards?: boolean;
  hasQuestoes?: boolean;
  onStartPaginas: () => void;
  onStartFlashcards?: () => void;
  onStartQuestoes?: () => void;
}
```

---

### 2. Criar Viewer de Slides para OAB

**Novo arquivo:** `src/components/oab/OABTrilhasSlidesViewer.tsx`

Reutiliza os componentes existentes de Conceitos:
- `ConceitoSlideCard` - renderiza cada página
- `ConceitosSlidesFooter` - navegação e controles

Ou simplesmente **reutilizar** `ConceitosSlidesViewer` diretamente nas páginas OAB.

---

### 3. Modificar OABTrilhasSubtemaEstudo.tsx

Adicionar lógica de view modes igual a Conceitos:

```typescript
type ViewMode = 'intro' | 'slides' | 'reading';

const [viewMode, setViewMode] = useState<ViewMode>('intro');

// Extrair slides_json se disponível (novo formato)
const slidesData = useMemo(() => {
  // Parse do conteudo_gerado.paginas para formato ConceitoSecao[]
}, [conteudoGerado]);

// Renderização condicional:
if (viewMode === 'slides' && slidesData) {
  return <ConceitosSlidesViewer ... />;
}

if (viewMode === 'intro' && slidesData) {
  return <OABTrilhasTopicoIntro ... />;
}

// Fallback para OABTrilhasReader (conteúdo antigo)
```

---

### 4. Modificar OABTrilhasTopicoEstudo.tsx

Mesma lógica acima para tópicos da tabela `oab_trilhas_topicos`.

---

### 5. Converter Formato de Páginas para Slides

O `conteudo_gerado` atual tem formato:
```json
{
  "paginas": [
    { "titulo": "Introdução", "markdown": "...", "tipo": "introducao" },
    ...
  ]
}
```

Precisa ser convertido para formato `ConceitoSecao[]`:
```typescript
interface ConceitoSecao {
  id: number;
  titulo: string;
  slides: ConceitoSlide[];
}

interface ConceitoSlide {
  tipo: 'introducao' | 'texto' | 'resumo' | ...;
  titulo: string;
  conteudo: string;
  // outros campos...
}
```

Criar função de mapeamento:
```typescript
const convertPaginasToSecoes = (paginas: Pagina[]): ConceitoSecao[] => {
  // Agrupa páginas em seções ou cria uma única seção
  return [{
    id: 1,
    titulo: "Conteúdo",
    slides: paginas.map(p => ({
      tipo: p.tipo || 'texto',
      titulo: p.titulo,
      conteudo: p.markdown
    }))
  }];
};
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/oab/OABTrilhasTopicoIntro.tsx` | Tela de introdução estilo Conceitos, focada OAB |

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/oab/OABTrilhasSubtemaEstudo.tsx` | Adicionar ViewMode, usar slides viewer + intro |
| `src/pages/oab/OABTrilhasTopicoEstudo.tsx` | Mesma lógica de ViewMode |
| `src/components/conceitos/slides/index.ts` | Exportar tipos/componentes para reutilização |

---

## Experiência do Usuário Final

1. **Usuário entra no subtema/tópico da OAB**
2. **Vê tela de Introdução (OABTrilhasTopicoIntro)**
   - Hero image com capa
   - Título e matéria
   - Estatísticas (X páginas, tempo estimado)
   - Objetivos do conteúdo
   - 3 módulos: Leitura → Flashcards → Praticar
3. **Clica em "Começar Leitura"**
4. **Entra no ConceitosSlidesViewer** (idêntico a Conceitos)
   - Páginas interativas com animação
   - Footer com navegação, índice, ruído marrom
   - Progress bar no header
5. **Ao completar leitura, volta para Intro**
   - Flashcards desbloqueados
6. **Fluxo continua igual a Conceitos**

---

## Considerações Técnicas

- **Reutilização máxima**: Usar os mesmos componentes de slide/footer de Conceitos
- **Mapeamento de dados**: Converter formato de páginas OAB para formato slides
- **Progresso**: Salvar na tabela `oab_trilhas_estudo_progresso`
- **Cores**: Manter tema vermelho da OAB (já usado nos componentes)
