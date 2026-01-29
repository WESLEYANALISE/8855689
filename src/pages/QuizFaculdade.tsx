import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Questao {
  id: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta_correta: string;
  comentario: string;
  tema: string;
}

export default function QuizFaculdade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [respostas, setRespostas] = useState<{ questaoId: number; correta: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [progressoGeracao, setProgressoGeracao] = useState(0);

  useEffect(() => {
    carregarQuestoes();
  }, []);

  const carregarQuestoes = async () => {
    try {
      const area = searchParams.get('area');
      const tema = searchParams.get('tema');
      const questaoId = searchParams.get('questaoId');

      let query = supabase
        .from('QUESTOES_GERADAS')
        .select('*')
        .eq('aprovada', true);

      if (questaoId) {
        query = query.eq('id', parseInt(questaoId));
      } else {
        if (area) query = query.eq('area', area);
        if (tema) query = query.eq('tema', tema);
        query = query.limit(10);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        // Se não há questões e tem área e tema, gerar automaticamente
        if (area && tema) {
          await gerarQuestoesParaTema(area, tema);
          return;
        }
        
        toast.error('Nenhuma questão encontrada');
        navigate('/faculdade/questoes');
        return;
      }

      setQuestoes(data);
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
      toast.error('Erro ao carregar questões');
    } finally {
      setLoading(false);
    }
  };

  const gerarQuestoesParaTema = async (area: string, tema: string) => {
    setGerando(true);
    setProgressoGeracao(10);
    
    try {
      toast.info('Gerando questões com IA... Isso pode levar alguns minutos.');
      
      // Buscar resumos do tema
      const { data: resumos, error: resumosError } = await supabase
        .from('RESUMO')
        .select('*')
        .eq('area', area)
        .eq('tema', tema);

      if (resumosError) throw resumosError;

      if (!resumos || resumos.length === 0) {
        toast.error('Nenhum resumo encontrado para este tema');
        navigate('/faculdade/questoes');
        return;
      }

      setProgressoGeracao(30);

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('gerar-questoes-tema', {
        body: {
          area: area,
          tema: tema,
          resumos: resumos
        }
      });

      if (error) throw error;

      setProgressoGeracao(90);

      if (data.fromCache) {
        toast.success('Questões carregadas do cache!');
      } else {
        toast.success(`${data.questoes_geradas} questões geradas com sucesso!`);
      }

      // Recarregar questões
      const { data: questoesData } = await supabase
        .from('QUESTOES_GERADAS')
        .select('*')
        .eq('area', area)
        .eq('tema', tema)
        .eq('aprovada', true)
        .limit(10);

      if (questoesData && questoesData.length > 0) {
        setQuestoes(questoesData);
      } else {
        toast.error('Erro ao carregar questões geradas');
        navigate('/faculdade/questoes');
      }
      
      setProgressoGeracao(100);
    } catch (error: any) {
      console.error('Erro ao gerar questões:', error);
      toast.error('Erro ao gerar questões: ' + error.message);
      navigate('/faculdade/questoes');
    } finally {
      setGerando(false);
      setProgressoGeracao(0);
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answer);
    setShowExplanation(true);

    const questaoAtual = questoes[currentIndex];
    const correta = answer === questaoAtual.resposta_correta;

    // Registrar resposta
    setRespostas([...respostas, { questaoId: questaoAtual.id, correta }]);

    // Atualizar estatísticas no banco
    try {
      await supabase.rpc('incrementar_stats_questao', {
        p_questao_id: questaoAtual.id,
        p_correta: correta
      });
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Finalizar quiz
      const acertos = respostas.filter(r => r.correta).length;
      toast.success(`Quiz concluído! ${acertos}/${respostas.length} acertos`);
      navigate('/faculdade/questoes');
    }
  };

  const reiniciar = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setRespostas([]);
  };

  if (loading || gerando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {gerando ? (
            <>
              <Sparkles className="w-16 h-16 animate-pulse mx-auto mb-4 text-emerald-500" />
              <h3 className="text-xl font-semibold mb-2">Gerando Questões com IA...</h3>
              <p className="text-muted-foreground mb-4">Criando 10 questões para cada resumo do tema</p>
              <Progress value={progressoGeracao} className="max-w-md mx-auto h-2" />
              <p className="text-sm text-muted-foreground mt-2">{progressoGeracao}%</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando questões...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return null;
  }

  const questaoAtual = questoes[currentIndex];
  const isCorrect = selectedAnswer === questaoAtual.resposta_correta;
  const progresso = ((currentIndex + 1) / questoes.length) * 100;
  const acertos = respostas.filter(r => r.correta).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/faculdade/questoes')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reiniciar}
              className="text-white hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Questão {currentIndex + 1} de {questoes.length}</span>
            {respostas.length > 0 && (
              <span>{acertos}/{respostas.length} acertos ({((acertos/respostas.length)*100).toFixed(0)}%)</span>
            )}
          </div>
          <Progress value={progresso} className="h-2 bg-white/20" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        <Card className="p-6 space-y-6">
          {/* Tema */}
          <div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              {questaoAtual.tema}
            </span>
          </div>

          {/* Enunciado */}
          <h3 className="text-lg font-semibold leading-relaxed">{questaoAtual.enunciado}</h3>

          {/* Alternativas */}
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((letra) => {
              const alternativa = questaoAtual[`alternativa_${letra.toLowerCase()}` as keyof Questao] as string;
              const isSelected = selectedAnswer === letra;
              const isCorrectAnswer = letra === questaoAtual.resposta_correta;
              const showCorrect = showExplanation && isCorrectAnswer;
              const showIncorrect = showExplanation && isSelected && !isCorrect;

              return (
                <button
                  key={letra}
                  onClick={() => handleAnswerSelect(letra)}
                  disabled={showExplanation}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all",
                    "hover:border-primary disabled:cursor-not-allowed",
                    !showExplanation && "hover:bg-accent/5",
                    showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20",
                    showIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/20",
                    !showExplanation && isSelected && "border-primary bg-accent/10",
                    !showExplanation && !isSelected && "border-border"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="font-semibold text-muted-foreground shrink-0">
                        {letra}.
                      </span>
                      <span className={cn(
                        showCorrect && "text-green-700 dark:text-green-400 font-medium",
                        showIncorrect && "text-red-700 dark:text-red-400"
                      )}>
                        {alternativa}
                      </span>
                    </div>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                    {showIncorrect && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Comentário */}
          {showExplanation && (
            <div className={cn(
              "p-4 rounded-lg border-l-4",
              isCorrect 
                ? "bg-green-500/10 border-green-500" 
                : "bg-blue-500/10 border-blue-500"
            )}>
              <p className="text-sm font-semibold mb-2">
                {isCorrect ? "✓ Correto!" : "Explicação:"}
              </p>
              <p className="text-sm">{questaoAtual.comentario}</p>
            </div>
          )}

          {/* Botão Próxima */}
          {showExplanation && (
            <Button onClick={handleNext} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {currentIndex < questoes.length - 1 ? 'Próxima questão' : 'Finalizar quiz'}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
