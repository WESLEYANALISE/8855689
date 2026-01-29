import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Share2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";

interface ResumoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  titulo: string;
}

export const ResumoVideoModal = ({ open, onOpenChange, videoId, titulo }: ResumoVideoModalProps) => {
  const { toast } = useToast();
  const [resumo, setResumo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const gerarResumo = async () => {
    setLoading(true);
    setProgress(0);
    setProgressMessage("Obtendo transcrição do vídeo...");

    try {
      // Simular progresso realista
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 20) {
            setProgressMessage("Obtendo transcrição do vídeo...");
            return prev + 2;
          } else if (prev < 40) {
            setProgressMessage("Processando legendas...");
            return prev + 1.5;
          } else if (prev < 90) {
            setProgressMessage("Gerando resumo com IA...");
            return prev + 1;
          } else if (prev < 98) {
            setProgressMessage("Finalizando...");
            return prev + 0.5;
          }
          return prev;
        });
      }, 300);

      const { data, error } = await supabase.functions.invoke("gerar-resumo-video", {
        body: { videoId, titulo },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setProgress(100);
      setProgressMessage("Concluído!");
      
      setTimeout(() => {
        setResumo(data.resumo);
        toast({
          title: "Resumo gerado!",
          description: "O resumo da aula foi gerado com sucesso.",
        });
      }, 500);
    } catch (error) {
      console.error("Erro ao gerar resumo:", error);
      toast({
        title: "Erro ao gerar resumo",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("exportar-resumo-pdf", {
        body: { 
          resumo, 
          titulo,
          videoId 
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Abrir PDF em nova aba
      if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        
        toast({
          title: "PDF exportado!",
          description: "Link válido por 24 horas. Abrindo em nova aba...",
        });
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const compartilhar = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Resumo: ${titulo}`,
          text: resumo,
        });
      } else {
        await navigator.clipboard.writeText(resumo);
        toast({
          title: "Copiado!",
          description: "O resumo foi copiado para a área de transferência.",
        });
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  // Gerar resumo ao abrir o modal
  useEffect(() => {
    if (open && !resumo && !loading) {
      gerarResumo();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Resumo da Aula
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <ContentGenerationLoader 
            message={progressMessage}
            progress={progress}
          />
        ) : resumo ? (
          <>
            <div 
              id="resumo-content" 
              className="prose prose-sm max-w-none dark:prose-invert p-6 bg-muted/30 rounded-lg"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                📚 {titulo}
              </h2>
              <ReactMarkdown>{resumo}</ReactMarkdown>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={exportarPDF}
                disabled={exporting}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                {exporting ? "Gerando PDF..." : "Exportar PDF ABNT"}
              </Button>
              <Button
                onClick={compartilhar}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
