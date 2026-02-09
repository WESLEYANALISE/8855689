
# Plano: Perfil Detalhado do Usuário + Métricas Premium no Painel Admin

## Visão Geral

Vamos criar uma funcionalidade completa de "perfil detalhado do usuário" ao clicar no nome de um usuário na lista de cadastros, além de adicionar métricas globais de Premium no painel de Controle.

---

## Parte 1: Página de Detalhes do Usuário

### Nova Rota
- Rota: `/admin/usuario/:userId`
- Novo arquivo: `src/pages/Admin/AdminUsuarioDetalhes.tsx`

### Métricas que serão exibidas

| Métrica | Fonte de Dados | Como Calcular |
|---------|----------------|---------------|
| Páginas mais acessadas | `page_views` | Agrupar por `page_path` e contar |
| Termos mais pesquisados | `cache_pesquisas` + filtro de sessão (se houver) | Buscar termos pesquisados na sessão |
| Tempo médio online | `page_views` | Diferença entre primeira e última atividade do dia |
| Área mais frequentada | `page_views` | Analisar paths e categorizar (ex: /conceitos, /oab, /videoaulas) |
| Dias consecutivos de acesso | `page_views` | Identificar sequência de datas únicas |
| Total de acessos | `page_views` | COUNT por user_id |
| Primeira visita | `page_views` | MIN(created_at) |
| Última visita | `page_views` | MAX(created_at) |
| Páginas únicas visitadas | `page_views` | COUNT DISTINCT page_path |
| Status Premium | `subscriptions` | Verificar status = 'authorized' |
| Dias até virar Premium | `profiles + subscriptions` | Diferença entre subscription.created_at e profiles.created_at |

### Layout da Página

```text
+--------------------------------------------------+
| < Voltar    Detalhes do Usuário                  |
+--------------------------------------------------+
| AVATAR     Nome: Maria da Silva                  |
|            Email: maria@email.com                |
|            Dispositivo: Android                  |
|            Intenção: Estudante                   |
|            Membro desde: 05/02/2026              |
|            Status: [Premium] ou [Gratuito]       |
+--------------------------------------------------+
| RESUMO DE ATIVIDADE                              |
| +--------+ +--------+ +--------+ +--------+      |
| | Total  | | Páginas| | Dias   | | Tempo  |      |
| | 280    | | 64     | | 5      | | 2h30m  |      |
| +--------+ +--------+ +--------+ +--------+      |
+--------------------------------------------------+
| SEQUÊNCIA DE ACESSO                              |
| 5 dias consecutivos de acesso                    |
| Última atividade: há 2 horas                     |
+--------------------------------------------------+
| PÁGINAS MAIS ACESSADAS                           |
| 1. Início (52 acessos)                           |
| 2. Videoaulas (38 acessos)                       |
| 3. Conceitos (18 acessos)                        |
+--------------------------------------------------+
| ÁREAS PREFERIDAS                                 |
| Estudos: 45% | OAB: 30% | Política: 15%          |
+--------------------------------------------------+
| HISTÓRICO DE NAVEGAÇÃO (Timeline)                |
| - 09/02 05:14 - /admin/controle                  |
| - 09/02 04:58 - /videoaulas                      |
| - 08/02 23:30 - /conceitos                       |
+--------------------------------------------------+
```

---

## Parte 2: Métricas Premium no Painel Controle

### Novos Cards de Estatísticas

Adicionar na seção de cards principais:

| Card | Valor | Como Calcular |
|------|-------|---------------|
| Total Premium | 4 | COUNT DISTINCT user_id WHERE status = 'authorized' |
| Taxa Conversão | 0.8% | (Premium Únicos / Total Usuários) * 100 |
| Média dias até Premium | 6 dias | AVG(subscription.created_at - profiles.created_at) |

### Nova Tab ou Seção "Premium"

Adicionar uma nova tab no painel com:
- Lista de usuários premium
- Gráfico de conversão por período
- Tempo médio até conversão
- Receita total

---

## Detalhes Técnicos

### Novos Hooks

**1. useUsuarioDetalhes.ts**
```typescript
export const useUsuarioDetalhes = (userId: string) => {
  // Buscar dados do profile
  // Buscar page_views do usuário
  // Buscar subscriptions do usuário
  // Calcular métricas
}
```

**2. Adicionar ao useAdminControleStats.ts**
```typescript
export const useMetricasPremium = () => {
  // Total de premium únicos
  // Taxa de conversão
  // Média de dias até virar premium
}
```

### Função para calcular dias consecutivos
```typescript
function calcularDiasConsecutivos(datas: Date[]): number {
  // Ordenar datas
  // Remover duplicatas (mesmo dia)
  // Contar sequência contínua terminando em hoje
}
```

### Função para categorizar áreas
```typescript
function categorizarArea(path: string): string {
  if (path.includes('/conceitos') || path.includes('/estudos')) return 'Estudos';
  if (path.includes('/oab')) return 'OAB';
  if (path.includes('/videoaulas')) return 'Videoaulas';
  if (path.includes('/politica')) return 'Política';
  // etc
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Admin/AdminUsuarioDetalhes.tsx` | Criar - página de detalhes |
| `src/hooks/useUsuarioDetalhes.ts` | Criar - hook para dados do usuário |
| `src/hooks/useAdminControleStats.ts` | Modificar - adicionar métricas premium |
| `src/pages/Admin/AdminControle.tsx` | Modificar - tornar nomes clicáveis + adicionar cards premium |
| `src/App.tsx` | Modificar - adicionar nova rota |

---

## Resultado Esperado

1. **Clique no nome do usuário** -> Abre página com todas as métricas detalhadas
2. **Painel principal** -> Mostra cards de Premium (Total, Taxa Conversão, Média dias)
3. **Dados em tempo real** -> Todas as métricas são calculadas com dados atualizados do Supabase
