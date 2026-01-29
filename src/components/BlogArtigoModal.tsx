import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
interface BlogArtigoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numero: number;
  titulo: string;
  capa: string;
  linkOriginal: string;
}
export const BlogArtigoModal = ({
  open,
  onOpenChange,
  numero,
  titulo,
  capa,
  linkOriginal
}: BlogArtigoModalProps) => {
  const [artigo, setArtigo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  useEffect(() => {
    if (open && numero) {
      carregarArtigo();
      // Bloquear scroll do body quando modal abrir
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll quando fechar
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, numero]);
  const carregarArtigo = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('gerar-artigo-blog', {
        body: {
          numero
        }
      });
      if (error) {
        console.error('Erro ao gerar artigo:', error);
        throw error;
      }
      setArtigo(data.artigo);
      setFromCache(data.fromCache);
      if (!data.fromCache) {
        toast.success("Artigo gerado com sucesso!");
      }
    } catch (error) {
      console.error('Erro ao carregar artigo:', error);
      toast.error("Erro ao carregar artigo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold line-clamp-1 flex-1">
            {titulo}
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Capa PRIMEIRO */}
        {capa && <div className="w-full h-80 overflow-hidden rounded-lg mb-8">
            <img src={capa} alt={titulo} className="w-full h-full object-cover" />
          </div>}

        {/* Título DEPOIS da capa */}
        <h2 className="text-4xl font-bold mb-8 leading-tight">{titulo}</h2>

        <div className="space-y-6">
          {loading ? <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando artigo melhorado...</span>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div> : artigo ? <>
              <div className="prose prose-slate prose-lg max-w-none prose-headings:mt-8 prose-headings:mb-4 prose-p:mb-6 prose-p:leading-relaxed prose-ul:my-6 prose-li:my-2 dark:prose-invert px-0 py-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {artigo}
                </ReactMarkdown>
              </div>
              
              {fromCache}

              <div className="flex items-center justify-between pt-6 mt-8 border-t">
                
              </div>
            </> : null}
        </div>
      </div>
    </div>;
};