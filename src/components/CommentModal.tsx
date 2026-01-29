import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: string;
}

export const CommentModal = ({ isOpen, onClose, comment }: CommentModalProps) => {
  if (!isOpen) return null;

  const formatComment = (text: string) => {
    // Split by double line breaks or by specific patterns
    const sections = text.split(/\n\n+/).filter(p => p.trim());
    
    return sections.map((section, index) => {
      const trimmed = section.trim();
      
      // Check for alert blockquotes
      if (trimmed.match(/^(🚨|⚠️|💡|✅|📌|❌)/)) {
        const icon = trimmed.charAt(0);
        const content = trimmed.substring(1).trim();
        let bgColor = "bg-secondary/40";
        let borderColor = "border-accent";
        
        if (icon === "🚨" || content.includes("ATENÇÃO CRÍTICA")) {
          bgColor = "bg-red-500/10";
          borderColor = "border-red-500";
        } else if (icon === "⚠️" || content.includes("IMPORTANTE")) {
          bgColor = "bg-yellow-500/10";
          borderColor = "border-yellow-500";
        } else if (icon === "💡" || content.includes("DICA")) {
          bgColor = "bg-blue-500/10";
          borderColor = "border-blue-500";
        } else if (icon === "✅" || content.includes("BOA PRÁTICA")) {
          bgColor = "bg-green-500/10";
          borderColor = "border-green-500";
        } else if (icon === "📌" || content.includes("LEMBRE-SE")) {
          bgColor = "bg-purple-500/10";
          borderColor = "border-purple-500";
        } else if (icon === "❌" || content.includes("ERRO COMUM")) {
          bgColor = "bg-red-500/10";
          borderColor = "border-red-500";
        }
        
        return (
          <div key={index} className={`border-l-4 ${borderColor} pl-6 pr-4 py-4 my-4 ${bgColor} rounded-r-lg shadow-lg`}>
            <span className="text-2xl mr-2 inline-block align-middle">{icon}</span>
            <span className="text-foreground/95 text-sm leading-relaxed">{content}</span>
          </div>
        );
      }
      
      // Check for headings (all caps followed by colon, or bold markers)
      if (trimmed.match(/^[A-ZÇÃÕÁÉÍÓÚ\s]{3,}:/) || trimmed.match(/^\*\*[^*]+\*\*:?$/)) {
        const cleanHeading = trimmed.replace(/\*\*/g, '').replace(/:$/, '');
        return (
          <h3 key={index} className="text-base font-bold text-foreground mt-6 mb-3 first:mt-0">
            {cleanHeading}
          </h3>
        );
      }
      
      // Check for bullet lists
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^[\-•]/m)) {
        const items = trimmed.split('\n').filter(item => item.trim());
        return (
          <ul key={index} className="space-y-2 my-3 pl-5 list-disc marker:text-accent">
            {items.map((item, i) => (
              <li key={i} className="text-foreground leading-relaxed text-sm">
                {item.replace(/^[•-]\s*/, '')}
              </li>
            ))}
          </ul>
        );
      }
      
      // Check for numbered lists
      if (trimmed.match(/^\d+\./)) {
        const items = trimmed.split('\n').filter(item => item.trim());
        return (
          <ol key={index} className="space-y-2 my-3 pl-5 list-decimal marker:text-accent marker:font-semibold">
            {items.map((item, i) => (
              <li key={i} className="text-foreground leading-relaxed text-sm">
                {item.replace(/^\d+\.\s*/, '')}
              </li>
            ))}
          </ol>
        );
      }
      
      // Regular paragraph with bold support
      const boldText = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
        .replace(/\n/g, '<br />');
      
      return (
        <p 
          key={index} 
          className="text-foreground/90 leading-relaxed text-sm mb-4"
          dangerouslySetInnerHTML={{ __html: boldText }}
        />
      );
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-slide-in-from-bottom"
      onClick={onClose}
    >
      <div 
        className="h-full w-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-full px-4 py-6 sm:px-6 sm:py-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-2xl shadow-lg">
              <div className="sticky top-0 bg-card border-b border-border rounded-t-2xl px-6 py-4 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Comentário da Questão</h2>
                    <p className="text-sm text-muted-foreground">Entenda melhor a resposta correta</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="shrink-0 hover:bg-destructive/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="px-6 py-6">
                <div className="space-y-4">
                  {formatComment(comment)}
                </div>
              </div>

              <div className="sticky bottom-0 bg-card border-t border-border rounded-b-2xl px-6 py-4">
                <Button 
                  onClick={onClose}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
