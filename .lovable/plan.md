
# Plano: Melhorias no Chat da Professora

## Resumo das Alterações Solicitadas

1. **Markdown em tempo real durante streaming** (não só no final)
2. **Geração automática de flashcards em segundo plano**
3. **Novo botão flutuante para Tabela Comparativa**
4. **Citações de artigos clicáveis** (Art. X) com popover mostrando artigo completo
5. **Renomear "Conclusão" para "Síntese Final"**

---

## 1. Markdown em Tempo Real Durante Streaming

### Problema Atual
O arquivo `ChatMessageNew.tsx` (linhas 773-789) mostra texto simples durante streaming e só renderiza Markdown após conclusão:

```tsx
{isStreaming ? (
  // Durante streaming: texto simples + cursor piscante
  <div className="whitespace-pre-wrap break-words">
    {formattedContent}
    <span className="animate-pulse" />
  </div>
) : (
  renderMarkdownContent(formattedContent)
)}
```

### Solução
Renderizar Markdown em tempo real usando `ReactMarkdown` leve, sem processamentos pesados como detecção de termos ou tabelas visuais:

```tsx
// Durante streaming: Markdown leve + cursor
{isStreaming ? (
  <div className="streaming-content">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {formattedContent}
    </ReactMarkdown>
    <span className="inline-block w-1.5 h-5 bg-primary/70 animate-pulse" />
  </div>
) : (
  renderContentWithTables(formattedContent)
)}
```

### Arquivo a Modificar
- `src/components/chat/ChatMessageNew.tsx` (linhas 773-789)

---

## 2. Geração Automática de Flashcards em Segundo Plano

### Problema Atual
Flashcards só são gerados quando o usuário clica no botão flutuante, causando espera.

### Solução
Iniciar geração de flashcards assim que o streaming terminar, usando estado `preloadedFlashcards`:

**Arquivo: `src/components/chat/FloatingFlashcardsButton.tsx`**

```tsx
interface FloatingFlashcardsButtonProps {
  isVisible: boolean;
  lastAssistantMessage: string;
  messageCount?: number;
}

// Novo: Estado para flashcards pré-carregados
const [preloadedFlashcards, setPreloadedFlashcards] = useState<Flashcard[]>([]);
const [isPreloading, setIsPreloading] = useState(false);

// Gerar flashcards automaticamente quando mensagem finaliza
useEffect(() => {
  if (isVisible && lastAssistantMessage && lastAssistantMessage.length > 200) {
    generateFlashcardsInBackground();
  }
}, [isVisible, lastAssistantMessage]);

const generateFlashcardsInBackground = async () => {
  setIsPreloading(true);
  try {
    const { data } = await supabase.functions.invoke("gerar-flashcards", {
      body: { content: lastAssistantMessage, tipo: 'chat' }
    });
    if (data?.flashcards) {
      setPreloadedFlashcards(data.flashcards);
    }
  } finally {
    setIsPreloading(false);
  }
};
```

**Arquivo: `src/components/ChatFlashcardsModal.tsx`**
- Aceitar `preloadedFlashcards` como prop opcional
- Se já existirem flashcards pré-carregados, exibir imediatamente sem loading

### Arquivos a Modificar
- `src/components/chat/FloatingFlashcardsButton.tsx`
- `src/components/ChatFlashcardsModal.tsx`

---

## 3. Novo Botão Flutuante para Tabela Comparativa

### Solução
Criar componente `FloatingComparativeButton.tsx` similar ao `FloatingFlashcardsButton`:

```tsx
// Posição: acima do botão de flashcards (top-1/2 -translate-y-[120px])
<motion.button
  className="fixed right-0 top-1/2 -translate-y-[120px] z-40 h-14 w-14 rounded-l-2xl bg-gradient-to-br from-cyan-400 to-blue-500"
  onClick={() => setIsModalOpen(true)}
>
  <TableIcon className="w-6 h-6 text-white" />
  <span className="text-[10px]">Tabela</span>
</motion.button>
```

**Modal de Tabela Comparativa:**
- Gerar tabela comparativa via edge function quando aberto
- Exibir usando `QuadroComparativoVisual`

### Arquivos a Criar
- `src/components/chat/FloatingComparativeButton.tsx`
- `src/components/ChatComparativoModal.tsx`

### Arquivo a Modificar
- `src/pages/ChatProfessora.tsx` (adicionar novo botão flutuante)

---

## 4. Citações de Artigos Clicáveis com Popover

### Solução
Integrar `ArtigoPopover` (já existente em `src/components/conceitos/ArtigoPopover.tsx`) no `ChatMessageNew.tsx`.

**Lógica de detecção de artigos:**
```tsx
// Regex para detectar Art. X, § Y, inciso Z
const ARTIGO_REGEX = /(?:Art\.?\s*\d+[º°]?(?:\s*,?\s*(?:§|parágrafo)\s*\d+[º°]?)?(?:\s*,?\s*inciso\s+[IVXLCDM]+)?)/gi;

// No renderMarkdownContent, interceptar textos com artigos:
p: ({ children }) => {
  const text = String(children);
  const processedChildren = processArtigoReferences(text, children);
  return <p className="mb-3">{processedChildren}</p>;
};

// Função para processar referências a artigos
const processArtigoReferences = (text: string, children: React.ReactNode) => {
  const matches = text.matchAll(ARTIGO_REGEX);
  // Para cada match, envolver com ArtigoPopover
  return (
    <>
      {beforeMatch}
      <ArtigoPopover artigo={matchedArtigo}>
        {matchedArtigo}
      </ArtigoPopover>
      {afterMatch}
    </>
  );
};
```

**Estilização do artigo destacado:**
```tsx
// ArtigoPopover já tem estilo âmbar:
<span className="text-amber-400 hover:text-amber-300 cursor-pointer underline decoration-amber-500/50">
  {children}
</span>
```

### Arquivo a Modificar
- `src/components/chat/ChatMessageNew.tsx` (importar e usar ArtigoPopover)

---

## 5. Renomear "Conclusão" para "Síntese Final"

### Arquivos a Modificar

Busca encontrou 24 arquivos com "Conclusão". Os principais são:

1. **`src/components/conceitos/ConceitosReader.tsx`** (linha 91, 1058)
   - Alterar `'conclusão'` para `'síntese final'`
   
2. **`src/components/conceitos/ConceitosToolsDrawer.tsx`** (linha 175)
   - Alterar label `"Conclusão"` para `"Síntese Final"`

3. **`src/pages/AprendaSeuJeitoEstudo.tsx`** (linha 243)
   - Alterar `"Conclusão"` para `"Síntese Final"`

4. **`src/pages/ConceitosLivroTema.tsx`** (linha 139)
   - Alterar label `"Conclusão"` para `"Síntese Final"`

5. **Outros arquivos** com referências menores serão atualizados conforme necessário.

---

## Arquitetura dos Botões Flutuantes

```
+------------------------------------------+
|                                          |
|              CHAT AREA                   |
|                                          |
+------------------------------------------+
|                                    [📊]  | ← Tabela Comparativa (NOVO)
|                                    [✨]  | ← Flashcards (existente)
+------------------------------------------+
```

Ambos os botões ficam na lateral direita, empilhados verticalmente.

---

## Arquivos a Criar

1. `src/components/chat/FloatingComparativeButton.tsx` - Botão flutuante de tabela
2. `src/components/ChatComparativoModal.tsx` - Modal para exibir tabela comparativa

## Arquivos a Modificar

1. `src/components/chat/ChatMessageNew.tsx`
   - Markdown em tempo real durante streaming
   - Integrar ArtigoPopover para citações clicáveis

2. `src/components/chat/FloatingFlashcardsButton.tsx`
   - Geração automática em segundo plano

3. `src/components/ChatFlashcardsModal.tsx`
   - Aceitar flashcards pré-carregados

4. `src/pages/ChatProfessora.tsx`
   - Adicionar FloatingComparativeButton

5. `src/components/conceitos/ConceitosReader.tsx`
   - Renomear "Conclusão" → "Síntese Final"

6. `src/components/conceitos/ConceitosToolsDrawer.tsx`
   - Renomear "Conclusão" → "Síntese Final"

7. `src/pages/AprendaSeuJeitoEstudo.tsx`
   - Renomear "Conclusão" → "Síntese Final"

8. `src/pages/ConceitosLivroTema.tsx`
   - Renomear "Conclusão" → "Síntese Final"

---

## Resultado Esperado

- Markdown renderiza em tempo real conforme a professora digita
- Flashcards são gerados automaticamente em segundo plano
- Novo botão flutuante de "Tabela Comparativa" acima dos flashcards
- Citações de artigos (Art. X) aparecem grifadas em âmbar e clicáveis
- Ao clicar em artigo, popover mostra texto completo da lei
- "Conclusão" renomeado para "Síntese Final" em toda a aplicação
