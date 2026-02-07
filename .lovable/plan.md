
# Plano: Melhorar Busca Global + Corrigir Botão Voltar

## Objetivo
1. **Expandir a busca global** para incluir aulas de Conceitos e OAB Trilhas
2. **Corrigir o botão voltar** para ir para o início do app (`/`) em vez de `/ferramentas`

---

## Problema Atual

### Busca Global
A busca atual (`useBuscaGlobal.ts`) não inclui:
- **Aulas de Conceitos** (tabela `conceitos_topicos`)
- **Aulas OAB Trilhas** (tabela `oab_trilhas_temas`)

### Botão Voltar
No `Header.tsx` linha 158, a rota `/pesquisar` está configurada para voltar para `/ferramentas`:
```typescript
if (pathname === "/pesquisar") return "/ferramentas";
```

---

## Solução Proposta

### 1. Adicionar Categorias de Aulas à Busca Global

**Arquivo:** `src/hooks/useBuscaGlobal.ts`

**Novas categorias a adicionar:**

| Categoria | Tabela | Campos Buscáveis | Rota |
|-----------|--------|------------------|------|
| Aulas Conceitos | `conceitos_topicos` | `titulo` | `/conceitos/topico/{id}` |
| Aulas OAB Trilhas | `oab_trilhas_temas` | `titulo`, `area` | `/oab-trilhas/tema/{id}` |

**Exemplo de resultado:**
- "Pessoas Jurídicas: Conceituação e Constituição" → Conceitos
- "Conflito aparente de normas" → OAB Trilhas (Direito Penal)

### 2. Corrigir Rota do Botão Voltar

**Arquivo:** `src/components/Header.tsx`

**Alteração:**
```typescript
// ANTES
if (pathname === "/pesquisar") return "/ferramentas";

// DEPOIS  
if (pathname === "/pesquisar") return "/";
```

---

## Mudanças Técnicas

### Arquivo 1: `src/hooks/useBuscaGlobal.ts`

**Adicionar 2 novas categorias ao array `CATEGORIAS_CONFIG`:**

```typescript
{
  id: 'aulas-conceitos',
  nome: 'Aulas Conceitos',
  icon: 'GraduationCap',
  iconColor: 'text-teal-500',
  tabelas: [
    { 
      nome: 'conceitos_topicos', 
      colunas: ['titulo'], 
      formatResult: (item) => ({
        id: item.id, 
        titulo: item.titulo, 
        subtitulo: `Conceitos • ${item.materia?.nome || 'Matéria'}`,
        imagem: item.capa_url,
        route: `/conceitos/topico/${item.id}`
      })
    }
  ]
},
{
  id: 'aulas-oab',
  nome: 'Aulas OAB Trilhas',
  icon: 'Trophy',
  iconColor: 'text-amber-500',
  tabelas: [
    { 
      nome: 'oab_trilhas_temas', 
      colunas: ['titulo', 'area'], 
      formatResult: (item) => ({
        id: item.id, 
        titulo: item.titulo, 
        subtitulo: `OAB • ${item.area}`,
        route: `/oab-trilhas/tema/${item.id}`
      })
    }
  ]
}
```

### Arquivo 2: `src/components/Header.tsx`

**Alteração na linha 158:**
- De: `if (pathname === "/pesquisar") return "/ferramentas";`
- Para: `if (pathname === "/pesquisar") return "/";`

### Arquivo 3: `src/components/pesquisa/CategoriaCard.tsx`

**Adicionar ícone Trophy ao mapa de ícones:**
```typescript
import { ..., Trophy } from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  ..., Trophy
};
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useBuscaGlobal.ts` | Adicionar categorias "Aulas Conceitos" e "Aulas OAB Trilhas" |
| `src/components/Header.tsx` | Alterar rota de voltar de `/ferramentas` para `/` |
| `src/components/pesquisa/CategoriaCard.tsx` | Adicionar ícone Trophy |

---

## Impacto Esperado

| Antes | Depois |
|-------|--------|
| Busca em 14 categorias | Busca em 16 categorias |
| Não encontra aulas de Conceitos | Encontra aulas por título |
| Não encontra aulas OAB Trilhas | Encontra aulas por título/área |
| Botão volta para Ferramentas | Botão volta para Home |
