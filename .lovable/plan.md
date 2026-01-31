
# Plano: Corrigir Extração de Títulos de Tópicos do PDF

## Problema Identificado

Analisando os logs da edge function `identificar-temas-conceitos`, identifiquei a **causa raiz** do truncamento dos títulos:

### O que está acontecendo

1. **Gemini retorna títulos COMPLETOS:**
   ```json
   "titulo": "Da Independência à Constituição de 1824"
   "titulo": "Constituição de 1824"
   "titulo": "Do Império à Proclamação da República e a Constituição de 1891"
   ```

2. **Após o agrupamento, os títulos ficam TRUNCADOS:**
   ```
   1. Da Independência à Constituição de
   2. Constituição de
   3. Do Império à Proclamação da República e a Constituição de
   ```

### Causa Raiz

A função `normalizarTitulo` (linha 10-19) contém uma regex que **remove números arábicos do final do título**:

```javascript
// Remove números arábicos no final: 1, 2, 3... (com "E" opcional)
.replace(/\s+\d+(\s+E\s+\d+)*\s*$/gi, '')
```

Esta regex foi criada para agrupar temas como "Perfil Histórico I" + "Perfil Histórico II" → "Perfil Histórico".

**Porém**, ela também remove os **anos** (1824, 1891, 1934, 1937, 1946, 1967, 1988) que fazem parte do título original!

---

## Solução Técnica

Modificar a regex para:
1. **Não remover anos** (números com 4 dígitos típicos de anos: 1800-2099)
2. **Continuar removendo** números de sequenciamento (I, II, III, 1, 2, 3)

### Arquivo a Modificar

`supabase/functions/identificar-temas-conceitos/index.ts`

### Alteração na função `normalizarTitulo`

```javascript
// ANTES (problemático):
.replace(/\s+\d+(\s+E\s+\d+)*\s*$/gi, '')

// DEPOIS (corrigido):
// Remove números arábicos pequenos no final (1-99), mas preserva anos (1800-2099)
.replace(/\s+(?!\d{4}\b)\d{1,2}(\s+E\s+\d{1,2})*\s*$/gi, '')
```

**Explicação da nova regex:**
- `(?!\d{4}\b)` = Negative lookahead que **não** captura se forem 4 dígitos (anos)
- `\d{1,2}` = Captura apenas números de 1 ou 2 dígitos (1, 2, 3... até 99)
- Isso preserva "1824", "1891", "1988" mas remove "I E II", "1 E 2"

### Alteração adicional no agrupamento

Também vou ajustar a linha 55 para usar o **título original** do primeiro tema do grupo, não o título normalizado:

```javascript
// ANTES:
const tituloLimpo = normalizarTitulo(temasDoGrupo[0].titulo);

// DEPOIS:
// Usar título original do primeiro tema (preserva anos)
const tituloLimpo = temasDoGrupo[0].titulo;
```

A normalização será usada **apenas para agrupar** (comparar títulos), mas o título salvo será o original.

---

## Resultado Esperado

### Antes da correção:
```
1. Da Independência à Constituição de (págs 3-4)
2. Constituição de (págs 5-12)
3. Do Império à Proclamação da República e a Constituição de (págs 7-7)
```

### Depois da correção:
```
1. Da Independência à Constituição de 1824 (págs 3-4)
2. Constituição de 1824 (págs 5-6)
3. Do Império à Proclamação da República e a Constituição de 1891 (págs 7-7)
```

---

## Arquivo a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `supabase/functions/identificar-temas-conceitos/index.ts` | Ajustar regex para preservar anos e usar título original |
