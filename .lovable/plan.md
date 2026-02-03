

# Plano: Ajustar Flashcards para Usar Áreas da Biblioteca de Estudos

## Resumo das Mudancas

Você quer:
1. Mostrar quantidade de áreas disponíveis ao lado do total de flashcards
2. Usar as mesmas áreas da Biblioteca de Estudos (excluindo Português, Revisão OAB, Pesquisa Científica, Formação Complementar)
3. Usar as mesmas capas da Biblioteca de Estudos
4. Obter o prompt para gerar capas manualmente (formato thumbnail)
5. Deixar títulos mais responsivos e sem negrito

---

## Áreas que Serão Usadas

Com base na Biblioteca de Estudos, excluindo as 4 áreas solicitadas:

| Area | Livros |
|------|--------|
| Direito Administrativo | 26 |
| Direito Ambiental | 7 |
| Direito Civil | 56 |
| Direito Concorrencial | 7 |
| Direito Constitucional | 45 |
| Direito Desportivo | 2 |
| Direito Do Trabalho | 29 |
| Direito Empresarial | 12 |
| Direito Financeiro | 16 |
| Direito Internacional Privado | 2 |
| Direito Internacional Público | 10 |
| Direito Penal | 44 |
| Direito Previdenciário | 15 |
| Direito Processual Civil | 51 |
| Direito Processual Do Trabalho | 11 |
| Direito Processual Penal | 22 |
| Direitos Humanos | 7 |
| Direito Tributário | 39 |
| Direito Urbanístico | 6 |
| Lei Penal Especial | 14 |
| Políticas Públicas | 14 |
| Prática Profissional | 8 |
| Teoria E Filosofia Do Direito | 17 |

**Total: 23 áreas**

---

## Prompt para Gerar Capas Manualmente (Thumbnail)

Encontrei o prompt completo usado na Edge Function `gerar-capa-biblioteca`. Aqui está o formato para você usar:

```text
CRITICAL INSTRUCTION - ABSOLUTE TEXT PROHIBITION:
This image MUST contain ZERO text elements. Any image with letters, words, numbers, titles, labels, signs, typography, watermarks, or any written content will be REJECTED. Generate a PURELY VISUAL illustration with NO TEXT WHATSOEVER.

Create a CINEMATIC EDITORIAL ILLUSTRATION in 16:9 horizontal format (thumbnail).

VISUAL CONCEPT: "[NOME DA ÁREA - ex: Direito Penal]"
THEMATIC AREA: Direito

SCENE TO ILLUSTRATE:
[DESCRIÇÃO DA CENA - ex: Brazilian courtroom with judge delivering verdict, dramatic lighting]

SCENE ELEMENTS:
[ELEMENTOS - ex: judge with gavel, defendant standing, serious atmosphere, dark wood]

ATMOSPHERE:
[ATMOSFERA - ex: gravity of justice, professional legal environment]

VISUAL STYLE REQUIREMENTS:
- Semi-realistic cinematic illustration style
- High detail with visible textures
- Realistic human proportions and expressions
- Dramatic cinematic lighting with strong directional source
- Rich environmental details (objects, clothing, architecture)
- Movie poster aesthetic quality
- Magazine editorial illustration feel

COLOR PALETTE (MANDATORY):
[DESCRIÇÃO DE CORES - ex: deep crimson red, black shadows, golden accents]
• Primary: [COR PRINCIPAL - ex: #8B0000]
• Secondary: [COR SECUNDÁRIA - ex: #1a1a1a]
• Accent: [COR DESTAQUE - ex: #D4AF37]
Apply this color grading throughout the entire composition.

COMPOSITION:
- 16:9 horizontal thumbnail format
- Dynamic, engaging arrangement
- Clear focal point with depth through layering
- Professional premium quality

SCENE DETAILS:
- Realistic fabric textures
- Authentic Brazilian legal settings
- Period-appropriate elements
- Professional attire and equipment
- Environmental storytelling

FINAL CHECK - TEXT PROHIBITION:
- NO text, NO letters, NO words, NO numbers, NO signs, NO labels
- NO typography of any kind
- All signs, documents, or papers in scene must be blank or blurred
- PURELY VISUAL content only
```

**Paleta de Cores por Área:**

| Área | Primária | Secundária | Destaque | Descrição |
|------|----------|------------|----------|-----------|
| Direito Penal | #8B0000 | #1a1a1a | #D4AF37 | deep crimson red, black shadows, golden accents |
| Direito Civil | #1E3A5F | #F5F5F5 | #C0C0C0 | navy blue, clean white, silver tones |
| Direito Constitucional | #006400 | #FFD700 | #00308F | deep green, golden yellow, patriotic blue |
| Direito Tributário | #228B22 | #D4AF37 | #CD7F32 | forest green, gold, bronze money tones |
| Direito do Trabalho | #CC5500 | #1E3A5F | #8B4513 | burnt orange, industrial blue, earthy brown |
| Direito Administrativo | #663399 | #808080 | #FFFFFF | royal purple, institutional gray, white |
| Direito Empresarial | #0047AB | #D4AF37 | #36454F | corporate blue, gold, charcoal |
| Direito Processual Civil | #4682B4 | #FFFFFF | #C0C0C0 | steel blue, white, silver |
| Direito Processual Penal | #800020 | #696969 | #1a1a1a | burgundy red, dark gray, black |
| Direito Ambiental | #228B22 | #8B4513 | #87CEEB | forest green, earth brown, sky blue |
| Direito Internacional | #0047AB | #FFFFFF | #D4AF37 | royal blue, white, gold diplomatic |
| Direito Previdenciário | #FF8C00 | #FFFDD0 | #8B4513 | warm orange, cream, brown |
| Filosofia do Direito | #4B0082 | #D4AF37 | #FFFDD0 | deep indigo, gold, cream |
| Default | #1E3A5F | #D4AF37 | #FFFFFF | navy blue, gold, white |

---

## Alteracoes no Código

### Arquivo 1: `src/hooks/useFlashcardsAreasCache.ts`

**Mudanca**: Buscar áreas da BIBLIOTECA-ESTUDOS em vez do RPC atual, excluindo as 4 áreas proibidas.

```typescript
// Áreas a excluir
const AREAS_EXCLUIDAS = [
  'Portugues',
  'Revisão Oab', 
  'Pesquisa Científica',
  'Formação Complementar'
];

// Buscar áreas únicas da BIBLIOTECA-ESTUDOS
const { data: bibliotecaData } = await supabase
  .from('BIBLIOTECA-ESTUDOS')
  .select('Área, url_capa_gerada, "Capa-livro"')
  .not('Área', 'is', null);

// Agrupar por área e pegar primeira capa
const areasMap = new Map<string, { capa: string | null; count: number }>();
bibliotecaData?.forEach(item => {
  if (item.Área && !AREAS_EXCLUIDAS.includes(item.Área)) {
    const existing = areasMap.get(item.Área);
    if (!existing) {
      areasMap.set(item.Área, { 
        capa: item.url_capa_gerada || item["Capa-livro"], 
        count: 1 
      });
    } else {
      existing.count++;
      if (!existing.capa) {
        existing.capa = item.url_capa_gerada || item["Capa-livro"];
      }
    }
  }
});

// Buscar contagem de flashcards por área
const { data: flashcardsCount } = await supabase
  .rpc('get_flashcard_areas_from_gerados');

// Combinar dados
const result = Array.from(areasMap.entries()).map(([area, data]) => {
  const fcData = flashcardsCount?.find(f => f.area === area);
  return {
    area,
    totalFlashcards: fcData?.total_flashcards || 0,
    totalTemas: data.count,
    urlCapa: data.capa
  };
}).sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
```

**Retornar também a contagem de áreas:**
```typescript
return {
  areas,
  isLoading,
  totalFlashcards,
  totalAreas: areas?.length || 0  // NOVO
};
```

---

### Arquivo 2: `src/pages/FlashcardsAreas.tsx`

**Mudancas:**

1. **Mostrar quantidade de áreas ao lado do total de flashcards**

```typescript
// Linha 86-87 - Atualizar para mostrar áreas também
<p className="text-muted-foreground text-sm ml-11">
  <span className="text-violet-400 font-semibold">{totalFlashcards.toLocaleString('pt-BR')}</span> flashcards
  <span className="text-gray-500 mx-2">•</span>
  <span className="text-violet-400 font-semibold">{areas?.length || 0}</span> áreas
</p>
```

2. **Remover negrito dos títulos e melhorar responsividade**

```typescript
// Linha 208-210 - Remover font-medium, adicionar text-wrap
<h3 className="text-[13px] leading-snug text-white break-words">
  {area.area}
</h3>
```

3. **Mesma mudança para cards bloqueados (linha 301-303)**

```typescript
<h3 className="text-[13px] leading-snug text-white/60 break-words">
  {area.area}
</h3>
```

---

### Arquivo 3: `src/pages/FlashcardsTemas.tsx`

**Mudancas para títulos sem negrito:**

1. **Linha 346 - Remover font-medium do título do tema**

```typescript
<h3 className="text-sm leading-snug text-white line-clamp-2">
  {item.tema}
</h3>
```

2. **Linha 340 - Remover font-semibold do label "Tema X"**

```typescript
<p className={`text-xs mb-0.5 ${
  item.temFlashcards ? "text-green-400" : item.parcial ? "text-blue-400" : "text-violet-400"
}`}>
  Tema {item.ordem + 1}
</p>
```

---

## Resumo Visual das Mudancas

| Componente | Antes | Depois |
|------------|-------|--------|
| Header FlashcardsAreas | "27.890 flashcards disponíveis" | "27.890 flashcards • 23 áreas" |
| Título da área | **font-medium** (negrito) | texto normal, break-words |
| Label "Tema X" | **font-semibold** | texto normal |
| Título do tema | **font-medium** | texto normal |
| Fonte de dados | `flashcards_areas` table | `BIBLIOTECA-ESTUDOS` table |
| Capas | `flashcards_areas.url_capa` | `BIBLIOTECA-ESTUDOS.url_capa_gerada` |

---

## Sequencia de Implementacao

1. Atualizar `useFlashcardsAreasCache.ts` para buscar da BIBLIOTECA-ESTUDOS
2. Adicionar retorno de `totalAreas` no hook
3. Atualizar `FlashcardsAreas.tsx` para mostrar contagem de áreas
4. Remover negrito dos títulos em `FlashcardsAreas.tsx`
5. Remover negrito dos títulos em `FlashcardsTemas.tsx`
6. Testar a responsividade com títulos longos

