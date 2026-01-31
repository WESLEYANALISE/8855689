
# Plano: Alinhamento Visual e Imagens Batch para Slides de Conceitos

## Análise do Problema

Após analisar o código e a imagem de referência do modo leitura, identifiquei os seguintes problemas:

### 1. Design Inconsistente
- O `ConceitoSlideCard.tsx` atual usa paleta de cores diferentes (roxo, azul, amarelo, verde) ao invés da paleta vermelha/laranja do modo leitura
- O fundo do card usa cores variadas por tipo (`bgColorMap`) enquanto o reader usa `bg-[#12121a]`
- A tipografia não segue o padrão Playfair Display do reader
- Os títulos estão acima do card, não integrados à imagem com degradê

### 2. Imagens Não Estão Sendo Geradas
- A edge function `gerar-conteudo-conceitos` gera os `imagemPrompt` para cada slide
- MAS não há integração com o sistema batch para disparar a geração
- O `batch-imagens-iniciar` existe mas não é chamado após a geração dos slides

### 3. Falta de Citações e Hierarquia
- O slide card não usa o `EnrichedMarkdownRenderer` que processa citações, blockquotes coloridos (ATENÇÃO, DICA, CASO PRÁTICO)
- Não há processamento de citações legais estilo `> "Art. 1º..."`

---

## Solução Proposta

### Fase 1: Alinhamento Visual com Modo Leitura

#### Modificações em `ConceitoSlideCard.tsx`:

1. **Unificar paleta de cores**: Substituir `colorMap` e `bgColorMap` pela paleta vermelha/laranja do reader
2. **Tipografia**: Usar `Playfair Display` para títulos
3. **Background do card**: Usar `bg-[#12121a]` com borda `border-white/10`
4. **Decoração**: Adicionar os elementos decorativos vermelhos (✦ e linhas gradiente)

```tsx
// ANTES
const colorMap = {
  introducao: "from-purple-500 to-pink-500",
  ...
}

// DEPOIS  
const colorMap = {
  introducao: "from-red-500 to-orange-500",
  texto: "from-red-500 to-orange-500",
  ...todos usam a mesma paleta
}

// ANTES - background variado
const bgColor = bgColorMap[slide.tipo];

// DEPOIS - background consistente
className="bg-[#12121a] rounded-xl border border-white/10 p-5"
```

5. **Imagem com título overlay**: Título do slide deve ficar DENTRO da imagem, na parte inferior com degradê:

```tsx
{/* Imagem com título overlay */}
{slide.imagemUrl && (
  <div className="relative rounded-2xl overflow-hidden mb-6">
    <UniversalImage src={slide.imagemUrl} aspectRatio="16/9" />
    {/* Degradê + título */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <p className="text-xs text-red-400 uppercase tracking-wide">{getSlideLabel(tipo)}</p>
      <h2 className="text-xl font-bold text-white" style={{fontFamily: "'Playfair Display'..."}}>
        {slide.titulo}
      </h2>
    </div>
  </div>
)}
```

---

### Fase 2: Integrar EnrichedMarkdownRenderer para Citações

O conteúdo dos slides deve usar o `EnrichedMarkdownRenderer` para processar:
- Blockquotes coloridos (`> ⚠️ **ATENÇÃO:**`, `> 💡 **DICA:**`, etc.)
- Citações legais entre aspas
- Formatação negrito/itálico com cores âmbar

```tsx
// Em renderContent() para tipo "texto" e outros
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";

return (
  <EnrichedMarkdownRenderer 
    content={slide.conteudo}
    fontSize={16}
    theme="classicos"
  />
);
```

---

### Fase 3: Disparar Geração Batch de Imagens

#### Modificar `gerar-conteudo-conceitos`:

Após salvar os slides_json, disparar automaticamente o batch de imagens:

```typescript
// Após salvar slides_json no banco
if (slidesData?.secoes) {
  // Coletar todos os prompts de imagem
  const imagensParaBatch: Array<{id: number; slideId: string; prompt: string}> = [];
  
  slidesData.secoes.forEach((secao, secaoIdx) => {
    secao.slides.forEach((slide, slideIdx) => {
      if (slide.imagemPrompt) {
        imagensParaBatch.push({
          id: imagensParaBatch.length,
          slideId: `${secaoIdx}-${slideIdx}`,
          prompt: slide.imagemPrompt
        });
      }
    });
  });
  
  // Disparar batch se houver imagens
  if (imagensParaBatch.length > 0) {
    fetch(`${supabaseUrl}/functions/v1/batch-imagens-iniciar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
      body: JSON.stringify({
        tipo: "imagens_slides",
        items: imagensParaBatch,
        materia_id: topico.materia_id
      })
    }).catch(err => console.error("Erro ao iniciar batch:", err));
  }
}
```

---

### Fase 4: Atualizar tipos de slides para usar imagens corretamente

#### Em `ConceitosSlidesViewer.tsx`:

Adicionar indicador visual de carregamento de imagem:

```tsx
{/* Estado de loading para imagens */}
{slide.imagemPrompt && !slide.imagemUrl && (
  <div className="relative rounded-2xl overflow-hidden mb-6 aspect-video bg-[#1a1a2e] flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">Gerando ilustração...</p>
    </div>
  </div>
)}
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/conceitos/slides/ConceitoSlideCard.tsx` | Redesign completo seguindo paleta do reader, imagem com título overlay, integrar EnrichedMarkdownRenderer |
| `src/components/conceitos/slides/ConceitosSlidesViewer.tsx` | Adicionar loading state para imagens |
| `supabase/functions/gerar-conteudo-conceitos/index.ts` | Disparar batch-imagens-iniciar após salvar slides_json |

---

## Comparativo Visual

### Antes (Design Atual)
- Cores variadas por tipo de slide (roxo, azul, verde)
- Ícone + título lado a lado acima do conteúdo
- Sem imagens
- Conteúdo em texto simples

### Depois (Alinhado com Reader)
- Paleta vermelha/laranja consistente
- Imagem 16:9 no topo com título overlay em degradê
- Decoração ✦ e linhas gradiente vermelhas
- Background `#12121a` com borda sutil
- Citações, blockquotes coloridos, tipografia Playfair Display
- Loading state enquanto imagens são geradas em batch

---

## Hierarquia Visual dos Slides

```
┌─────────────────────────────────────────────────────────────────┐
│  Direitos da Personalidade          5/20                    ✕  │  <- Header simples
├─────────────────────────────────────────────────────────────────┤
│  ●●●●●○○○○○○○○○○○○○○○                                          │  <- Progress dots
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │           [IMAGEM ILUSTRATIVA 16:9]                       │  │
│  │                                                           │  │
│  │   ┌───────────────────────────────────────────────────┐   │  │
│  │   │ CONTEÚDO                                          │   │  │  <- Label sobre degradê
│  │   │ O Que é o Direito ao Esquecimento?                │   │  │  <- Título sobre degradê
│  │   └─────────────────────────────(degradê preto)───────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   bg-[#12121a]                            │  │
│  │                                                           │  │
│  │   Agora vem a parte interessante: o Direito ao           │  │
│  │   Esquecimento. Pense nele como a possibilidade de,      │  │
│  │   em certas situações, não ter informações do passado    │  │
│  │   ressurgindo para te prejudicar indefinidamente.        │  │
│  │                                                           │  │
│  │   > ⚠️ **ATENÇÃO:** O STF reconheceu que...              │  │  <- Blockquote colorido
│  │                                                           │  │
│  │   > 📌 **VOCÊ SABIA?:** O Enunciado n. 531...            │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│   [  ← Anterior  ]              [  Próximo →  ]                 │  <- Navegação
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Geração de Imagens

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUXO ATUALIZADO                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. gerar-conteudo-conceitos                                    │
│     └─> Gera slides_json com imagemPrompt para cada slide       │
│     └─> Salva no banco                                          │
│     └─> DISPARA batch-imagens-iniciar automaticamente           │
│                                                                  │
│  2. batch-imagens-iniciar                                       │
│     └─> Cria job no conceitos_batch_jobs                        │
│     └─> Dispara batch-imagens-processar                         │
│                                                                  │
│  3. batch-imagens-processar (background)                        │
│     └─> Gera imagens uma a uma (Gemini 2.0 Flash)               │
│     └─> Comprime com TinyPNG                                    │
│     └─> Upload para Storage                                     │
│     └─> Atualiza slides_json com imagemUrl                      │
│                                                                  │
│  USUÁRIO:                                                       │
│  └─> Pode estudar imediatamente (slides sem imagem)             │
│  └─> Imagens aparecem conforme são geradas                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Resumo das Alterações

1. **Design**: Unificar paleta de cores com o modo leitura (vermelho/laranja), usar Playfair Display, background `#12121a`

2. **Imagem com título**: Título do slide fica dentro da imagem, na parte inferior com degradê

3. **Citações**: Integrar `EnrichedMarkdownRenderer` para processar blockquotes coloridos e citações legais

4. **Batch de imagens**: Disparar automaticamente após gerar slides_json, com loading state no viewer

5. **Hierarquia**: Progress dots + Imagem com overlay + Card de conteúdo + Navegação
