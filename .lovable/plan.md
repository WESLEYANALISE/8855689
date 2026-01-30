
# Plano: Melhorias no Chat da Professora

## Visao Geral

Este plano implementa tres melhorias principais no Chat da Professora (`/chat-professora`):

1. **Reconhecimento de FAQs** - A Professora identificara perguntas frequentes e respondera de forma direcionada
2. **Tabela Comparativa Visual** - Usar o componente `QuadroComparativoVisual` para renderizar tabelas no chat
3. **Botao Flutuante de Flashcards** - Apos cada resposta, exibir botao lateral que gera 10 flashcards automaticos

---

## Analise Atual

### Estrutura do Chat Professora
- **Pagina principal**: `src/pages/ChatProfessora.tsx`
- **Componente de mensagem**: `src/components/chat/ChatMessageNew.tsx`
- **Perguntas sugeridas**: `src/components/chat/SuggestedQuestions.tsx` (define FAQs por modo)
- **Hook de streaming**: `src/hooks/useStreamingChat.ts`
- **Edge function**: `supabase/functions/chat-professora/index.ts`

### Sistema de FAQs Existente
O componente `SuggestedQuestions.tsx` ja possui perguntas pre-definidas organizadas por modo:
- **study**: Perguntas sobre Direito Penal, Constitucional, Civil, Administrativo
- **realcase**: Casos Penais, Civeis, Trabalhistas
- **recommendation**: Livros, Doutrina, Conteudo Digital

### Componente de Tabela Existente
`src/components/oab/QuadroComparativoVisual.tsx` ja implementa:
- Tabela visual com tema vermelho/laranja
- Suporte a drag horizontal e touch
- Funcao `extrairTabelaDoMarkdown` para parsear tabelas Markdown

### Flashcards Existente
- `src/components/FlashcardViewer.tsx` - Visualizador completo com flip animation
- `src/components/videoaulas/VideoaulaFlashcards.tsx` - Versao simplificada
- Edge function `gerar-flashcards` - Gera 10+ flashcards via Gemini

---

## Implementacao

### Fase 1: Reconhecimento de FAQs

**Objetivo**: Quando o usuario digitar uma pergunta que corresponda a uma FAQ pre-definida, a Professora reconhecera e dara uma resposta direcionada.

**Arquivos a modificar**:
1. `supabase/functions/chat-professora/index.ts`

**Abordagem**:
```text
1. Criar mapa de FAQs com respostas base
2. Antes de enviar ao Gemini, verificar se a pergunta eh similar a uma FAQ
3. Se for FAQ, adicionar contexto especifico no prompt
4. Incluir instrucao para estruturar resposta de forma didatica
```

**Mapa de FAQs a criar**:
```typescript
const FAQ_MAP = {
  // Direito Penal
  "legitima defesa": "Explicar Art. 25 CP, excludentes, requisitos...",
  "dolo e culpa": "Diferenciar dolo direto, eventual, culpa consciente...",
  "crimes hediondos": "Lei 8.072/90, rol de crimes, regime...",
  
  // Direito Constitucional  
  "clausulas petreas": "Art. 60 CF, protecoes, limites...",
  "controle constitucionalidade": "Difuso vs concentrado, ADI, ADC...",
  
  // Direito Civil
  "usucapiao": "Modalidades, prazos, requisitos...",
  "responsabilidade civil": "Objetiva vs subjetiva, Art. 927...",
};
```

**Deteccao de similaridade**:
- Comparar tokens da pergunta com chaves do FAQ_MAP
- Se match > 60%, considerar como FAQ
- Adicionar contexto especifico ao system prompt

---

### Fase 2: Tabela Comparativa Visual

**Objetivo**: Renderizar tabelas Markdown da Professora usando o `QuadroComparativoVisual`.

**Arquivos a modificar**:
1. `src/components/chat/ChatMessageNew.tsx`

**Abordagem**:
```text
1. Importar QuadroComparativoVisual e extrairTabelaDoMarkdown
2. Na funcao renderMarkdownContent, detectar tabelas
3. Extrair dados da tabela e renderizar com componente visual
4. Manter texto normal para resto do conteudo
```

**Implementacao no ChatMessageNew**:
```typescript
// Importar
import { QuadroComparativoVisual, extrairTabelaDoMarkdown } from '@/components/oab/QuadroComparativoVisual';

// Na renderizacao
const renderContent = (text: string) => {
  const tabelaData = extrairTabelaDoMarkdown(text);
  
  if (tabelaData) {
    // Separar texto antes/depois da tabela
    // Renderizar QuadroComparativoVisual
  }
  
  return renderMarkdownContent(text);
};
```

---

### Fase 3: Botao Flutuante de Flashcards

**Objetivo**: Apos cada resposta da Professora, exibir um botao flutuante que gera 10 flashcards automaticamente.

**Arquivos a criar**:
1. `src/components/chat/FloatingFlashcardsButton.tsx`
2. `src/components/chat/ChatFlashcardsModal.tsx`

**Arquivos a modificar**:
1. `src/pages/ChatProfessora.tsx`
2. `src/hooks/useStreamingChat.ts` (opcional - para gerar flashcards junto com resposta)

**FloatingFlashcardsButton**:
```typescript
// Botao fixo no lado direito da tela
// Aparece quando ha mensagem do assistant
// Animacao de entrada/saida
// Icone de flashcard (Layers)
// Badge com "10 cards"
```

**Estilo do botao**:
```text
- Posicao: fixed right-0 top-1/2 -translate-y-1/2
- Tamanho: h-12 w-12 ou h-14 w-14
- Cor: Gradient vermelho/laranja (tema do app)
- Borda: rounded-l-xl (arredondado apenas esquerda)
- Animacao: slide-in da direita quando aparece
- Z-index: 40 (abaixo de modais, acima do conteudo)
```

**ChatFlashcardsModal**:
```typescript
// Modal drawer lateral ou central
// Reutiliza VideoaulaFlashcards para exibir os cards
// Loading state durante geracao
// Animacao de flip (react-card-flip)
// Navegacao entre cards
// Exemplo pratico em cada card
```

**Fluxo**:
```text
1. Usuario faz pergunta
2. Professora responde
3. Sistema gera 10 flashcards em background (ou sob demanda)
4. Botao flutuante aparece com animacao
5. Usuario clica no botao
6. Modal abre mostrando flashcards
7. Usuario navega com flip animation
```

---

## Detalhes Tecnicos

### Estrutura do Modal de Flashcards

```typescript
interface Flashcard {
  id: number;
  frente: string;      // Pergunta
  verso: string;       // Resposta
  exemplo?: string;    // Exemplo pratico
}

interface ChatFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conteudo: string;    // Conteudo da resposta para gerar flashcards
  flashcards: Flashcard[];
  isLoading: boolean;
}
```

### Edge Function de Flashcards

A edge function `gerar-flashcards` ja existe e pode ser reutilizada:
- Recebe `content` como texto base
- Retorna array de flashcards com `front`, `back`, `exemplo`, `base_legal`
- Usa Gemini Flash para geracao rapida

### Deteccao de FAQs

```typescript
// Funcao para detectar FAQ
function detectarFAQ(pergunta: string): { isFAQ: boolean; contexto?: string } {
  const perguntaLower = pergunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [tema, contexto] of Object.entries(FAQ_MAP)) {
    const temaLower = tema.toLowerCase();
    const palavrasTema = temaLower.split(' ');
    const palavrasPergunta = perguntaLower.split(' ');
    
    const matches = palavrasTema.filter(p => palavrasPergunta.some(q => q.includes(p)));
    const similarity = matches.length / palavrasTema.length;
    
    if (similarity >= 0.6) {
      return { isFAQ: true, contexto };
    }
  }
  
  return { isFAQ: false };
}
```

---

## Arquivos a Modificar/Criar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/chat/FloatingFlashcardsButton.tsx` | Criar | Botao flutuante lateral |
| `src/components/chat/ChatFlashcardsModal.tsx` | Criar | Modal com viewer de flashcards |
| `src/components/chat/ChatMessageNew.tsx` | Modificar | Adicionar renderizacao de tabela visual |
| `src/pages/ChatProfessora.tsx` | Modificar | Integrar botao flutuante e modal |
| `supabase/functions/chat-professora/index.ts` | Modificar | Adicionar deteccao de FAQs |
| `supabase/functions/chat-professora/faq-map.ts` | Criar | Mapa de FAQs com contextos |

---

## Fluxo de Usuario Final

```text
1. Usuario abre /chat-professora
2. Digita "O que e legitima defesa?"
3. Sistema detecta como FAQ -> adiciona contexto especifico
4. Professora responde com explicacao completa + tabela comparativa
5. Tabela renderiza com QuadroComparativoVisual (drag horizontal)
6. Botao flutuante aparece no lado direito
7. Usuario clica no botao
8. Loading enquanto gera 10 flashcards
9. Modal abre com flashcards
10. Usuario navega com flip animation
11. Cada card mostra pergunta, resposta e exemplo pratico
```

---

## Estimativa de Complexidade

| Fase | Complexidade | Tempo Estimado |
|------|--------------|----------------|
| Fase 1: FAQs | Media | Modificacoes na edge function |
| Fase 2: Tabela Visual | Baixa | Integracao de componente existente |
| Fase 3: Flashcards Flutuante | Alta | Novos componentes + integracao |

---

## Dependencias

Todas as dependencias necessarias ja estao instaladas:
- `react-card-flip` - Para animacao de flip
- `framer-motion` - Para animacoes de entrada/saida
- `lucide-react` - Para icones
- Componentes Radix UI - Para modal/dialog
