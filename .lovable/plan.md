
# Plano: Otimização da Seção de Questões para Carregamento Instantâneo

## Problema Identificado

Baseado nas imagens e análise do código, foram identificados os seguintes problemas:

1. **Botão de voltar global duplicado**: A página de Questões mostra o breadcrumb global ("VOLTAR - Início") que conflita com o header próprio da página
2. **Página recarregando ao clicar em áreas**: Quando o usuário navega entre áreas, a página faz um reload visual (tela preta) em vez de transição instantânea
3. **Animações pesadas**: Cards com animações CSS causam lentidão na renderização inicial
4. **Cache não otimizado**: O hook `useQuestoesTemas` precisa buscar dados do Supabase mesmo quando cache existe

## Solução Proposta

### 1. Remover Breadcrumb Global da Seção de Questões

Adicionar as rotas de questões na lista `hideBreadcrumb` do Layout para ocultar o botão de voltar duplicado.

**Arquivo**: `src/components/Layout.tsx`

```text
hideBreadcrumb incluirá:
- /ferramentas/questoes
- /ferramentas/questoes/temas
- /ferramentas/questoes/resolver
```

### 2. Simplificar Design dos Cards para Carregamento Mais Leve

**Arquivo**: `src/pages/ferramentas/QuestoesHub.tsx`

Mudanças:
- Remover animações de entrada `animate-fade-in` com delay
- Usar transições CSS leves em vez de transformações pesadas
- Simplificar estrutura visual dos cards
- Remover `hover:scale` e `hover:shadow-xl` que causam repaint

**Arquivo**: `src/pages/ferramentas/QuestoesTemas.tsx`

Mudanças similares:
- Remover `animate-fade-in` com delays sequenciais
- Remover `hover:scale[1.02]` e `hover:shadow-xl`
- Simplificar estrutura para renderização mais rápida

### 3. Otimizar Cache para Navegação Instantânea

**Arquivo**: `src/hooks/useQuestoesTemas.ts`

Melhorias no hook:
- Usar `staleTime: Infinity` para evitar refetch desnecessário
- Garantir que dados do cache são mostrados imediatamente
- Desabilitar `refetchOnMount` e `refetchOnWindowFocus`

**Arquivo**: `src/hooks/useQuestoesAreasCache.ts`

Ajustes:
- Garantir que o loading nunca aparece se há cache
- Cache persistente via IndexedDB com revalidação em background

### 4. Estrutura Simplificada dos Cards

**Antes** (pesado):
```jsx
<Card
  className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-l-4 bg-gradient-to-r from-card to-card/80 group overflow-hidden animate-fade-in"
  style={{ 
    borderLeftColor: primaryColor,
    animationDelay: `${index * 50}ms`,
    animationFillMode: 'backwards'
  }}
>
```

**Depois** (leve):
```jsx
<Card
  className="cursor-pointer transition-colors border-l-4 bg-card group"
  style={{ borderLeftColor: primaryColor }}
>
```

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/Layout.tsx` | Adicionar rotas de questões ao `hideBreadcrumb` |
| `src/pages/ferramentas/QuestoesHub.tsx` | Remover animações, simplificar cards |
| `src/pages/ferramentas/QuestoesTemas.tsx` | Remover animações, otimizar renderização |
| `src/hooks/useQuestoesTemas.ts` | Otimizar configurações de cache |

## Benefícios Esperados

- Navegação instantânea entre áreas e temas (sem tela preta)
- Carregamento visual imediato usando dados do cache
- Interface mais fluida sem animações pesadas
- Remoção da duplicação do botão de voltar

## Detalhes Técnicos

### Estratégia de Cache

```text
Fluxo de Navegação:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  QuestoesHub │ ──→ │ QuestoesTemas│ ──→ │  Resolver   │
└─────────────┘     └─────────────┘     └─────────────┘
       ↓                   ↓
   Cache áreas        Cache temas
   (IndexedDB)        (IndexedDB)
       ↓                   ↓
   Mostra dados       Mostra dados
   instantâneo        instantâneo
       ↓                   ↓
   Revalida em        Revalida em
   background         background
```

### Performance CSS

Substituições de classes:
- `hover:scale-[1.02]` → Removido (causa layout shift)
- `hover:shadow-xl` → `hover:bg-muted/50` (apenas cor)
- `animate-fade-in` com delay → Removido (causa stagger lento)
- `transition-all` → `transition-colors` (mais específico)
