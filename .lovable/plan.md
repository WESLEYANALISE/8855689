
# Plano: Igualar a Trilha "Jornada de Estudos" ao Estilo da "Jornada OAB"

## Diferenças Identificadas

| Aspecto | Jornada OAB ✅ | Jornada Estudos ❌ |
|---------|---------------|-------------------|
| **Linha central** | `w-0.5` (2px - fina) | `w-1` (4px - grossa) |
| **Cor da linha** | `bg-gradient-to-b from-red-900/50 via-red-800/50 to-amber-900/50` | Gradiente âmbar sólido |
| **Animação da linha** | CSS `electricFlow` com vermelho/âmbar | Framer-motion simples |
| **Tamanho pegadas** | `p-2` com `w-4 h-4` ícone (menores) | `w-10 h-10` (maiores) |
| **Animação pegadas** | CSS `footprintPulse` + `animate-ping` | Framer-motion scale/shadow |
| **Estilo pegadas** | `ring-4 ring-background` (borda do fundo) | `boxShadow` glow colorido |

## Mudanças no Arquivo

**Arquivo:** `src/components/mobile/MobileTrilhasAprender.tsx`

### 1. Linha Central - Tornar Mais Fina
```tsx
// De:
<div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
  <div className="w-full h-full bg-gradient-to-b from-amber-500/80 via-amber-600/60 to-amber-700/40 rounded-full" />
  <motion.div ... />
</div>

// Para (igual OAB):
<div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-900/50 via-amber-800/50 to-amber-700/50 transform -translate-x-1/2" />
<div className="absolute left-1/2 top-0 bottom-0 w-0.5 transform -translate-x-1/2 overflow-hidden">
  <div 
    className="absolute inset-0 w-full"
    style={{
      background: 'linear-gradient(to bottom, transparent, #f59e0b, #fbbf24, transparent)',
      backgroundSize: '100% 200%',
      animation: 'electricFlow 2s ease-in-out infinite',
    }}
  />
</div>
```

### 2. Marcadores de Pegada - Menores e Estilo OAB
```tsx
// De:
<motion.div
  animate={{ scale: [1, 1.15, 1], boxShadow: [...] }}
  className="w-10 h-10 rounded-full ..."
>
  <Footprints className="w-5 h-5 text-white" />
</motion.div>

// Para (igual OAB):
<div 
  className="absolute left-1/2 transform -translate-x-1/2 z-10"
  style={{ animation: `footprintPulse 2s ease-in-out infinite ${index * 0.3}s` }}
>
  <div 
    className="rounded-full p-2 shadow-lg ring-4 ring-background relative"
    style={{ backgroundColor: trilha.color }}
  >
    <div 
      className="absolute inset-0 rounded-full animate-ping opacity-30" 
      style={{ backgroundColor: trilha.color, animationDelay: `${index * 0.3}s` }}
    />
    <Footprints className="w-4 h-4 text-white relative z-10" />
  </div>
</div>
```

### 3. Adicionar CSS Keyframes (igual OAB)
```tsx
// Adicionar no final do componente, antes do return ou via <style>:
<style>{`
  @keyframes electricFlow {
    0% { background-position: 100% 0%; opacity: 0.3; }
    50% { opacity: 1; }
    100% { background-position: 100% 100%; opacity: 0.3; }
  }
  @keyframes footprintPulse {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.15); }
  }
`}</style>
```

## Resultado Visual Esperado

- ✅ Linha central **mais fina** (2px em vez de 4px)
- ✅ Animação **"elétrica"** igual à OAB (gradiente fluindo)
- ✅ Marcadores de pegada **menores** com borda ring-background
- ✅ Animação **ping** nos marcadores (pulso de expansão)
- ✅ **Consistência visual** entre as duas trilhas
