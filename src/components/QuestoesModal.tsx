import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QuizViewer } from "@/components/QuizViewer";
import { supabase } from "@/integrations/supabase/client";

interface QuestoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
  codigoTabela?: string;
  codigo?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const QuestoesModal = ({ isOpen, onClose, artigo, numeroArtigo, codigoTabela = 'CP - Código Penal', codigo = 'cp' }: QuestoesModalProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const { toast } = useToast();

  const handleScoreChange = useCallback((correct: number, incorrect: number, answered: number) => {
    setCorrectCount(correct);
    setIncorrectCount(incorrect);
    setAnsweredCount(answered);
  }, []);

  const gerarQuestoes = async () => {
    if (hasGenerated) return;
    
    setLoading(true);
    setProgress(0);
    setProgressMessage("Verificando cache...");
    setQuestions([]);
    setHasGenerated(true);
    
    // Verificar cache primeiro
    try {
      const { data: cached, error: cacheError } = await supabase
        .from(codigoTabela as any)
        .select('questoes')
        .eq('Número do Artigo', numeroArtigo)
        .maybeSingle();
      
      if (!cacheError && cached && 'questoes' in cached && cached.questoes && Array.isArray(cached.questoes) && cached.questoes.length > 0) {
        console.log('✅ Questões encontradas no cache');
        setQuestions(cached.questoes);
        setProgress(100);
        setLoading(false);
        return;
      }
    } catch (cacheError) {
      console.log('⚠️ Erro ao verificar cache, gerando novo:', cacheError);
    }
    
    let progressInterval: number | undefined;
    let currentProgress = 0;
    
    const startProgressAnimation = () => {
      progressInterval = window.setInterval(() => {
        if (currentProgress < 90) {
          const increment = currentProgress < 30 ? 3 : currentProgress < 60 ? 5 : 4;
          currentProgress = Math.min(90, currentProgress + increment);
          setProgress(Math.round(currentProgress));
          
          if (currentProgress < 25) {
            setProgressMessage("Analisando artigo...");
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
            artigo: `Art. ${numeroArtigo}\n${artigo}`,
            codigo: codigo,
            numeroArtigo: numeroArtigo
          })
        }
      );

      console.log('🔍 [Debug QuestoesModal]', {
        codigoEnviado: codigo,
        tabelaMapeada: codigoTabela,
        numeroArtigo: numeroArtigo
      });

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
        
        // Salvar questões na tabela
        try {
          const { error: updateError } = await supabase
            .from(codigoTabela as any)
            .update({ 
              questoes: data.questions,
              ultima_atualizacao: new Date().toISOString()
            })
            .eq('Número do Artigo', numeroArtigo);
          
          if (updateError) {
            console.error('Erro ao salvar questões:', updateError);
          }
        } catch (saveError) {
          console.error('Erro ao salvar questões:', saveError);
        }
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

  const handleAttemptClose = () => {
    if (answeredCount > 0 && questions.length > 0) {
      setShowExitConfirm(true);
    } else {
      handleConfirmClose();
    }
  };

  const handleConfirmClose = () => {
    setShowExitConfirm(false);
    setHasGenerated(false);
    setQuestions([]);
    setProgress(0);
    setLoading(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setAnsweredCount(0);
    onClose();
  };

  const handleCancelClose = () => {
    setShowExitConfirm(false);
  };

  // Reset quando artigo mudar
  useEffect(() => {
    if (isOpen) {
      setHasGenerated(false);
      setQuestions([]);
      setProgress(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setAnsweredCount(0);
      setShowExitConfirm(false);
    }
  }, [numeroArtigo, isOpen]);

  if (!isOpen) return null;

  if (isOpen && !hasGenerated && !loading) {
    gerarQuestoes();
  }

  const percentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-2">Finalizar Quiz?</h3>
                <p className="text-muted-foreground text-sm">
                  Você respondeu {answeredCount} de {questions.length} questões
                </p>
              </div>

              {/* Score Summary */}
              <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="text-2xl font-bold">{correctCount}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Acertos</span>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-6 h-6" />
                      <span className="text-2xl font-bold">{incorrectCount}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Erros</span>
                  </div>
                </div>
                
                {answeredCount > 0 && (
                  <div className="pt-2 border-t border-border">
                    <div className="text-center">
                      <span className={`text-lg font-bold ${
                        percentage >= 70 ? 'text-green-600' : 
                        percentage >= 50 ? 'text-amber-500' : 'text-red-600'
                      }`}>
                        {percentage}% de aproveitamento
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancelClose}
                  className="flex-1"
                >
                  Continuar
                </Button>
                <Button 
                  onClick={handleConfirmClose}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  Finalizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-accent">📝 Questões de Prova</h2>
            <p className="text-sm text-muted-foreground">Art. {numeroArtigo}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleAttemptClose} className="shrink-0">
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
            <QuizViewer questions={questions} onScoreChange={handleScoreChange} />
          ) : (
            <div className="text-center text-muted-foreground py-12 px-6">
              Nenhuma questão gerada.
            </div>
          )}
        </div>

        {!loading && questions.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button onClick={handleAttemptClose} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestoesModal;
