
# Plano: Melhorar Tela Introdutória e Conteúdo das Páginas

## Problemas Identificados

1. **Seção "O que você vai aprender"**: Existe no código (linha 316-358 de `ConceitosTopicoIntro.tsx`) mas está colapsada por padrão (`showIndex` inicia como `false`). A lista só aparece quando o usuário clica.

2. **Botões muito grandes no mobile**: Os botões de módulos (Leitura, Flashcards, Praticar) usam `p-4` e estrutura verbosa, ocupando muito espaço vertical na tela.

3. **Conteúdo das páginas pouco explicativo**: O prompt na Edge Function pede 200-400 palavras por página, mas precisa ser mais enfático para gerar conteúdo mais denso e didático.

---

## Solução Proposta

### Parte 1: Mostrar "O que você vai aprender" por padrão (expandido)

Alterar o estado inicial de `showIndex` para `true`:

```tsx
// ANTES
const [showIndex, setShowIndex] = useState(false);

// DEPOIS  
const [showIndex, setShowIndex] = useState(true);
```

### Parte 2: Botões mais compactos e responsivos

Redesenhar os botões de módulos para serem mais compactos, seguindo o padrão do `OABTrilhasReader.tsx`:

**Estrutura atual (grande demais):**
```tsx
<button className="w-full ... p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full ...">1</div>
      <div className="text-left">
        <p className="font-semibold">Começar Leitura</p>
        <p className="text-xs">{totalPaginas} páginas interativas</p>
      </div>
    </div>
    <Play className="w-5 h-5" />
  </div>
  <Progress value={...} className="h-1.5" />
  <p className="text-xs mt-2 text-right">0% concluído</p>
</button>
```

**Nova estrutura compacta (igual OABTrilhasReader):**
```tsx
<button className="w-full ... p-3 sm:p-4">
  <div className="flex items-center gap-3 sm:gap-4">
    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full ...">1</div>
    <div className="flex-1 text-left">
      <div className="flex items-center gap-2">
        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-sm sm:text-base font-semibold">Começar Leitura</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Progress value={...} className="h-1 sm:h-1.5 flex-1" />
        <span className="text-xs w-10 text-right">{progressoLeitura}%</span>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
  </div>
</button>
```

**Melhorias:**
- Padding menor em mobile (`p-3 sm:p-4`)
- Ícones menores em mobile (`w-3.5 h-3.5 sm:w-4 sm:h-4`)
- Número e círculo menores (`w-8 h-8 sm:w-10 sm:h-10`)
- Progresso na mesma linha (inline com %)
- Adicionar `ChevronRight` como indicador de ação
- Remover "N páginas interativas" redundante (já mostra no stats)
- Remover "Complete para desbloquear" (ocupa espaço)

### Parte 3: Melhorar prompt de geração de conteúdo

Atualizar o prompt em `gerar-conteudo-conceitos/index.ts` para enfatizar conteúdo mais extenso e didático:

**Alterações no prompt de `promptSlides`:**

```typescript
// ANTES
CADA PÁGINA DEVE SER SUPER EXPLICATIVA com:
- Mínimo 200-400 palavras por página de tipo "texto"

// DEPOIS
CADA PÁGINA DEVE SER EXTREMAMENTE EXPLICATIVA E DIDÁTICA:
- Mínimo 400-600 palavras por página de tipo "texto"
- Para conceitos complexos: 600-800 palavras
- Cada conceito deve ter EXEMPLO PRÁTICO IMEDIATO
- TODOS os termos em latim devem ter tradução e explicação
- Cite doutrinas e jurisprudências do PDF
```

**Alterações no `promptBase` para enfatizar didática:**

Adicionar ao prompt base:
```
## 📖 PROFUNDIDADE DE CONTEÚDO OBRIGATÓRIA:

Para CADA página de tipo "texto":
1. Comece explicando O QUE É o conceito (definição clara)
2. Explique POR QUE é importante (contexto jurídico)
3. Dê EXEMPLO PRÁTICO imediatamente
4. Se tiver termo em latim, EXPLIQUE: "*pacta sunt servanda* (pactos devem ser cumpridos) - na prática, significa que..."
5. Se o PDF citar doutrina/jurisprudência, INCLUA: > "Citação..." (AUTOR)
6. Se for ponto de prova, marque: > ⚠️ **ATENÇÃO:** Este tema cai com frequência em provas!
7. Faça transições naturais: "Agora que entendemos X, veja como Y se relaciona..."
```

**Alterações no número mínimo de páginas:**

```typescript
// ANTES
1. Gere entre 35-55 páginas no total, divididas em 5-7 seções

// DEPOIS
1. Gere entre 45-70 páginas no total, divididas em 6-8 seções
2. Cada seção deve ter 6-12 páginas
3. Priorize páginas tipo "texto" com conteúdo DENSO e EXPLICATIVO
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/conceitos/slides/ConceitosTopicoIntro.tsx` | Mostrar objetivos expandidos por padrão, botões compactos e responsivos |
| `supabase/functions/gerar-conteudo-conceitos/index.ts` | Aumentar requisitos de palavras, enfatizar didática |

---

## Comparativo Visual dos Botões

### Antes (Ocupando muito espaço)
```
┌─────────────────────────────────────────┐
│  (1)  Começar Leitura                ▶  │
│       29 páginas interativas            │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░        │
│                           0% concluído  │
└─────────────────────────────────────────┘
```

### Depois (Compacto)
```
┌─────────────────────────────────────────┐
│ (1)  ▶ Começar Leitura   ████░░░ 35%  > │
└─────────────────────────────────────────┘
```

---

## Resumo das Alterações

| Item | Alteração |
|------|-----------|
| Objetivos | Mostrar expandido por padrão (`showIndex = true`) |
| Botões | Padding responsivo, layout inline, ícones menores |
| Conteúdo | Aumentar palavras mínimas (400-600), mais exemplos |
| Prompt | Enfatizar termos em latim, citações, transições |
