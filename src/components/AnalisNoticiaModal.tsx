import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, ExternalLink, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalisNoticiaModalProps {
  open: boolean;
  onClose: () => void;
  noticiaLink: string;
  noticiaId?: string;
}

const AnalisNoticiaModal = ({ open, onClose, noticiaLink, noticiaId }: AnalisNoticiaModalProps) => {
  const [analise, setAnalise] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      buscarAnalise();
    }
  }, [open, noticiaLink]);

  const buscarAnalise = async () => {
    setLoading(true);
    try {
      // Buscar análise pré-gerada no cache
      const { data: noticiaCache, error } = await supabase
        .from('noticias_juridicas_cache')
        .select('analise_ia, titulo')
        .eq('link', noticiaLink)
        .single();

      if (error) {
        console.error('Erro ao buscar análise:', error);
        // Não gerar nova análise se não estiver no cache
        toast.error('Análise não disponível para esta notícia');
        setAnalise(null);
      } else if (noticiaCache?.analise_ia) {
        setAnalise(noticiaCache.analise_ia);
      } else {
        toast.info('Esta notícia ainda não possui análise');
        setAnalise(null);
      }
    } catch (err) {
      console.error('Erro ao buscar análise:', err);
      toast.error('Erro ao carregar análise');
      setAnalise(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-accent" />
            Análise Jurídica IA
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-muted-foreground">Carregando análise...</p>
            </div>
          ) : analise ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analise}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Análise não disponível para esta notícia.
              </p>
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => window.open(noticiaLink, '_blank')}
            variant="outline"
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Notícia Original
          </Button>
          <Button onClick={onClose} className="flex-1">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnalisNoticiaModal;
