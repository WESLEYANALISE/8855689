
# Plano: Sistema de Slides Interativos com Imagens Batch para Conceitos

## Visão Geral

Este plano implementa duas funcionalidades integradas:

1. **Gemini Batch API**: Sistema para gerar imagens em massa com 50% de economia de custo
2. **Slides Interativos**: Reformulação do sistema de Conceitos para usar slides dinâmicos com menus suspensos (Collapsible), linhas do tempo, e uma imagem ilustrativa por slide

---

## Parte 1: Sistema Batch API para Geração de Imagens

### 1.1 Arquitetura do Sistema Batch

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE GERAÇÃO BATCH                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. INICIAR BATCH                                                   │
│     └─> batch-imagens-iniciar                                       │
│         • Recebe lista de prompts + IDs                             │
│         • Cria arquivo JSONL                                        │
│         • Dispara job no Gemini Batch API                           │
│         • Salva job_id na tabela batch_jobs                         │
│                                                                      │
│  2. MONITORAR (cron ou polling)                                     │
│     └─> batch-imagens-status                                        │
│         • Consulta status do job                                    │
│         • Retorna: PENDING | RUNNING | COMPLETED | FAILED           │
│                                                                      │
│  3. PROCESSAR RESULTADOS                                            │
│     └─> batch-imagens-processar                                     │
│         • Baixa arquivo de output                                   │
│         • Extrai imagens base64                                     │
│         • Comprime para WebP (TinyPNG)                              │
│         • Faz upload para Storage                                   │
│         • Atualiza registros com URLs                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Nova Tabela: `conceitos_batch_jobs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary key |
| job_name | text | Nome do job no Gemini |
| tipo | text | 'capas_topicos' ou 'imagens_slides' |
| status | text | pending, running, completed, failed |
| total_items | integer | Quantidade de imagens a gerar |
| completed_items | integer | Quantidade concluída |
| input_file_uri | text | URI do arquivo JSONL de input |
| output_file_uri | text | URI do arquivo de output |
| created_at | timestamp | Criação |
| completed_at | timestamp | Conclusão |
| error_message | text | Mensagem de erro se falhar |

### 1.3 Edge Functions a Criar

#### `batch-imagens-iniciar/index.ts`
```typescript
// Estrutura do body:
{
  tipo: 'capas_conceitos' | 'slides_conceitos',
  items: [
    { id: 123, prompt: "Create an image for..." },
    { id: 124, prompt: "Create an image for..." }
  ]
}

// Fluxo:
// 1. Criar arquivo JSONL com os requests
// 2. Upload para Cloud Storage via API
// 3. Criar batch job via generativelanguage API
// 4. Salvar job na tabela batch_jobs
// 5. Retornar job_id para polling
```

#### `batch-imagens-status/index.ts`
```typescript
// Consulta status do job
// Retorna progresso e estado atual
```

#### `batch-imagens-processar/index.ts`
```typescript
// Quando job COMPLETED:
// 1. Baixar output JSONL
// 2. Para cada linha, extrair imagem base64
// 3. Comprimir com TinyPNG
// 4. Upload para Storage
// 5. Atualizar tabela correspondente com URL
```

### 1.4 Economia Estimada

| Cenário | Custo Real-time | Custo Batch | Economia |
|---------|-----------------|-------------|----------|
| 50 capas de tópicos | $1.95 | $0.975 | 50% |
| 200 imagens de slides | $7.80 | $3.90 | 50% |
| 1000 imagens/mês | $39.00 | $19.50 | 50% |

---

## Parte 2: Sistema de Slides Interativos para Conceitos

### 2.1 Nova Estrutura de Dados dos Slides

A edge function `gerar-conteudo-conceitos` será reformulada para gerar uma estrutura de slides similar à usada em `gerar-aula-trilhas-oab`:

```typescript
interface ConceitoSlide {
  tipo: 'introducao' | 'texto' | 'termos' | 'explicacao' | 'collapsible' 
      | 'linha_tempo' | 'tabela' | 'atencao' | 'dica' | 'caso' | 'resumo' | 'quickcheck';
  titulo: string;
  conteudo: string;
  
  // Para tipo 'collapsible' (menu suspenso)
  collapsibleItems?: Array<{
    titulo: string;
    conteudo: string;
    icone?: string;
  }>;
  
  // Para tipo 'linha_tempo'
  etapas?: Array<{
    titulo: string;
    descricao: string;
  }>;
  
  // Para tipo 'termos'
  termos?: Array<{
    termo: string;
    definicao: string;
  }>;
  
  // Para tipo 'tabela'
  tabela?: {
    cabecalhos: string[];
    linhas: string[][];
  };
  
  // Para tipo 'quickcheck'
  pergunta?: string;
  opcoes?: string[];
  resposta?: number;
  feedback?: string;
  
  // Imagem do slide
  imagemPrompt?: string;  // Prompt para gerar a imagem
  imagemUrl?: string;     // URL após geração
}

interface ConceitoSecao {
  id: number;
  titulo: string;
  slides: ConceitoSlide[];
}
```

### 2.2 Novo Componente: `SlideCollapsible.tsx`

Menu suspenso interativo dentro de slides:

```typescript
// Funcionalidades:
// - Múltiplos itens expansíveis
// - Animação suave de abertura/fechamento
// - Ícones personalizados por item
// - Permite manter múltiplos abertos
// - Estilo visual consistente com outros slides
```

### 2.3 Componentes a Criar/Modificar

| Componente | Ação | Descrição |
|------------|------|-----------|
| `src/components/conceitos/ConceitosSlidesViewer.tsx` | CRIAR | Container principal de slides |
| `src/components/conceitos/ConceitoSlideCard.tsx` | CRIAR | Renderiza cada tipo de slide |
| `src/components/conceitos/SlideCollapsible.tsx` | CRIAR | Menu suspenso interativo |
| `src/components/conceitos/ConceitosTopicoIntro.tsx` | CRIAR | Tela inicial com opção Leitura/Slides |
| `src/pages/ConceitosTopicoEstudo.tsx` | MODIFICAR | Adicionar toggle de modo |

### 2.4 Atualização da Edge Function `gerar-conteudo-conceitos`

#### Novo Prompt para Gerar Slides Estruturados

A função será modificada para:

1. **Dividir o conteúdo em 30-50 slides** (não mais 8 páginas longas)
2. **Incluir prompts de imagem** para cada slide
3. **Usar tipos variados de slides** (collapsible, linha_tempo, tabela, etc.)
4. **Gerar estrutura JSON** compatível com o novo viewer

#### Estrutura do Output

```json
{
  "secoes": [
    {
      "id": 1,
      "titulo": "Introdução às Escolas Penais",
      "slides": [
        {
          "tipo": "introducao",
          "titulo": "O que você vai aprender",
          "conteudo": "Nesta trilha...",
          "imagemPrompt": "Classical law library with scales of justice..."
        },
        {
          "tipo": "collapsible",
          "titulo": "Conceitos Fundamentais",
          "conteudo": "Clique para explorar cada conceito:",
          "collapsibleItems": [
            {
              "titulo": "Direito Penal Clássico",
              "conteudo": "Surgiu no século XVIII...",
              "icone": "book"
            },
            {
              "titulo": "Escola Positivista",
              "conteudo": "Foco no criminoso, não no crime...",
              "icone": "user"
            }
          ],
          "imagemPrompt": "18th century courtroom with legal scholars..."
        },
        {
          "tipo": "linha_tempo",
          "titulo": "Evolução das Escolas Penais",
          "conteudo": "Veja como as escolas evoluíram:",
          "etapas": [
            {"titulo": "Século XVIII", "descricao": "Escola Clássica - Beccaria"},
            {"titulo": "Século XIX", "descricao": "Escola Positivista - Lombroso"},
            {"titulo": "Século XX", "descricao": "Escola Crítica - Abolicionismo"}
          ],
          "imagemPrompt": "Timeline showing evolution of legal thought..."
        }
      ]
    }
  ],
  "imagensParaBatch": [
    {"slideId": "1-0", "prompt": "Classical law library..."},
    {"slideId": "1-1", "prompt": "18th century courtroom..."}
  ]
}
```

### 2.5 Fluxo de Geração com Imagens Batch

```
┌───────────────────────────────────────────────────────────────────┐
│                 FLUXO COMPLETO DE GERAÇÃO                         │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ETAPA 1: Gerar Estrutura de Slides (imediato)                    │
│  └─> gerar-conteudo-conceitos                                     │
│      • Gera JSON com 30-50 slides                                 │
│      • Inclui prompts de imagem para cada slide                   │
│      • Salva estrutura no banco (sem imagens ainda)               │
│      • Status: "slides_prontos"                                   │
│                                                                    │
│  ETAPA 2: Disparar Batch de Imagens (background)                  │
│  └─> batch-imagens-iniciar                                        │
│      • Coleta todos os prompts do tópico                          │
│      • Cria job batch com todos os prompts                        │
│      • Status: "gerando_imagens"                                  │
│                                                                    │
│  ETAPA 3: Monitorar e Processar (background/cron)                 │
│  └─> batch-imagens-processar                                      │
│      • Quando job completa, processa todas as imagens             │
│      • Atualiza cada slide com sua imagemUrl                      │
│      • Status: "concluido"                                        │
│                                                                    │
│  USUÁRIO PODE USAR A TRILHA IMEDIATAMENTE (Etapa 1)               │
│  As imagens aparecem conforme ficam prontas                       │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### 2.6 Interface do Usuário

#### Tela de Introdução do Tópico

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESCOLAS PENAIS                                │
│                 Direito Penal I                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [     IMAGEM DE CAPA     ]                                    │
│                                                                  │
│   ⏱️ 25 min  |  📑 6 seções  |  🎯 35 slides                    │
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐                      │
│   │  📖 Modo        │  │  🎬 Modo        │                      │
│   │     Leitura     │  │     Slides ⭐   │                      │
│   └─────────────────┘  └─────────────────┘                      │
│                                                                  │
│              [     COMEÇAR     ]                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Slide com Menu Collapsible

```
┌─────────────────────────────────────────────────────────────────┐
│  [←]   Conceitos   ●●●○○○○   [3/35]                       [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [     IMAGEM ILUSTRATIVA DO SLIDE     ]                       │
│                                                                  │
│   📚 Explore os Conceitos                                       │
│   ─────────────────────────────                                 │
│                                                                  │
│   ┌─────────────────────────────────────────┐                   │
│   │ ▸ Escola Clássica                   [+] │                   │
│   └─────────────────────────────────────────┘                   │
│   ┌─────────────────────────────────────────┐                   │
│   │ ▾ Escola Positivista                [-] │                   │
│   │   ─────────────────────────────────     │                   │
│   │   A Escola Positivista surgiu com       │                   │
│   │   Cesare Lombroso no século XIX...      │                   │
│   │                                         │                   │
│   │   Foco: criminoso (não o crime)         │                   │
│   │   Método: científico/biológico          │                   │
│   └─────────────────────────────────────────┘                   │
│   ┌─────────────────────────────────────────┐                   │
│   │ ▸ Escola Crítica                    [+] │                   │
│   └─────────────────────────────────────────┘                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│   [  ← Anterior  ]              [  Próximo →  ]                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Parte 3: Detalhes Técnicos de Implementação

### 3.1 Edge Functions a Criar

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| batch-imagens-iniciar | `supabase/functions/batch-imagens-iniciar/index.ts` | Inicia job batch |
| batch-imagens-status | `supabase/functions/batch-imagens-status/index.ts` | Consulta status |
| batch-imagens-processar | `supabase/functions/batch-imagens-processar/index.ts` | Processa resultados |

### 3.2 Edge Function a Modificar

| Função | Modificação |
|--------|-------------|
| gerar-conteudo-conceitos | Gerar estrutura de slides JSON em vez de Markdown paginado |

### 3.3 Componentes React a Criar

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| ConceitosSlidesViewer | `src/components/conceitos/ConceitosSlidesViewer.tsx` | Viewer principal |
| ConceitoSlideCard | `src/components/conceitos/ConceitoSlideCard.tsx` | Card de slide |
| SlideCollapsible | `src/components/conceitos/SlideCollapsible.tsx` | Menu expansível |
| ConceitosTopicoIntro | `src/components/conceitos/ConceitosTopicoIntro.tsx` | Tela de intro |

### 3.4 Páginas a Modificar

| Página | Modificação |
|--------|-------------|
| ConceitosTopicoEstudo.tsx | Adicionar toggle Leitura/Slides |

### 3.5 Banco de Dados

| Tabela | Ação | Colunas |
|--------|------|---------|
| conceitos_batch_jobs | CRIAR | id, job_name, tipo, status, total_items, etc. |
| conceitos_topicos | MODIFICAR | Adicionar `slides_json` (jsonb) para nova estrutura |

---

## Cronograma de Implementação

### Fase 1: Sistema Batch API (Base)
1. Criar tabela `conceitos_batch_jobs`
2. Implementar `batch-imagens-iniciar`
3. Implementar `batch-imagens-status`
4. Implementar `batch-imagens-processar`
5. Testar com capas de tópicos existentes

### Fase 2: Componentes de Slides
1. Criar `SlideCollapsible.tsx`
2. Criar `ConceitoSlideCard.tsx` (reutilizando tipos existentes)
3. Criar `ConceitosSlidesViewer.tsx`
4. Criar `ConceitosTopicoIntro.tsx`

### Fase 3: Reformular Geração de Conteúdo
1. Atualizar `gerar-conteudo-conceitos` para gerar slides JSON
2. Integrar com batch de imagens
3. Modificar `ConceitosTopicoEstudo.tsx`

### Fase 4: Integração e Testes
1. Testar fluxo completo
2. Verificar performance em mobile
3. Ajustar animações e transições

---

## Benefícios Esperados

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Custo de imagens** | $0.039/imagem | $0.0195/imagem (50% economia) |
| **Formato do conteúdo** | 8 páginas longas de Markdown | 30-50 slides interativos |
| **Engajamento** | Scroll longo | Navegação por slides |
| **Recursos visuais** | Sem imagens nos slides | 1 imagem por slide |
| **Interatividade** | Apenas leitura | Menus expansíveis, quickchecks |
| **Mobile** | Scroll infinito | Swipe entre slides |
