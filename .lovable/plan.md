
# Plano: Cards de Perfil com 4 Opções no Onboarding + Atualizações no Admin

## Visão Geral

Vou redesenhar a tela de seleção de objetivo (Onboarding) para mostrar 4 cards animados em um layout 2x2, com imagens elegantes representando cada perfil. Também atualizarei o banco de dados, hooks e admin para refletir as novas categorias.

---

## Mudanças Visuais

### Layout dos 4 Cards (2x2)

```text
+--------------------------------------------------+
|           Qual é o seu objetivo?                 |
+--------------------------------------------------+
|  +----------------------+  +-------------------+ |
|  |    UNIVERSITÁRIO     |  |    CONCURSEIRO    | |
|  |    [Imagem Elegante] |  |  [Imagem Elegante]| |
|  |    📚 Cursando       |  |  🎯 Estudando     | |
|  |    Faculdade         |  |  para Concursos   | |
|  +----------------------+  +-------------------+ |
|                                                  |
|  +----------------------+  +-------------------+ |
|  |        OAB           |  |     ADVOGADO      | |
|  |  [Imagem Elegante]   |  |  [Imagem Elegante]| |
|  |  ⚖️ Preparando-se    |  |  👔 Atuando       | |
|  |  para o Exame        |  |  Profissionalmente| |
|  +----------------------+  +-------------------+ |
+--------------------------------------------------+
```

### Animações

- Cards aparecem com animação `staggered` (um após o outro com delay de 100ms)
- Efeito `scale` e `glow` no hover
- Checkmark animado ao selecionar
- Transição suave entre estados
- Toda a área do card é clicável

### Imagens

Vou usar imagens de alta qualidade do Unsplash que representam cada perfil:

| Perfil | Conceito da Imagem |
|--------|-------------------|
| Universitário | Estudante jovem em biblioteca universitária moderna |
| Concurseiro | Pessoa focada estudando com livros e anotações |
| OAB | Pessoa determinada em ambiente de preparação jurídica |
| Advogado | Profissional elegante em escritório de advocacia |

---

## Alterações Técnicas

### 1. Migração do Banco de Dados

Atualizar a constraint `profiles_intencao_check` para incluir `universitario`:

```sql
ALTER TABLE profiles DROP CONSTRAINT profiles_intencao_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_intencao_check 
  CHECK (intencao = ANY (ARRAY['universitario', 'concurseiro', 'oab', 'advogado']::text[]));
```

### 2. Onboarding.tsx

Novo array de intenções com 4 opções:

```typescript
const INTENCOES = [
  {
    value: 'universitario',
    label: 'Universitário',
    description: 'Cursando Faculdade de Direito',
    icon: GraduationCap,
    image: 'https://images.unsplash.com/...',
  },
  {
    value: 'concurseiro',
    label: 'Concurseiro',
    description: 'Estudando para Concursos Públicos',
    icon: Target,
    image: 'https://images.unsplash.com/...',
  },
  {
    value: 'oab',
    label: 'OAB',
    description: 'Preparando-se para o Exame da OAB',
    icon: Scale,
    image: 'https://images.unsplash.com/...',
  },
  {
    value: 'advogado',
    label: 'Advogado',
    description: 'Atuando Profissionalmente',
    icon: Briefcase,
    image: 'https://images.unsplash.com/...',
  },
];
```

Layout grid responsivo:

```tsx
<div className="grid grid-cols-2 gap-4">
  {INTENCOES.map((item, index) => (
    <motion.button
      key={item.value}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(var(--primary), 0.3)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => setIntencao(item.value)}
      className={`relative overflow-hidden rounded-xl aspect-square ...`}
    >
      {/* Imagem de fundo */}
      <img src={item.image} className="absolute inset-0 object-cover" />
      
      {/* Overlay com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Conteúdo */}
      <div className="absolute bottom-0 p-4">
        <Icon className="w-6 h-6 text-primary mb-2" />
        <h3 className="font-bold text-white">{item.label}</h3>
        <p className="text-white/70 text-sm">{item.description}</p>
      </div>
      
      {/* Checkmark animado */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 bg-primary rounded-full p-1"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.button>
  ))}
</div>
```

### 3. useAdminControleStats.ts

Atualizar interface e lógica para 4 categorias:

```typescript
interface DistribuicaoIntencoes {
  Universitario: number;
  Concurseiro: number;
  OAB: number;
  Advogado: number;
  Outro: number;
}

// Lógica de categorização
if (intencao === 'universitario' || intencao.includes('estudante')) {
  distribuicao.Universitario++;
} else if (intencao === 'concurseiro') {
  distribuicao.Concurseiro++;
} else if (intencao === 'oab') {
  distribuicao.OAB++;
} else if (intencao === 'advogado') {
  distribuicao.Advogado++;
} else {
  distribuicao.Outro++;
}
```

### 4. AdminControle.tsx

Atualizar exibição das intenções com as 4 categorias:

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span>🎓 Universitário</span>
    <span>{intencoes.Universitario} ({percentage}%)</span>
  </div>
  <Progress value={percentage} className="h-2" />
</div>
{/* + Concurseiro, OAB, Advogado */}
```

### 5. AdminUsuarioDetalhes.tsx

Atualizar badges para mostrar as novas categorias com emojis:

```typescript
const getIntencaoEmoji = (intencao: string) => {
  switch(intencao) {
    case 'universitario': return '🎓';
    case 'concurseiro': return '🎯';
    case 'oab': return '⚖️';
    case 'advogado': return '👔';
    default: return '📚';
  }
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/[timestamp].sql` | Atualizar constraint de intencao |
| `src/pages/Onboarding.tsx` | Redesenhar com 4 cards animados + imagens |
| `src/hooks/useAdminControleStats.ts` | Adicionar categoria Universitario e Concurseiro |
| `src/pages/Admin/AdminControle.tsx` | Exibir 4 categorias de intenção + ajustar cálculos |
| `src/pages/Admin/AdminUsuarioDetalhes.tsx` | Mapear novas intenções com emojis |

---

## Imagens Elegantes Propostas

Vou selecionar imagens do Unsplash com tons profissionais/jurídicos:

- **Universitário**: Jovem em biblioteca universitária com livros de direito
- **Concurseiro**: Mesa de estudos organizada com materiais de concurso
- **OAB**: Pessoa confiante estudando código jurídico
- **Advogado**: Profissional em escritório moderno com livros de direito ao fundo

---

## Resultado Esperado

1. Tela de onboarding com 4 cards visuais elegantes (2x2)
2. Animações suaves e feedback visual ao selecionar
3. Banco de dados aceita os 4 valores
4. Painel admin mostra distribuição das 4 intenções
5. Detalhes do usuário exibem a intenção com emoji correspondente
