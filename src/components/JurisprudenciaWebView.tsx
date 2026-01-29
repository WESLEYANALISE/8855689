import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JurisprudenciaWebView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const link = searchParams.get("link");
  const titulo = searchParams.get("titulo");
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!link) {
      navigate(-1);
    }
  }, [link, navigate]);

  const handleClose = () => {
    navigate(-1);
  };

  // Quando o iframe carregar, tenta scrollar para mostrar o conteúdo
  const handleIframeLoad = () => {
    setLoading(false);
    
    // Aguarda um pouco e tenta scrollar o iframe para baixo
    setTimeout(() => {
      try {
        if (iframeRef.current?.contentWindow) {
          // Scroll para baixo para pular o header do site original
          iframeRef.current.contentWindow.scrollTo(0, 180);
        }
      } catch (e) {
        // Cross-origin pode bloquear, então ignoramos
        console.log('Não foi possível scrollar iframe (cross-origin)');
      }
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header minimalista com apenas o título e botão fechar */}
      <div className="sticky top-0 bg-card border-b px-4 py-3 flex items-center justify-between z-10">
        <span className="font-semibold text-sm">
          {titulo || "Jurisprudência"}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClose} 
          className="shrink-0 h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* WebView (iframe) - ocupa toda a tela sem footer */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={link || ""}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          title={titulo || "Jurisprudência"}
        />
      </div>
    </div>
  );
}
