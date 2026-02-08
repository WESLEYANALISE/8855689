
# Plano: Painel Controle para Administrador

## Objetivo

Criar uma nova página administrativa chamada **"Controle"** visível apenas para o admin (wn7corporation@gmail.com) no menu lateral, que apresenta:

1. **Lista de novos usuários** cadastrados em tempo real com horário
2. **Páginas mais acessadas** pelos usuários
3. **Funções mais utilizadas**
4. **Termos mais pesquisados**
5. **Tempo médio de sessão** (estimado)
6. **Estatísticas gerais** (usuários por dia, por dispositivo, por intenção)

---

## Arquitetura da Solução

### 1. Nova Tabela no Banco de Dados

Criar tabela `page_views` para rastrear navegação:

```sql
CREATE TABLE page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX idx_page_views_page_path ON page_views(page_path);
```

### 2. Hook de Rastreamento Global

Criar `usePageTracking` para registrar navegação automaticamente:

```typescript
// src/hooks/usePageTracking.ts
export const usePageTracking = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    registrarVisitaPagina(pathname, user?.id);
  }, [pathname, user?.id]);
};
```

### 3. Nova Página Admin "Controle"

**Arquivo:** `src/pages/Admin/AdminControle.tsx`

**Seções:**

| Seção | Descrição | Fonte de Dados |
|-------|-----------|----------------|
| Novos Cadastros | Lista em tempo real de novos usuários | `profiles` ORDER BY created_at DESC |
| Páginas Mais Acessadas | Ranking de rotas visitadas | `page_views` GROUP BY page_path |
| Funções Populares | Features mais usadas | `page_views` filtrado por categoria |
| Termos Pesquisados | Buscas mais frequentes | `cache_pesquisas` |
| Dispositivos | Distribuição mobile/desktop/iOS | `profiles.device_info` |
| Intenções | Estudante/OAB/Advogado | `profiles.intencao` |

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Admin/AdminControle.tsx` | Página principal do Controle |
| `src/hooks/usePageTracking.ts` | Hook para rastrear navegação |
| `src/hooks/useAdminControleStats.ts` | Hook para buscar estatísticas |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/AppSidebar.tsx` | Adicionar "Controle" na seção Administração |
| `src/pages/Admin/AdminHub.tsx` | Adicionar card "Controle" |
| `src/App.tsx` | Adicionar rota `/admin/controle` |

---

## Design da Interface

### Header
- Título "Controle" com ícone Activity
- Subtítulo com total de usuários e "online" estimado

### Cards de Estatísticas (Grid 2x3)
```text
┌──────────────────┬──────────────────┬──────────────────┐
│  Novos Hoje      │  Total Usuários  │  Ativos Semana   │
│     38           │      456         │      180         │
└──────────────────┴──────────────────┴──────────────────┘
```

### Lista de Novos Usuários
```text
┌─────────────────────────────────────────────────────────────┐
│ 🟢 genival da silva costa                                   │
│    genivalcosta879@gmail.com                                │
│    📱 Android 15 - SM-A055M    •    🕐 Há 5 minutos         │
├─────────────────────────────────────────────────────────────┤
│ 🟢 Shara Guimarães                                          │
│    sharasimy@gmail.com                                      │
│    📱 iOS 17.6 - iPhone        •    🕐 Há 10 minutos        │
└─────────────────────────────────────────────────────────────┘
```

### Abas de Análise
- **Páginas**: Ranking de rotas mais visitadas
- **Buscas**: Termos mais pesquisados
- **Dispositivos**: Gráfico de pizza mobile/desktop
- **Intenções**: Gráfico estudante/OAB/advogado

---

## Dados Utilizados (Existentes)

| Tabela | Uso |
|--------|-----|
| `profiles` | Novos usuários, device_info, intencao |
| `cache_pesquisas` | Termos pesquisados |
| `bibliotecas_acessos` | Acessos a bibliotecas |
| `resumos_acessos` | Acessos a resumos |
| `plan_click_analytics` | Interações com planos |

---

## Seção Técnica

### Integração com Sidebar

```typescript
// AppSidebar.tsx - Adicionar no array da seção Administração
{
  title: "Controle",
  icon: Activity,
  path: "/admin/controle"
}
```

### Query para Novos Usuários

```typescript
const { data: novosUsuarios } = useQuery({
  queryKey: ['admin-controle-novos'],
  queryFn: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nome, email, created_at, dispositivo, device_info, intencao')
      .order('created_at', { ascending: false })
      .limit(50);
    return data;
  },
  refetchInterval: 30000 // Atualiza a cada 30s
});
```

### Query para Páginas Mais Acessadas

```typescript
// Após implementar page_views
const { data: paginasPopulares } = useQuery({
  queryKey: ['admin-controle-paginas'],
  queryFn: async () => {
    const { data } = await supabase
      .from('page_views')
      .select('page_path')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    // Agrupar e contar no frontend
    const contagem = data.reduce((acc, item) => {
      acc[item.page_path] = (acc[item.page_path] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(contagem)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
});
```

### Estimativa de "Online"

Considerar usuários ativos nos últimos 5 minutos baseado em `page_views.created_at`.

---

## Correção do Erro de Build

Antes de implementar, corrigir erro de tipo no arquivo `src/pages/Assinatura.tsx`:

O arquivo `Assinatura.tsx` precisa ser verificado pois o build está falhando. O erro parece estar relacionado ao tamanho do bundle (build truncado).

---

## Resumo da Implementação

### Fase 1: Correção de Build
- Verificar e corrigir erros de compilação

### Fase 2: Tabela de Tracking
- Criar tabela `page_views`
- Criar hook `usePageTracking`
- Integrar no App.tsx

### Fase 3: Página de Controle
- Criar `AdminControle.tsx`
- Criar `useAdminControleStats.ts`
- Adicionar ao Sidebar e rotas

### Fase 4: Refinamentos
- Auto-refresh a cada 30s
- Filtros por período
- Exportação de dados

---

## Impacto Esperado

| Antes | Depois |
|-------|--------|
| Sem visibilidade de navegação | Dashboard completo de uso |
| Verificar usuários manualmente | Lista em tempo real |
| Não sabe o que pesquisam | Top buscas visível |
| Desconhece páginas populares | Ranking de navegação |
