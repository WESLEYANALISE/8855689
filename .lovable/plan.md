
# Plano: Limites de Conteúdo Gratuito para OAB Trilhas e Conceitos

## Resumo

Implementar restrições de conteúdo para contas gratuitas, permitindo acesso limitado a:
- **2 matérias por área** (dentro de cada área OAB)
- **9 áreas** (trilhas) na página principal OAB Trilhas
- **9 matérias** em Conceitos Trilhante

Itens além desses limites aparecerão bloqueados com visual de cadeado e exigirão assinatura Premium para acesso.

---

## Arquitetura da Solução

```text
+------------------------------------------+
|       Hook useFixedContentLimit          |
|  (limites absolutos, não percentuais)    |
+------------------------------------------+
            |
            v
+------------------------------------------+
|         Componentes de Lista             |
|  TrilhasAprovacao | OABTrilhasMateria    |
|  ConceitosTrilhante                      |
+------------------------------------------+
            |
            v
+------------------------------------------+
|   LockedContentListItem / Card           |
|   (visual de item bloqueado)             |
+------------------------------------------+
            |
            v
+------------------------------------------+
|       PremiumFloatingCard                |
|   (modal de upgrade ao clicar)           |
+------------------------------------------+
```

---

## Etapas de Implementação

### 1. Criar Hook `useFixedContentLimit`

Novo hook em `src/hooks/useFixedContentLimit.ts` que trabalha com limites absolutos (não percentuais).

**Funcionalidades:**
- Recebe array de itens e limite máximo
- Retorna `visibleItems` (até o limite) e `lockedItems` (além do limite)
- Usuários Premium têm acesso total
- Durante loading, mantém acesso total (evita flash)

**Limites definidos:**
- `oab-trilhas-areas`: 9 áreas
- `oab-trilhas-materias`: 2 matérias por área
- `conceitos-materias`: 9 matérias

---

### 2. Atualizar `TrilhasAprovacao.tsx` (OAB Trilhas)

**Alterações:**
- Importar `useFixedContentLimit` e `useSubscription`
- Aplicar limite de 9 áreas para usuários gratuitos
- Renderizar `LockedContentCard` para áreas bloqueadas
- Adicionar `PremiumFloatingCard` para modal de upgrade
- Exibir badge de quantidade bloqueada no topo

---

### 3. Atualizar `OABTrilhasMateria.tsx` (Matérias por Área)

**Alterações:**
- Aplicar limite de 2 matérias por área para usuários gratuitos
- Renderizar versão bloqueada dos cards de matéria
- Adicionar modal de upgrade ao clicar em item bloqueado

---

### 4. Atualizar `ConceitosTrilhante.tsx` (Conceitos)

**Alterações:**
- Aplicar limite de 9 matérias para usuários gratuitos
- Usar mesmo padrão visual de bloqueio
- Adicionar modal de upgrade

---

### 5. Criar Componente `LockedTimelineCard`

Novo componente em `src/components/LockedTimelineCard.tsx` específico para o visual de timeline usado em OAB Trilhas e Conceitos.

**Características:**
- Mantém o layout de timeline alternado (esquerda/direita)
- Capa com overlay escuro e cadeado centralizado
- Badge "Premium" no canto
- Texto em tom mais escuro (muted)

---

## Detalhes Técnicos

### Hook `useFixedContentLimit`

```typescript
// Limites absolutos por tipo de conteúdo
const FIXED_LIMITS: Record<string, number> = {
  'oab-trilhas-areas': 9,      // 9 áreas na página principal
  'oab-trilhas-materias': 2,   // 2 matérias por área
  'conceitos-materias': 9,     // 9 matérias em conceitos
};

export function useFixedContentLimit<T>(
  items: T[] | undefined,
  type: keyof typeof FIXED_LIMITS
): {
  visibleItems: T[];
  lockedItems: T[];
  totalCount: number;
  isPremiumRequired: boolean;
}
```

### Estrutura do Card Bloqueado

O card bloqueado na timeline terá:
- Imagem de capa com blur + overlay escuro
- Cadeado dourado centralizado
- Badge "Premium" no canto superior direito
- Título e subtítulo em cor muted
- Ao clicar: abre `PremiumFloatingCard`

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useFixedContentLimit.ts` | **Criar** - Hook de limite absoluto |
| `src/components/LockedTimelineCard.tsx` | **Criar** - Card bloqueado para timeline |
| `src/pages/oab/TrilhasAprovacao.tsx` | **Modificar** - Aplicar limite de 9 áreas |
| `src/pages/oab/OABTrilhasMateria.tsx` | **Modificar** - Aplicar limite de 2 matérias |
| `src/pages/ConceitosTrilhante.tsx` | **Modificar** - Aplicar limite de 9 matérias |

---

## Comportamento Visual

### Usuário Gratuito

1. **OAB Trilhas (Áreas)**: Vê 9 áreas normalmente, restante com cadeado
2. **Dentro de uma Área (Matérias)**: Vê 2 matérias, restante bloqueado
3. **Conceitos Trilhante**: Vê 9 matérias, restante bloqueado

### Usuário Premium

- Acesso completo a todo o conteúdo
- Nenhum indicador de bloqueio exibido

---

## Experiência do Usuário

1. Usuário gratuito navega normalmente pelos itens liberados
2. Ao visualizar item bloqueado, vê visual com cadeado
3. Ao clicar no item bloqueado, abre modal persuasivo com:
   - Título "Conteúdo Premium"
   - Descrição contextual
   - Áudio persuasivo (já existente)
   - Botão "Ver Planos"
4. Usuário é direcionado para página de assinatura

---

## Resultado Esperado

- Usuários gratuitos têm amostra significativa do conteúdo
- Limite claro e previsível (não percentual que varia)
- Visual atrativo que incentiva upgrade sem frustrar
- Experiência consistente entre OAB Trilhas e Conceitos
