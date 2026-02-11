import { useState, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Briefcase, Image as ImageIcon, Loader2, Building2, Home, Users } from "lucide-react";

interface SlideExemploComImagemProps {
  conteudo: string;
  contexto?: string;
  titulo?: string;
  imagemUrl?: string;
  onImageGenerated?: (url: string) => void;
  numeroArtigo?: string;
  codigoTabela?: string;
  secaoId?: number;
  slideIndex?: number;
}

export const SlideExemploComImagem = ({ 
  conteudo, 
  contexto, 
  titulo,
  imagemUrl: propImagemUrl,
}: SlideExemploComImagemProps) => {
  const [imagemUrl, setImagemUrl] = useState<string | null>(propImagemUrl || null);
  const [loadingImagem] = useState(false);
  const [imagemError, setImagemError] = useState(false);

  // Get appropriate icon based on context
  const getContextIcon = () => {
    const ctx = contexto?.toLowerCase() || '';
    if (ctx.includes('profissional') || ctx.includes('trabalho') || ctx.includes('empresa')) {
      return Building2;
    }
    if (ctx.includes('cotidiano') || ctx.includes('dia-a-dia') || ctx.includes('casa')) {
      return Home;
    }
    if (ctx.includes('família') || ctx.includes('social')) {
      return Users;
    }
    return Briefcase;
  };

  const ContextIcon = getContextIcon();

  useEffect(() => {
    if (propImagemUrl) {
      setImagemUrl(propImagemUrl);
    }
  }, [propImagemUrl]);

  // Helper to render HTML content safely
  const renderHtmlContent = (content: string) => {
    // Check if content contains HTML tags
    if (/<[^>]+>/.test(content)) {
      return (
        <div 
          className="text-foreground leading-relaxed whitespace-pre-line [&_span]:rounded [&_span]:px-1"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      );
    }
    
    // Split into paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim());
    
    return (
      <div className="space-y-3">
        {paragraphs.map((paragraph, idx) => (
          <p 
            key={idx}
            className="text-foreground leading-relaxed animate-fade-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Context badge */}
      {contexto && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 animate-fade-in">
          <ContextIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">{contexto}</span>
        </div>
      )}

      {/* Illustration Image */}
      <div className="relative rounded-xl overflow-hidden bg-card/50 border border-border/50 animate-fade-in">
        {loadingImagem ? (
          <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-sm text-muted-foreground">Gerando ilustração do exemplo...</span>
          </div>
        ) : imagemUrl ? (
          <img 
            src={imagemUrl} 
            alt={`Ilustração: ${titulo || contexto || 'Exemplo prático'}`}
            className="w-full h-auto object-contain"
            onError={() => setImagemError(true)}
          />
        ) : imagemError ? (
          <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">Ilustração indisponível</span>
          </div>
        ) : (
          <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500/10 to-green-500/10">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-sm text-muted-foreground">Preparando ilustração...</span>
          </div>
        )}
      </div>
      
      {/* Example content */}
      <div className="bg-card/40 rounded-xl p-4 border border-emerald-500/20 animate-fade-in">
        {renderHtmlContent(conteudo)}
      </div>
      
      {/* Example indicator */}
      <div className="flex items-center gap-2 pt-2 text-muted-foreground animate-fade-in">
        <Briefcase className="w-4 h-4" />
        <span className="text-xs">Exemplo prático de aplicação do artigo</span>
      </div>
    </div>
  );
};
