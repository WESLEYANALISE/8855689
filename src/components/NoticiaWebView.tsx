import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NoticiaWebView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const link = searchParams.get("link");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!link) {
      navigate("/");
    }
  }, [link, navigate]);
  return <div className="flex flex-col h-screen bg-background">
      {/* Header com botão voltar */}
      

      {/* WebView (iframe) */}
      <div className="flex-1 relative">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>}
        <iframe src={link || ""} className="w-full h-full border-0" onLoad={() => setLoading(false)} title="Notícia" />
      </div>

      {/* Botão de Análise no rodapé */}
      <div className="sticky bottom-0 bg-card border-t p-4">
        <Button onClick={() => navigate(`/noticia-analise?link=${encodeURIComponent(link || "")}`)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          <Sparkles className="w-4 h-4" />
          Análise com IA
        </Button>
      </div>
    </div>;
}