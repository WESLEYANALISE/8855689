import { useCallback, useMemo } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Highlight } from "@/hooks/useArtigoGrifos";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { TextAnnotate, AnnotateTag } from "react-text-annotate-blend";

interface ArticleHighlighterProps {
  content: string;
  highlights: Highlight[];
  isEditing: boolean;
  selectedColor: string;
  onAddHighlight: (start: number, end: number, text: string) => void;
  onRemoveHighlightAtPosition?: (position: number) => void;
  fontSize: number;
  hideAnnotations?: boolean;
}

interface HighlightAnnotation extends AnnotateTag {
  start: number;
  end: number;
  tag: string;
  color: string;
}

export const ArticleHighlighter = ({
  content,
  highlights,
  isEditing,
  selectedColor,
  onAddHighlight,
  onRemoveHighlightAtPosition,
  fontSize,
  hideAnnotations = false
}: ArticleHighlighterProps) => {
  
  // Extrair texto puro do conteúdo HTML
  const plainText = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formatTextWithUppercase(content, hideAnnotations);
    return tempDiv.textContent || tempDiv.innerText || content;
  }, [content, hideAnnotations]);

  // Converter highlights para formato da biblioteca
  const annotationValue: HighlightAnnotation[] = useMemo(() => {
    return highlights.map(h => ({
      start: h.start,
      end: h.end,
      tag: 'highlight',
      color: h.color
    }));
  }, [highlights]);

  // Handler quando uma nova anotação é criada
  const handleChange = useCallback((newValue: HighlightAnnotation[]) => {
    if (!isEditing) return;

    // Verificar se foi adicionado um novo highlight
    if (newValue.length > annotationValue.length) {
      const newAnnotation = newValue.find(
        nv => !annotationValue.some(av => av.start === nv.start && av.end === nv.end)
      );
      
      if (newAnnotation) {
        const text = plainText.slice(newAnnotation.start, newAnnotation.end);
        onAddHighlight(newAnnotation.start, newAnnotation.end, text);
      }
    }
    // Verificar se um highlight foi removido (clicado)
    else if (newValue.length < annotationValue.length && onRemoveHighlightAtPosition) {
      const removedAnnotation = annotationValue.find(
        av => !newValue.some(nv => nv.start === av.start && nv.end === av.end)
      );
      
      if (removedAnnotation) {
        onRemoveHighlightAtPosition(removedAnnotation.start);
      }
    }
  }, [isEditing, annotationValue, plainText, onAddHighlight, onRemoveHighlightAtPosition]);

  // Se não está editando, renderizar apenas com highlights visíveis (sem interação)
  if (!isEditing) {
    return (
      <div
        className="article-content text-foreground/90 whitespace-pre-line leading-relaxed break-words"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: "1.7",
        }}
      >
        {highlights.length === 0 ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatTextWithUppercase(content, hideAnnotations)) }} />
        ) : (
          <TextAnnotate
            content={plainText}
            value={annotationValue}
            onChange={() => {}}
            style={{ lineHeight: "1.7" }}
            markStyle={{ 
              padding: '0 2px', 
              borderRadius: '2px',
              cursor: 'default'
            }}
          />
        )}
      </div>
    );
  }

  // Modo de edição - permite selecionar e criar novos highlights
  return (
    <div className="relative">
      <div
        className="article-content text-foreground/90 whitespace-pre-line leading-relaxed break-words select-text cursor-text"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: "1.7",
          WebkitUserSelect: 'text',
          userSelect: 'text',
          WebkitTouchCallout: 'default',
        }}
      >
        <TextAnnotate
          content={plainText}
          value={annotationValue}
          onChange={handleChange}
          getSpan={(span) => ({
            ...span,
            tag: 'highlight',
            color: selectedColor,
          })}
          style={{ lineHeight: "1.7" }}
          markStyle={{ 
            padding: '0 2px', 
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        />
      </div>
    </div>
  );
};
