
# Plano: Nova Geração de Capas OAB Trilhas (Uma Capa por Matéria)

## Resumo do Pedido

1. **Uma capa por matéria** (ex: "Litisconsórcio") que será usada em TODAS as aulas dessa matéria
2. **Capas mais detalhadas** que realmente representem o conceito jurídico
3. **Usar o mesmo prompt** da Biblioteca de Estudos (Direito Penal) - sistema com mapeamento detalhado por tema
4. **Capas antigas ficam salvas** no Supabase, mas usar as novas
5. **Geração automática** ao entrar numa matéria que ainda não tem a nova capa

---

## Arquitetura Atual (Problemas)

| Componente | Status Atual | Problema |
|------------|--------------|----------|
| `gerar-capa-topico-oab` | Prompt genérico simplificado | Capa pouco representativa |
| `gerar-capa-materia-oab` | Prompt por área (não por tema) | Não representa "Litisconsórcio" especificamente |
| Hook `useOABMateriaCapasAutoGeneration` | Gera capa por matéria | Precisa usar novo sistema |

---

## Arquitetura Proposta

### Nova Edge Function: `gerar-capa-oab-tema`

Baseada na `gerar-capa-biblioteca`, que tem:
- Mapeamento detalhado por keywords jurídicos
- Sistema de contexto visual com cenas realistas
- Variações de cenas para cada tema
- Paleta de cores por área
- Compressão WebP com TinyPNG

### Fluxo de Geração

```
Usuário entra em "Litisconsórcio"
         ↓
Verifica se oab_trilhas_topicos tem capa_url (com flag de "nova geração")
         ↓
   [SEM CAPA ou CAPA ANTIGA]
         ↓
Chama gerar-capa-oab-tema com:
  - materia_titulo: "Litisconsórcio"
  - area: "Direito Processual Civil"
         ↓
Busca no MAPA DE CONTEXTOS (igual Biblioteca de Estudos)
  - keywords: ['litisconsórcio', 'pluralidade de partes']
  - cena: "Multiple plaintiffs or defendants seated together in courtroom..."
  - variações: 5 cenas diferentes
         ↓
Gera imagem 16:9 com Gemini
         ↓
Comprime para WebP 1280x720
         ↓
Salva em oab_trilhas_topicos (PRIMEIRA aula da matéria)
         ↓
APLICA A MESMA CAPA a TODAS as aulas dessa matéria
```

---

## Mapeamento de Contextos (Novos Temas Processuais)

Vou adicionar mapeamentos específicos para os temas de Direito Processual Civil:

```typescript
// LITISCONSÓRCIO
{
  keywords: ['litisconsórcio', 'pluralidade de partes'],
  contexto: {
    cena: 'Multiple plaintiffs or defendants seated together at courtroom table, representing joint litigation',
    elementos: 'group of 3-4 people on same side of courtroom, shared lawyer, multiple case folders, united front',
    atmosfera: 'solidarity, joint action, strength in numbers',
    variacoes: [
      'multiple plaintiffs signing joint petition together',
      'group of defendants with shared defense lawyer in court',
      'judge addressing multiple parties at once',
      'lawyers conferring with multiple clients at table',
      'shared verdict affecting multiple parties'
    ]
  }
}

// INTERVENÇÃO DE TERCEIROS
{
  keywords: ['intervenção de terceiros', 'assistência', 'chamamento', 'denunciação'],
  contexto: {
    cena: 'Third party entering courtroom proceedings mid-trial, joining existing case',
    elementos: 'person walking into court session, existing parties looking, judge allowing entry, new documents',
    atmosfera: 'disruption, new perspective, expanded litigation',
    variacoes: [
      'new party presenting documents to join case',
      'judge ruling on third party intervention request',
      'original parties reacting to intervener joining',
      'lawyer introducing new client to ongoing case',
      'three-way dispute resolution session'
    ]
  }
}

// TUTELA PROVISÓRIA
{
  keywords: ['tutela provisória', 'liminar', 'urgência', 'antecipação'],
  contexto: {
    cena: 'Emergency court session, judge issuing urgent protective order, clock showing urgency',
    elementos: 'judge signing urgent order, red "urgent" stamp, clock showing pressure, relieved petitioner',
    atmosfera: 'urgency, protection, immediate action, race against time',
    variacoes: [
      'petitioner rushing to court with emergency papers',
      'judge stamping emergency injunction at night',
      'protective order stopping harmful action just in time',
      'lawyer on phone getting emergency hearing approved',
      'clock and gavel representing time-sensitive justice'
    ]
  }
}

// ... (mais 40+ mapeamentos para todos os temas de Processo Civil)
```

---

## Mudanças no Banco de Dados

Adicionar flag para diferenciar capas antigas das novas:

```sql
ALTER TABLE oab_trilhas_topicos 
ADD COLUMN IF NOT EXISTS capa_versao INTEGER DEFAULT 1;
```

- `capa_versao = 1`: Capa antiga (genérica)
- `capa_versao = 2`: Nova capa (detalhada por tema)

---

## Arquivos a Criar/Modificar

### 1. Nova Edge Function: `supabase/functions/gerar-capa-oab-tema/index.ts`

Baseada em `gerar-capa-biblioteca`, com:
- Mapeamento completo de temas processuais
- Mesmo sistema de paletas por área
- Mesmo prompt detalhado
- Compressão WebP
- Lógica para aplicar capa a TODAS as aulas da mesma matéria

### 2. Modificar: `src/hooks/useOABMateriaCapasAutoGeneration.tsx`

- Chamar nova função `gerar-capa-oab-tema`
- Verificar `capa_versao` antes de decidir se gera nova
- Passar `materia_titulo` (não apenas ID)

### 3. Migração SQL: Adicionar coluna `capa_versao`

```sql
ALTER TABLE oab_trilhas_topicos 
ADD COLUMN IF NOT EXISTS capa_versao INTEGER DEFAULT 1;
```

---

## Detalhamento da Nova Edge Function

```typescript
// supabase/functions/gerar-capa-oab-tema/index.ts

// 1. MAPEAMENTO COMPLETO (igual Biblioteca de Estudos)
const mapaTemasProcessuais: { keywords: string[]; contexto: ContextoVisual }[] = [
  // Litisconsórcio
  { keywords: ['litisconsórcio'], contexto: { ... } },
  // Intervenção de Terceiros
  { keywords: ['intervenção de terceiros'], contexto: { ... } },
  // Tutela Provisória
  { keywords: ['tutela', 'liminar'], contexto: { ... } },
  // Petição Inicial
  { keywords: ['petição inicial'], contexto: { ... } },
  // Sentença e Coisa Julgada
  { keywords: ['sentença', 'coisa julgada'], contexto: { ... } },
  // ... (todos os 45 temas de Processo Civil)
];

// 2. FUNÇÃO encontrarContextoVisual (copiar da Biblioteca)
// 3. FUNÇÃO gerarPromptCompleto (copiar da Biblioteca)
// 4. LÓGICA DE GERAÇÃO E APLICAÇÃO
```

---

## Prompt Final (Modelo)

```typescript
function gerarPromptCompleto(titulo, area, contexto, variacao, paleta) {
  return `CRITICAL INSTRUCTION - ABSOLUTE TEXT PROHIBITION:
This image MUST contain ZERO text elements.

Create a CINEMATIC EDITORIAL ILLUSTRATION in 16:9 horizontal format.

VISUAL CONCEPT: "${titulo}"
THEMATIC AREA: ${area}

SCENE TO ILLUSTRATE:
${variacao}

SCENE ELEMENTS:
${contexto.elementos}

ATMOSPHERE:
${contexto.atmosfera}

VISUAL STYLE REQUIREMENTS:
- Semi-realistic cinematic illustration style
- High detail with visible textures
- Realistic human proportions and expressions
- Dramatic cinematic lighting with strong directional source
- Rich environmental details (objects, clothing, architecture)
- Movie poster aesthetic quality

COLOR PALETTE (MANDATORY):
${paleta.descricao}

COMPOSITION:
- 16:9 horizontal landscape format (wider than tall)
- Dynamic, engaging arrangement
- Clear focal point with depth through layering
- Professional premium quality

FINAL CHECK - TEXT PROHIBITION:
- NO text, NO letters, NO words, NO numbers
- All signs, documents in scene must be blank or blurred`;
}
```

---

## Sequência de Implementação

1. **Migração SQL**: Adicionar coluna `capa_versao`
2. **Nova Edge Function**: `gerar-capa-oab-tema` com mapeamento completo
3. **Modificar Hook**: `useOABMateriaCapasAutoGeneration` para usar nova função
4. **Deploy**: Fazer deploy da nova edge function
5. **Testar**: Entrar em "Litisconsórcio" e verificar se gera nova capa representativa

---

## Resultado Esperado

### Antes (Capa Genérica):
- Imagem abstrata de "Direito Processual Civil"
- Mesma capa para qualquer tema
- Não representa "Litisconsórcio"

### Depois (Capa por Tema):
- Cena de "múltiplas partes no mesmo lado do processo"
- Visual de grupo de pessoas unidas como litisconsortes
- Capa específica para "Litisconsórcio" usada em TODAS as 5 aulas desse tema
- Diferente de "Intervenção de Terceiros" (que terá sua própria capa temática)
