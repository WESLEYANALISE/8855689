
# Plano: Alinhar Trilhas de Conceitos com OAB Trilhas

## Diagnóstico

Após análise detalhada do código, identifiquei as seguintes diferenças entre o sistema de geração de conteúdo de **Conceitos** e **OAB Trilhas**:

### Diferenças no Prompt de Geração

| Aspecto | Conceitos (Atual) | OAB Trilhas (Desejado) |
|---------|------------------|----------------------|
| **Introdução** | 400-600 palavras | 300-500 palavras (mais concisa) |
| **Tom de escrita** | Profissional/didático | Conversacional ("como se estivesse tomando café com um amigo") |
| **Desmembrando** | "Divida em partes menores" (genérico) | Análise detalhada com significado, temas, pronúncia, elementos explicativos |
| **Quadro Comparativo** | Prompt básico de tabela | Prompt detalhado com formato visual específico |
| **Correspondências (Ligar Termos)** | Gerado separadamente nos "extras" | Integrado como página 7 com dados para jogo interativo |

### Diferenças na Interface

| Aspecto | Conceitos (Atual) | OAB Trilhas (Desejado) |
|---------|------------------|----------------------|
| **Barra de progresso de leitura** | Não existe | Barra no topo que progride conforme scroll |
| **Título da página** | "Página 1" | Título da seção real |
| **Quadro Comparativo Visual** | Renderiza markdown simples | Componente `QuadroComparativoVisual` interativo |
| **Ligar Termos** | Não renderiza o jogo | Componente `DragDropMatchingGame` interativo |

## Alterações Necessárias

### Parte 1: Atualizar Edge Function `gerar-conteudo-conceitos`

Alinhar o prompt com o de OAB Trilhas:

**1.1 Introdução (Página 1)**
```
DE: 400-600 palavras, tom formal
PARA: 300-500 palavras, tom conversacional e acolhedor
```

**1.2 Desmembrando (Página 3)**
```
DE: "Divida o tema em partes menores" (genérico)
PARA: Análise detalhada de cada elemento:
- Significado jurídico do termo
- Origem e evolução histórica
- Pronúncia correta (se aplicável)
- Elementos constitutivos
- Requisitos e características
- Tom: "Olha, isso parece complicado, mas vou te mostrar passo a passo..."
```

**1.3 Quadro Comparativo (Página 5)**
```
DE: "Crie tabelas comparativas" (básico)
PARA: Tabelas estruturadas com:
- Comparação de institutos similares
- Elementos, requisitos, efeitos
- Formato markdown correto para tabelas
```

**1.4 Correspondências (Página 7)**
```
DE: Gerado nos "extras" separadamente
PARA: Página 7 dedicada com instrução breve + dados no campo separado
- Mínimo 8 pares termo/definição
- Dados para o jogo DragDropMatchingGame
```

**1.5 Tom de escrita geral**
```
Adicionar ao prompt as mesmas instruções de estilo conversacional:
- "Olha só, é assim que funciona..."
- "Veja bem, isso é super importante porque..."
- Perguntas retóricas para engajar
- Analogias com situações do dia a dia
```

### Parte 2: Adicionar Barra de Progresso de Leitura no Reader

Criar barra de progresso de scroll no topo da página de leitura:

```text
┌────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░  45%            │ ← Nova barra
├────────────────────────────────────────────────┤
│                                                │
│         Conteúdo da página atual               │
│                                                │
└────────────────────────────────────────────────┘
```

Implementação:
- Adicionar `useEffect` para monitorar scroll da página
- Calcular porcentagem de scroll (`scrollY / (scrollHeight - clientHeight) * 100`)
- Renderizar barra sticky no topo com gradiente vermelho/laranja

### Parte 3: Garantir Renderização de Quadro Comparativo Visual

O componente `QuadroComparativoVisual` já é usado no OABTrilhasReader. Verificar que:
- A detecção de tipo `quadro_comparativo` está funcionando
- A função `extrairTabelaDoMarkdown` está parseando corretamente
- O componente está sendo renderizado ao invés de markdown simples

### Parte 4: Garantir Funcionamento do Jogo Ligar Termos

Verificar que:
- As correspondências estão sendo extraídas do campo `termos.correspondencias`
- A página de correspondências está sendo detectada pelo tipo
- O componente `DragDropMatchingGame` está recebendo os dados corretos

## Arquivos a Serem Alterados

1. **`supabase/functions/gerar-conteudo-conceitos/index.ts`**
   - Atualizar `PAGINAS_CONFIG` com prompts alinhados ao OAB Trilhas
   - Adicionar instruções de tom conversacional no `promptBase`
   - Garantir que correspondências são geradas corretamente

2. **`src/components/oab/OABTrilhasReader.tsx`**
   - Adicionar barra de progresso de leitura (scroll) no topo
   - Criar state para `scrollProgress`
   - Adicionar `useEffect` com event listener de scroll

## Detalhes Técnicos

### Nova Barra de Progresso de Scroll

```tsx
// Estado
const [scrollProgress, setScrollProgress] = useState(0);

// Efeito para monitorar scroll
useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Renderização (no topo da tela de leitura)
<div className="fixed top-[header-height] left-0 right-0 h-1 bg-white/10 z-40">
  <div 
    className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
    style={{ width: `${scrollProgress}%` }}
  />
</div>
```

### Prompts Alinhados

**Introdução:**
```
Escreva uma introdução clara de 300-500 palavras.
Tom acolhedor e motivador.
Comece com algo engajador: "Vamos falar sobre um tema super importante..."
Contextualize a importância de forma natural.
```

**Desmembrando:**
```
Análise detalhada de cada elemento importante:
- Significado jurídico preciso
- Etimologia e origem do termo
- Pronúncia correta (quando relevante)
- Elementos constitutivos
- Requisitos e características
- Natureza jurídica
Tom: "Olha, isso parece complicado, mas vou te mostrar passo a passo..."
Use exemplos para clarificar cada elemento.
```

**Quadro Comparativo:**
```
Crie tabelas comparativas dos principais institutos:
- Compare elementos, requisitos, efeitos
- Use formato Markdown de tabela correto
- Mínimo 2 tabelas relevantes

| Aspecto | Instituto A | Instituto B |
|---------|-------------|-------------|
| Definição | ... | ... |
| Requisitos | ... | ... |
```

## Resultado Esperado

Após as alterações:
- Introdução mais concisa e acolhedora (300-500 palavras)
- Barra de progresso de leitura visível no topo ao rolar
- Seção "Desmembrando" com análise detalhada (significado, etimologia, pronúncia, etc)
- Quadros comparativos visuais interativos
- Jogo "Ligar Termos" funcionando com as correspondências corretas
