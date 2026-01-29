import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AssistantMessageProps {
  content: string;
  onAskSuggestion?: (suggestion: string) => void;
}

export const AssistantMessage = ({ content, onAskSuggestion }: AssistantMessageProps) => {
  // Processar o conteúdo para identificar blocos especiais
  const processContent = (text: string) => {
    const parts: Array<{ type: 'text' | 'card', content: string, cardType?: string }> = [];
    let suggestions: string[] = [];
    
    // Extrair questões clicáveis primeiro
    const questoesRegex = /\[QUESTOES_CLICAVEIS\]\[(.*?)\]\[\/QUESTOES_CLICAVEIS\]/s;
    const questoesMatch = text.match(questoesRegex);
    
    if (questoesMatch) {
      try {
        suggestions = JSON.parse(questoesMatch[1]);
        // Remover as questões do texto
        text = text.replace(questoesRegex, '');
      } catch (e) {
        console.error('Erro ao parsear questões:', e);
      }
    }
    
    // Regex para capturar blocos especiais
    const cardRegex = /\[(SACOU\?|DICA DE OURO|IMPORTANTE|ATENÇÃO)[^\]]*\](.*?)\[\/\1\]/gs;
    
    let lastIndex = 0;
    let match;
    
    while ((match = cardRegex.exec(text)) !== null) {
      // Texto antes do card
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index).trim();
        if (textContent) {
          parts.push({
            type: 'text',
            content: textContent
          });
        }
      }
      
      // Card
      parts.push({
        type: 'card',
        content: match[2].trim(),
        cardType: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Texto restante
    if (lastIndex < text.length) {
      const textContent = text.slice(lastIndex).trim();
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent
        });
      }
    }
    
    // Se não encontrou nenhum card, retornar todo o texto
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: text
      });
    }
    
    return { parts, suggestions };
  };

  const getCardStyle = (cardType: string) => {
    const styles = {
      'SACOU?': 'bg-blue-500/20 border-blue-500/40 text-blue-100',
      'DICA DE OURO': 'bg-yellow-500/20 border-yellow-500/40 text-yellow-100',
      'IMPORTANTE': 'bg-red-500/20 border-red-500/40 text-red-100',
      'ATENÇÃO': 'bg-orange-500/20 border-orange-500/40 text-orange-100'
    };
    return styles[cardType as keyof typeof styles] || 'bg-secondary/50 border-border/30';
  };

  const getCardIcon = (cardType: string) => {
    const icons = {
      'SACOU?': '💡',
      'DICA DE OURO': '💎',
      'IMPORTANTE': '⚠️',
      'ATENÇÃO': '⚡'
    };
    return icons[cardType as keyof typeof icons] || '';
  };

  const { parts, suggestions } = processContent(content);

  return (
    <div className="space-y-3">
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return (
            <div key={idx} className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground prose-strong:text-foreground prose-strong:font-bold prose-code:text-yellow-500 prose-code:bg-secondary/50 prose-li:text-foreground prose-ul:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.content}
              </ReactMarkdown>
            </div>
          );
        }
        
        return (
          <div
            key={idx}
            className={`rounded-lg px-4 py-3 border-2 ${getCardStyle(part.cardType!)}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0">{getCardIcon(part.cardType!)}</span>
              <div className="prose prose-invert prose-sm max-w-none flex-1 prose-p:my-1 prose-p:leading-relaxed prose-p:text-foreground prose-strong:text-foreground prose-strong:font-bold prose-li:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {part.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        );
      })}
      
      {suggestions && suggestions.length > 0 && onAskSuggestion && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Você também pode perguntar:
          </p>
          <div className="space-y-1.5">
            {suggestions.map((suggestion: string, idx: number) => (
              <button
                key={idx}
                onClick={() => onAskSuggestion(suggestion)}
                className="w-full text-left px-3 py-2 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-all text-xs text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
