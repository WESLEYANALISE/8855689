import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QuizViewer } from "@/components/QuizViewer";

interface ChatQuestoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const ChatQuestoesModal = ({ isOpen, onClose, content }: ChatQuestoesModalProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const gerarQuestoes = async () => {
    if (hasGenerated) return;
    
    setLoading(true);
    setProgress(0);
    setProgressMessage("Iniciando...");
    setQuestions([]);
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
            setProgressMessage("Criando questões...");
          } else if (currentProgress < 75) {
            setProgressMessage("Elaborando alternativas...");
          } else {
            setProgressMessage("🎉 Quase pronto!");
          }
        }
      }, 300);
    };
    
    try {
      startProgressAnimation();
      
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-questoes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
          },
          body: JSON.stringify({
            content: content,
            tipo: 'chat' // Indica que vem do chat, não de artigo específico
          })
        }
      );

      if (!response.ok) {
        throw new Error('Falha na requisição');
      }

      if (progressInterval) clearInterval(progressInterval);
      setProgress(95);

      const text = await response.text();
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanedText);
      
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setProgress(100);
        
        toast({
          title: "Sucesso!",
          description: "Questões geradas com sucesso"
        });
      } else {
        throw new Error('Formato de resposta inválido');
      }
      
    } catch (error) {
      console.error("Erro ao gerar questões:", error);
      if (progressInterval) clearInterval(progressInterval);
      toast({
        title: "Erro",
        description: "Não foi possível gerar as questões. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleClose = () => {
    setHasGenerated(false);
    setQuestions([]);
    setProgress(0);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  if (isOpen && !hasGenerated && !loading) {
    gerarQuestoes();
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-accent">📝 Questões de Prova</h2>
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
                <p className="text-base font-semibold mb-1">Gerando questões...</p>
                <p className="text-xs text-muted-foreground">{progressMessage}</p>
              </div>
            </div>
          ) : questions.length > 0 ? (
            <QuizViewer questions={questions} />
          ) : (
            <div className="text-center text-muted-foreground py-12 px-6">
              Nenhuma questão gerada.
            </div>
          )}
        </div>

        {!loading && questions.length > 0 && (
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

export default ChatQuestoesModal;
