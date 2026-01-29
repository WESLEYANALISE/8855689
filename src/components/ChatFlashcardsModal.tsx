import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { supabase } from "@/integrations/supabase/client";

interface ChatFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

interface Flashcard {
  front: string;
  back: string;
}

const ChatFlashcardsModal = ({ isOpen, onClose, content }: ChatFlashcardsModalProps) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const gerarFlashcards = async () => {
    if (hasGenerated) return;
    
    setLoading(true);
    setProgress(0);
    setProgressMessage("Iniciando...");
    setFlashcards([]);
    setHasGenerated(true);
    
    let progressInterval: number | undefined;
    let currentProgress = 0;
    
    const startProgressAnimation = () => {
      progressInterval = window.setInterval(() => {
        if (currentProgress < 90) {
          const increment = currentProgress < 30 ? 3 : currentProgress < 60 ? 5 : 4;
          currentProgress = Math.min(90, currentProgress + increment);
          setProgress(Math.round(currentProgress));
          
          if (currentProgress < 25) {
            setProgressMessage("Analisando conteúdo...");
          } else if (currentProgress < 50) {
            setProgressMessage("Criando flashcards...");
          } else if (currentProgress < 75) {
            setProgressMessage("Elaborando perguntas e respostas...");
          } else {
            setProgressMessage("🎉 Quase pronto!");
          }
        }
      }, 300);
    };
    
    try {
      startProgressAnimation();
      
      const { data, error } = await supabase.functions.invoke("gerar-flashcards", {
        body: {
          content: content,
          tipo: 'chat' // Indica que vem do chat, não de artigo específico
        }
      });

      if (error) throw error;

      if (progressInterval) clearInterval(progressInterval);
      setProgress(95);
      
      if (data.flashcards && Array.isArray(data.flashcards)) {
        setFlashcards(data.flashcards);
        setProgress(100);
        
        toast({
          title: "Sucesso!",
          description: "Flashcards gerados com sucesso"
        });
      } else {
        throw new Error('Formato de resposta inválido');
      }
      
    } catch (error) {
      console.error("Erro ao gerar flashcards:", error);
      if (progressInterval) clearInterval(progressInterval);
      toast({
        title: "Erro",
        description: "Não foi possível gerar os flashcards. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleClose = () => {
    setHasGenerated(false);
    setFlashcards([]);
    setProgress(0);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  if (isOpen && !hasGenerated && !loading) {
    gerarFlashcards();
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-accent">🎴 Flashcards</h2>
            <p className="text-sm text-muted-foreground">Material de estudo</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" className="text-secondary" />
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={276.46} strokeDashoffset={276.46 * (1 - progress / 100)} className="text-accent transition-all duration-300" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-accent">{progress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold mb-1">Gerando flashcards...</p>
                <p className="text-xs text-muted-foreground">{progressMessage}</p>
              </div>
            </div>
          ) : flashcards.length > 0 ? (
            <div className="px-6 py-4">
              <FlashcardViewer flashcards={flashcards} />
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 px-6">
              Nenhum flashcard gerado.
            </div>
          )}
        </div>

        {!loading && flashcards.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button onClick={handleClose} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatFlashcardsModal;
