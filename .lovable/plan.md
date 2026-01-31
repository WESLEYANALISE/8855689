
# Plano: Sistema de Slides Interativos Estilo Mindsmith para Conceitos

## Visão Geral

Criar um novo modo de visualização para as Trilhas de Conceitos que funciona como o Mindsmith: conteúdo dividido em **slides navegáveis** com botões "Anterior/Próximo", progresso visual, e transições suaves.

## Análise do Sistema Atual

### O que já existe no projeto:
1. **`InteractiveSlide.tsx`** - Componente de slide interativo com:
   - Indicadores de progresso (dots)
   - Botões anterior/próximo
   - Tipos de slide: texto, termos, explicação, atenção, exemplo, quickcheck, storytelling, tabela, etc.
   - Animações com Framer Motion

2. **`OABTrilhasAula.tsx`** - Página que usa os slides com fluxo:
   - Intro → Seções (slides) → Matching → Flashcards → Quiz → Prova Final → Resultado

3. **`OABTrilhasReader.tsx`** - Leitor atual de Conceitos (baseado em páginas longas de Markdown)

4. **Tipos definidos em `types.ts`** - `SlideContent`, `Secao`, `AulaEstruturaV2`

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                 TELA DE INÍCIO DO TÓPICO                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   [Imagem de Capa]                                     │  │
│  │   Título: Escolas Penais                              │  │
│  │   Matéria: Direito Penal                              │  │
│  │   ⏱️ 15 min  |  📄 8 seções  |  🎯 5 atividades       │  │
│  │                                                        │  │
│  │   [ Modo Leitura ]  [ Modo Slides ⭐ ]                 │  │
│  │                                                        │  │
│  │   [     COMEÇAR     ]                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SLIDE INTERATIVO (Modo Slides)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [←]   Introdução   ●○○○○○○○   [1/24]           [X]  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │   📘 O que você vai aprender                          │  │
│  │   ────────────────────────────                        │  │
│  │                                                        │  │
│  │   Vamos falar sobre um tema super importante          │  │
│  │   para entender a evolução do Direito Penal...        │  │
│  │                                                        │  │
│  │   ┌──────────────────────────────────────────────┐    │  │
│  │   │ 🎯 VOCÊ SABIA?                                │    │  │
│  │   │ A Escola Clássica surgiu no século XVIII...  │    │  │
│  │   └──────────────────────────────────────────────┘    │  │
│  │                                                        │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │   [  ← Anterior  ]              [  Próximo →  ]       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Alterações Planejadas

### 1. Novo Componente: `ConceitosSlidesViewer.tsx`
**Arquivo:** `src/components/conceitos/ConceitosSlidesViewer.tsx`

Componente que transforma o conteúdo Markdown das páginas em slides navegáveis:

**Funcionalidades:**
- Divide cada página em múltiplos slides (por parágrafos/seções)
- Navegação por botões ou gestos de swipe
- Barra de progresso no topo
- Indicadores de progresso (dots) por seção
- Transições animadas entre slides
- Suporte a diferentes tipos de conteúdo (texto, tabelas, blockquotes, listas)

**Estrutura:**
```typescript
interface ConceitoSlide {
  tipo: 'introducao' | 'conteudo' | 'destaque' | 'tabela' | 'dica' | 'atencao' | 'caso' | 'resumo';
  titulo?: string;
  conteudo: string;
  secaoIndex: number;
  slideIndex: number;
}

interface ConceitosSlidesViewerProps {
  paginas: Array<{ titulo: string; markdown: string; tipo?: string }>;
  titulo: string;
  onComplete: () => void;
  onExit: () => void;
}
```

### 2. Função de Divisão de Markdown em Slides
**Arquivo:** `src/lib/markdown-to-slides.ts`

Lógica para dividir o conteúdo Markdown em slides menores:

```typescript
// Regras de divisão:
// 1. Cada ## heading inicia nova seção
// 2. Cada > blockquote (DICA, ATENÇÃO, etc) vira slide próprio
// 3. Tabelas viram slides próprios
// 4. Parágrafos longos (>400 chars) são divididos
// 5. Listas agrupadas em um slide
```

### 3. Componente de Slide Individual: `ConceitoSlideCard.tsx`
**Arquivo:** `src/components/conceitos/ConceitoSlideCard.tsx`

Renderiza cada tipo de slide com visual adequado:

- **Introdução**: Fundo com gradiente, ícone de boas-vindas
- **Conteúdo**: Texto principal com formatação Markdown
- **Destaque**: Blockquotes com cores específicas (💡, ⚠️, 🎯)
- **Tabela**: Tabela responsiva centralizada
- **Dica**: Card com borda lateral colorida
- **Caso Prático**: Simulação de cenário com ícone de case
- **Resumo**: Pontos-chave com checkmarks

### 4. Atualizar Página de Estudo: `ConceitosTopicoEstudo.tsx`
**Arquivo:** `src/pages/ConceitosTopicoEstudo.tsx`

Adicionar toggle para alternar entre modos:

```tsx
// Estado para modo de visualização
const [modoVisualizacao, setModoVisualizacao] = useState<'leitura' | 'slides'>('leitura');

// No render:
{modoVisualizacao === 'leitura' ? (
  <OABTrilhasReader ... />
) : (
  <ConceitosSlidesViewer 
    paginas={conteudoGerado?.paginas}
    titulo={topico.titulo}
    onComplete={() => navigate(`...flashcards`)}
    onExit={handleBack}
  />
)}
```

### 5. Tela de Introdução do Tópico: `ConceitosTopicoIntro.tsx`
**Arquivo:** `src/components/conceitos/ConceitosTopicoIntro.tsx`

Tela inicial antes de começar o estudo:

- Exibe capa/imagem do tópico
- Informações: duração estimada, número de seções, atividades
- Botões para escolher modo (Leitura vs Slides)
- Botão "Começar" centralizado

### 6. Navegação por Gestos (Mobile)
**Arquivo:** Integrado em `ConceitosSlidesViewer.tsx`

Suporte a swipe left/right para navegação em dispositivos móveis usando Framer Motion.

## Fluxo de Experiência

```
1. Usuário acessa /conceitos/topico/:id
   ↓
2. Tela de Introdução aparece
   - Escolhe modo: [Leitura] ou [Slides]
   ↓
3a. Modo Leitura → OABTrilhasReader (comportamento atual)
   ↓
3b. Modo Slides → ConceitosSlidesViewer
   - Slide 1: Introdução acolhedora
   - Slide 2-N: Conteúdo dividido
   - Slide Final: Síntese
   ↓
4. Ao terminar slides → Botão "Ir para Flashcards"
   ↓
5. Flashcards → Questões → Conclusão
```

## Detalhes Técnicos

### Algoritmo de Divisão de Markdown

```typescript
function dividirEmSlides(markdown: string): ConceitoSlide[] {
  const slides: ConceitoSlide[] = [];
  
  // 1. Separar por headings (## )
  const secoes = markdown.split(/(?=^## )/gm);
  
  secoes.forEach((secao, secaoIdx) => {
    // 2. Dentro de cada seção, identificar blocos especiais
    const blocos = identificarBlocos(secao);
    
    blocos.forEach((bloco, blocoIdx) => {
      slides.push({
        tipo: bloco.tipo,
        titulo: bloco.titulo,
        conteudo: bloco.conteudo,
        secaoIndex: secaoIdx,
        slideIndex: blocoIdx
      });
    });
  });
  
  return slides;
}

function identificarBlocos(secao: string): Bloco[] {
  // Detectar:
  // - > 💡 DICA → tipo 'dica'
  // - > ⚠️ ATENÇÃO → tipo 'atencao'  
  // - > 💼 CASO → tipo 'caso'
  // - | tabela | → tipo 'tabela'
  // - Texto normal → tipo 'conteudo' (dividido se > 400 chars)
}
```

### Estimativa de Slides por Página

| Página Original | Slides Estimados |
|-----------------|------------------|
| Introdução | 2-3 slides |
| Conteúdo Completo | 8-15 slides |
| Desmembrando | 5-8 slides |
| Entendendo na Prática | 3-5 slides |
| Quadro Comparativo | 3-5 slides |
| Dicas | 3-5 slides |
| Ligar Termos | 1 slide (interativo) |
| Síntese Final | 2-3 slides |
| **TOTAL** | **~25-45 slides** |

## Arquivos a Criar

1. `src/components/conceitos/ConceitosSlidesViewer.tsx` - Viewer principal
2. `src/components/conceitos/ConceitoSlideCard.tsx` - Card de slide individual
3. `src/components/conceitos/ConceitosTopicoIntro.tsx` - Tela de introdução
4. `src/lib/markdown-to-slides.ts` - Lógica de divisão

## Arquivos a Modificar

1. `src/pages/ConceitosTopicoEstudo.tsx` - Adicionar toggle de modo e lógica de escolha

## Benefícios

1. **Melhor absorção**: Conteúdo em doses menores
2. **Engajamento**: Sensação de progresso a cada slide
3. **Mobile-friendly**: Navegação por gestos
4. **Flexibilidade**: Usuário escolhe o modo preferido
5. **Consistência**: Mesma experiência das Aulas OAB

## Considerações

- Manter modo "Leitura" como opção para quem prefere scroll
- Salvar preferência do usuário no localStorage
- Animações leves para não prejudicar performance
- Suporte offline (PWA) para slides já carregados
