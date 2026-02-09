
# Plano: Carregamento Instantâneo de Imagens de Fundo das Jornadas

## Resumo

Vou padronizar o carregamento das imagens de fundo da "Jornada de Estudos" e "Jornada OAB" para que funcionem exatamente como a imagem de fundo do header (que carrega instantaneamente).

---

## Análise da Diferença

Analisei os dois mecanismos e encontrei:

**Imagem do Header (carrega instantaneamente):**
- Usa atributos de prioridade: `loading="eager"`, `fetchPriority="high"`, `decoding="sync"`
- Listada no `GlobalImagePreloader.tsx` como super crítica
- Possui `<link rel="preload">` inserido no head do documento

**Imagem da Jornada de Estudos:**
- Já possui os atributos de prioridade corretos
- Já está no `GlobalImagePreloader.tsx`

**Imagem da Jornada OAB (problema identificado):**
- **FALTAM os atributos de prioridade** (`loading`, `fetchPriority`, `decoding`)
- Isso causa o delay no carregamento

---

## Alterações Técnicas

### Arquivo: `src/pages/Index.tsx`

#### Correção 1: Adicionar atributos de prioridade na imagem da Jornada OAB

**Antes (linha 347-349):**
```tsx
<img 
  src={oabAprovacaoHero} 
  alt="Aprovação OAB"
  className="w-full h-full object-cover opacity-40"
/>
```

**Depois:**
```tsx
<img 
  src={oabAprovacaoHero} 
  alt="Aprovação OAB"
  className="w-full h-full object-cover opacity-40"
  loading="eager"
  fetchPriority="high"
  decoding="sync"
/>
```

---

## Verificação do Preload

Confirmei que ambas as imagens já estão listadas no `GlobalImagePreloader.tsx`:

```typescript
// Jornadas OAB/Estudos - preload prioritário
themisEstudosBackground,
oabAprovacaoHero,
bgAreasOab,
oabPrimeiraFaseAprovacao,
```

E já possuem `<link rel="preload">` sendo inseridos automaticamente.

---

## Resultado Esperado

Após essa correção simples:
- A imagem da Jornada OAB carregará instantaneamente igual ao header
- Ambas as jornadas terão o mesmo comportamento de carregamento otimizado
- Eliminação do flash/delay ao trocar de aba

---

## Complexidade

Correção mínima de uma linha - apenas adicionar 3 atributos HTML que estavam faltando.
