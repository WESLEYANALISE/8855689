
# Plano: "Online Agora" em Tempo Real + Responsividade dos Cards Premium

## Problema 1: "Online Agora" Mostrando Zero

### Diagnóstico
A métrica "Online Agora" está funcionando corretamente a cada 30 segundos via `refetchInterval`, mas:
- Conta sessões únicas nos últimos 5 minutos via `page_views`
- Se ninguém navegou nos últimos 5 min, mostra 0
- Não é atualização em **tempo real** verdadeiro

### Solução: Supabase Realtime
Implementar Supabase Realtime para escutar inserções na tabela `page_views` e atualizar o contador instantaneamente quando alguém navega.

### Alterações no Hook

```typescript
// useAdminControleStats.ts

// Novo hook para Online em tempo real
export const useOnlineAgoraRealtime = () => {
  const [onlineAgora, setOnlineAgora] = useState(0);
  
  useEffect(() => {
    // Buscar valor inicial
    fetchOnline();
    
    // Escutar novas inserções em tempo real
    const channel = supabase
      .channel('online-agora')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'page_views' },
        () => fetchOnline()
      )
      .subscribe();
    
    // Polling backup a cada 30s
    const interval = setInterval(fetchOnline, 30000);
    
    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  const fetchOnline = async () => {
    const ultimos5Min = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('page_views')
      .select('session_id')
      .gte('created_at', ultimos5Min);
    
    const sessoesUnicas = new Set((data || []).map(d => d.session_id));
    setOnlineAgora(sessoesUnicas.size);
  };
  
  return { onlineAgora, refetch: fetchOnline };
};
```

---

## Problema 2: Cards Premium Não Responsivos

### Diagnóstico
Os cards de Premium usam `grid-cols-3` fixo, o que espreme o conteúdo em telas mobile.

### Solução
Alterar para grid responsivo que empilha em telas pequenas.

### Alteração no AdminControle.tsx

De:
```tsx
<div className="grid grid-cols-3 gap-4">
```

Para:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

Também melhorar o layout interno dos cards para melhor visualização mobile.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useAdminControleStats.ts` | Criar hook `useOnlineAgoraRealtime` com Supabase Realtime |
| `src/pages/Admin/AdminControle.tsx` | Usar novo hook + responsividade dos cards Premium |

---

## Resultado Esperado

1. **Online Agora**: Atualiza instantaneamente quando qualquer usuário navega no app
2. **Cards Premium**: Empilham verticalmente em mobile, lado a lado em telas maiores
