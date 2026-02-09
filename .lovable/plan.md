
# Plano de Correção: Brecha de Pesquisa + Notificações de Admin

## Problema 1: Brecha de Acesso Premium via Pesquisa

### Diagnóstico
A busca global permite que usuários encontrem e acessem diretamente conteúdos premium através das seguintes categorias:
- **Aulas Conceitos** → navega para `/conceitos/topico/{id}`
- **Aulas OAB Trilhas** → navega para `/oab-trilhas/tema/{id}`

Quando o usuário clica no resultado da busca, ele é direcionado diretamente para a página do tópico, **pulando a verificação de acesso** que existe apenas na página da matéria (`ConceitosMateria.tsx`).

### Solução
Adicionar verificação de acesso premium diretamente nas páginas de tópicos individuais:

**Arquivos a modificar:**
1. `src/pages/ConceitosTopicoEstudo.tsx` - Adicionar verificação premium
2. `src/components/pesquisa/ResultadoPreview.tsx` - Interceptar cliques em conteúdo premium
3. `src/hooks/useBuscaGlobal.ts` - Marcar resultados premium na busca

**Abordagem técnica:**
```text
1. No ConceitosTopicoEstudo.tsx:
   - Importar useSubscription
   - Buscar a matéria do tópico para verificar se é gratuita
   - Comparar nome da matéria com lista FREE_MATERIA_NAMES
   - Se não premium e não gratuito → mostrar PremiumUpgradeModal
   
2. No ResultadoPreview.tsx:
   - Adicionar prop opcional "isPremium" no item
   - Se isPremium e usuário não é premium → abrir modal em vez de navegar
   
3. No useBuscaGlobal.ts (categoria aulas-conceitos):
   - Incluir materia.nome na query
   - Marcar item como premium se matéria não for gratuita
```

---

## Problema 2: Notificações de Novos Usuários para Admin

### Diagnóstico
O trigger `notify_admin_new_signup` está configurado para disparar quando:
```sql
IF (OLD.telefone IS NULL OR OLD.telefone = '') 
   AND (NEW.telefone IS NOT NULL AND NEW.telefone != '')
   AND (NEW.intencao IS NOT NULL AND NEW.intencao != '')
```

Porém, o fluxo de Onboarding atual (`src/pages/Onboarding.tsx`) **não coleta telefone** - apenas nome e intenção. Por isso, todos os novos usuários têm `telefone = NULL` e a notificação nunca é disparada.

### Solução
Modificar o trigger para disparar quando **apenas intencao** é preenchida (já que telefone não é mais coletado no onboarding).

**Migração SQL:**
```sql
CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
BEGIN
  -- Notificar quando intencao for preenchida pela primeira vez
  -- (não depender de telefone, pois não é mais coletado no onboarding)
  IF (OLD.intencao IS NULL OR OLD.intencao = '') 
     AND (NEW.intencao IS NOT NULL AND NEW.intencao != '') THEN
    
    payload := jsonb_build_object(
      'tipo', 'novo_cadastro',
      'dados', jsonb_build_object(
        'nome', NEW.nome,
        'email', NEW.email,
        'telefone', NEW.telefone,
        'dispositivo', NEW.dispositivo,
        'area', NEW.intencao,
        'created_at', NEW.created_at,
        'device_info', NEW.device_info
      )
    );

    PERFORM net.http_post(
      url := 'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/notificar-admin-whatsapp',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', '...' -- chave existente
      ),
      body := payload
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Falha ao notificar admin: %', SQLERRM;
  RETURN NEW;
END;
$function$;
```

---

## Detalhes Técnicos de Implementação

### Parte 1: Bloquear acesso na página ConceitosTopicoEstudo

```typescript
// Adicionar no início do componente:
const { isPremium, loading: loadingSubscription } = useSubscription();

// Após buscar o tópico, verificar acesso:
const FREE_MATERIA_NAMES = [
  "história do direito", 
  "historia do direito",
  "introdução ao estudo do direito",
  "introducao ao estudo do direito"
];

const isFreeMateria = topico?.materia?.nome 
  ? FREE_MATERIA_NAMES.includes(topico.materia.nome.toLowerCase().trim())
  : false;

const canAccess = isPremium || isFreeMateria;

// Se não pode acessar, mostrar modal:
if (!loadingSubscription && !canAccess) {
  return (
    <div className="min-h-screen bg-background">
      <StandardPageHeader ... />
      <PremiumUpgradeModal 
        open={true} 
        onOpenChange={() => navigate(-1)}
        featureName="Aulas de Conceitos" 
      />
    </div>
  );
}
```

### Parte 2: Marcar itens premium na busca

No `useBuscaGlobal.ts`, modificar a configuração de `aulas-conceitos`:
```typescript
{
  id: 'aulas-conceitos',
  nome: 'Aulas Conceitos',
  tabelas: [
    { 
      nome: 'conceitos_topicos', 
      colunas: ['titulo'], 
      formatResult: (item) => ({
        id: item.id, 
        titulo: item.titulo, 
        subtitulo: `Conceitos • ${item.materia?.nome || 'Matéria'}`,
        route: `/conceitos/topico/${item.id}`,
        // Marcar como premium se matéria não for gratuita
        isPremium: !FREE_MATERIA_NAMES.includes(
          (item.materia?.nome || '').toLowerCase().trim()
        )
      })
    }
  ]
}
```

### Parte 3: Interceptar clique em itens premium

No `ResultadoPreview.tsx`:
```typescript
const handleClick = () => {
  if (item.isPremium && !isPremium) {
    setShowPremiumModal(true);
    return;
  }
  navigate(item.route);
};
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ConceitosTopicoEstudo.tsx` | Adicionar verificação de acesso premium |
| `src/hooks/useBuscaGlobal.ts` | Incluir flag `isPremium` nos resultados |
| `src/components/pesquisa/ResultadoPreview.tsx` | Interceptar clique em itens premium |
| `supabase/migrations/new_migration.sql` | Atualizar trigger para não depender de telefone |

---

## Resultado Esperado

1. **Pesquisa**: Usuários não-premium verão modal de upgrade ao clicar em resultados de conteúdo premium
2. **Acesso direto**: Se alguém tentar acessar URL premium diretamente, verá modal de bloqueio
3. **Notificações**: Admin receberá notificação WhatsApp quando novo usuário completar onboarding (mesmo sem telefone)
