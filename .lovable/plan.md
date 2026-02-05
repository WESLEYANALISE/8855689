
# Plano: Adicionar Modo "Selecionar" e Corrigir Tela Preta nos Flashcards

## Problemas Identificados

### 1. Erro de Build
O ícone `RefreshCw` foi removido do componente mas ainda está importado na linha 2, causando erro de build.

### 2. Tela Preta ao Entrar na Área
O problema ocorre porque:
- **Configuração agressiva de cache**: `staleTime: 0`, `gcTime: 0` e `refetchOnMount: 'always'` forçam recarregamento completo a cada navegação
- **Sem cache persistente**: Cada vez que entra na página, busca tudo novamente do zero
- **Loading blocking**: Mostra estado de loading com fundo escuro enquanto busca dados

### 3. Falta Modo "Selecionar"
O toggle atual só tem "Cronológica" e "Alfabética". É necessário adicionar um terceiro modo para seleção múltipla de temas.

---

## Mudanças Propostas

### Arquivo: `src/pages/FlashcardsTemas.tsx`

#### 1. Corrigir Import (remover RefreshCw não usado)
```tsx
// Linha 2 - REMOVER RefreshCw
import { Sparkles, Search, ArrowLeft, BookOpen, FileText, Loader2, Lock, Crown, CheckCircle2, ArrowDownAZ, ListOrdered, CheckSquare } from "lucide-react";
```

#### 2. Adicionar Estado para Modo Selecionar
```tsx
// Após linha 24
const [modo, setModo] = useState<"cronologica" | "alfabetica" | "selecionar">("cronologica");
const [temasSelecionados, setTemasSelecionados] = useState<string[]>([]);
```

#### 3. Otimizar Cache (remover reloads desnecessários)
```tsx
// Alterar configuração do useQuery (linhas 133-140)
staleTime: 1000 * 60 * 5, // 5 minutos de cache
gcTime: 1000 * 60 * 30,   // 30 minutos no garbage collector
refetchOnMount: false,     // Não recarrega se já tem dados
refetchOnWindowFocus: false,
```

#### 4. Adicionar Botão "Selecionar" no Toggle
```tsx
// Adicionar após ToggleGroupItem de "Alfabética" (linha 284)
<ToggleGroupItem 
  value="selecionar" 
  aria-label="Selecionar temas"
  className="text-xs px-3 py-1.5 h-auto data-[state=on]:bg-green-500/20 data-[state=on]:text-green-400 data-[state=on]:shadow-sm text-gray-400"
>
  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
  Selecionar
</ToggleGroupItem>
```

#### 5. Lógica de Seleção de Temas
```tsx
// Função para alternar seleção
const toggleTemaSelecionado = (tema: string) => {
  setTemasSelecionados(prev => 
    prev.includes(tema) 
      ? prev.filter(t => t !== tema)
      : [...prev, tema]
  );
};

// Função para iniciar estudo com temas selecionados
const iniciarEstudoSelecionado = () => {
  if (temasSelecionados.length === 0) {
    toast.error("Selecione pelo menos um tema");
    return;
  }
  // Navega com múltiplos temas
  const temasParam = temasSelecionados.map(t => encodeURIComponent(t)).join(",");
  navigate(`/flashcards/estudar?area=${encodeURIComponent(area)}&temas=${temasParam}`);
};
```

#### 6. UI do Modo Selecionar
- Mostrar checkbox em cada card de tema
- Exibir contador de temas selecionados
- Botão flutuante "Estudar X temas" quando há seleção

```tsx
{/* Barra inferior com botão de estudar (quando em modo selecionar) */}
{modo === "selecionar" && temasSelecionados.length > 0 && (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="fixed bottom-20 left-0 right-0 z-50 px-4"
  >
    <div className="max-w-lg mx-auto">
      <Button 
        onClick={iniciarEstudoSelecionado}
        className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl shadow-lg"
      >
        Estudar {temasSelecionados.length} tema{temasSelecionados.length > 1 ? 's' : ''}
      </Button>
    </div>
  </motion.div>
)}
```

#### 7. Modificar Card de Tema para Modo Selecionar
Quando `modo === "selecionar"`:
- Adicionar checkbox visual no card
- Click seleciona/desseleciona em vez de navegar
- Mostrar estado selecionado com borda verde

---

## Fluxo Visual

```text
┌─────────────────────────────────────┐
│  Modo: [Cronológica][Alfabética][✓ Selecionar]
└─────────────────────────────────────┘
                    │
     Quando "Selecionar" ativo:
                    ▼
┌─────────────────────────────────────┐
│  ☐ Tema 1 - Princípios...           │
│  ☑ Tema 2 - Agentes Públicos        │ ← Selecionado
│  ☑ Tema 3 - Bens Públicos           │ ← Selecionado  
│  ☐ Tema 4 - ...                     │
└─────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────┐
│    [ Estudar 2 temas ]              │ ← Botão flutuante
└─────────────────────────────────────┘
```

---

## Resultado Esperado

1. **Build funciona** - Sem erro de import não utilizado
2. **Navegação instantânea** - Cache otimizado elimina tela preta
3. **Modo Selecionar** - Permite escolher múltiplos temas para estudo combinado
