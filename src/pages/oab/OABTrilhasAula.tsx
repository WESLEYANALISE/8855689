import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AulaEstruturaV2 } from "@/components/aula-v2/types";
import { AulaIntroCard } from "@/components/aula-v2/AulaIntroCard";
import { InteractiveSlide } from "@/components/aula-v2/InteractiveSlide";
import { ConceptMatcher } from "@/components/aula-v2/ConceptMatcher";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import { AulaProvaFinal } from "@/components/aula/AulaProvaFinal";
import { AulaResultadoV2 } from "@/components/aula-v2/AulaResultadoV2";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type EtapaAula = 'loading' | 'intro' | 'secao' | 'matching' | 'flashcards' | 'quiz' | 'provaFinal' | 'resultado';

const OABTrilhasAula = () => {
  const { materiaId, topicoId, resumoId } = useParams();
  const navigate = useNavigate();
  
  const [etapa, setEtapa] = useState<EtapaAula>('loading');
  const [aulaEstrutura, setAulaEstrutura] = useState<AulaEstruturaV2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secaoAtual, setSecaoAtual] = useState(0);
  const [slideAtual, setSlideAtual] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Preparando sua aula...");

  const loadingMessages = [
    "Preparando sua aula personalizada...",
    "Criando storytelling envolvente...",
    "Gerando exemplos práticos...",
    "Elaborando questões estilo OAB...",
    "Montando flashcards de revisão...",
    "Finalizando sua experiência de aprendizado..."
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[index]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const carregarAula = useCallback(async () => {
    if (!resumoId) return;
    
    setEtapa('loading');
    setError(null);

    try {
      const response = await supabase.functions.invoke('gerar-aula-trilhas-oab', {
        body: { resumoId: Number(resumoId) }
      });

      if (response.error) throw response.error;
      
      const estrutura = response.data as AulaEstruturaV2;
      setAulaEstrutura(estrutura);
      setEtapa('intro');
      
      if (estrutura.cached) {
        toast.success("Aula carregada do cache!");
      } else {
        toast.success("Aula gerada com sucesso!");
      }
    } catch (err: any) {
      console.error('Erro ao carregar aula:', err);
      setError(err.message || 'Erro ao carregar aula');
    }
  }, [resumoId]);

  useEffect(() => {
    carregarAula();
  }, [carregarAula]);

  const handleIniciarAula = () => {
    setSecaoAtual(0);
    setSlideAtual(0);
    setEtapa('secao');
  };

  const handleProximoSlide = () => {
    const secaoAtualObj = aulaEstrutura?.secoes?.[secaoAtual];
    const totalSlides = secaoAtualObj?.slides?.length || 0;
    const totalSecoes = aulaEstrutura?.secoes?.length || 0;

    if (slideAtual < totalSlides - 1) {
      setSlideAtual(prev => prev + 1);
    } else if (secaoAtual < totalSecoes - 1) {
      setSecaoAtual(prev => prev + 1);
      setSlideAtual(0);
    } else {
      setEtapa('matching');
    }
  };

  const handleSlideAnterior = () => {
    if (slideAtual > 0) {
      setSlideAtual(prev => prev - 1);
    } else if (secaoAtual > 0) {
      setSecaoAtual(prev => prev - 1);
      const prevSecao = aulaEstrutura?.secoes?.[secaoAtual - 1];
      setSlideAtual((prevSecao?.slides?.length || 1) - 1);
    }
  };

  const handleMatchingComplete = () => {
    setEtapa('flashcards');
  };

  const handleFlashcardsComplete = () => {
    setEtapa('quiz');
  };

  const handleQuizComplete = () => {
    setEtapa('provaFinal');
  };

  const handleProvaFinalComplete = (nota: number, totalQuestoes: number) => {
    setAcertos(nota);
    setEtapa('resultado');
  };

  const handleVoltarEstudo = () => {
    navigate(`/oab/trilhas-aprovacao/materia/${materiaId}/topicos/${topicoId}/estudo/${resumoId}`);
  };

  const handleRefazerAula = () => {
    setSecaoAtual(0);
    setSlideAtual(0);
    setAcertos(0);
    setEtapa('intro');
  };

  // Loading state
  if (etapa === 'loading') {
    if (error) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-foreground">Erro ao carregar aula</h2>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleVoltarEstudo}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={carregarAula}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <GraduationCap className="w-12 h-12 text-primary-foreground" />
            </div>
            <motion.div
              className="absolute inset-0 w-24 h-24 mx-auto border-4 border-primary/30 rounded-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <motion.p
              key={loadingMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-muted-foreground"
            >
              {loadingMessage}
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!aulaEstrutura) return null;

  // Intro
  if (etapa === 'intro') {
    const totalSecoes = aulaEstrutura.secoes?.length || 0;
    return (
      <AulaIntroCard
        titulo={aulaEstrutura.titulo}
        codigoNome={aulaEstrutura.area || "OAB"}
        tempoEstimado={aulaEstrutura.tempoEstimado}
        objetivos={aulaEstrutura.objetivos || []}
        totalSecoes={totalSecoes}
        onComecar={handleIniciarAula}
      />
    );
  }

  // Seções/Slides
  if (etapa === 'secao') {
    const secao = aulaEstrutura.secoes?.[secaoAtual];
    const slide = secao?.slides?.[slideAtual];
    
    if (!secao || !slide) {
      setEtapa('matching');
      return null;
    }

    const totalSlides = secao.slides?.length || 0;
    const canGoBack = slideAtual > 0 || secaoAtual > 0;

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
            <Button variant="ghost" size="sm" onClick={handleVoltarEstudo}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {secao.titulo || `Seção ${secaoAtual + 1}`}
              </p>
              <p className="text-xs text-muted-foreground/60">
                Slide {slideAtual + 1} de {totalSlides}
              </p>
            </div>
            <div className="w-16" />
          </div>
        </div>

        <InteractiveSlide
          slide={slide}
          slideIndex={slideAtual}
          totalSlides={totalSlides}
          onNext={handleProximoSlide}
          onPrevious={handleSlideAnterior}
          canGoBack={canGoBack}
        />
      </div>
    );
  }

  // Matching
  if (etapa === 'matching') {
    const matchingPairs = aulaEstrutura.atividadesFinais?.matching || [];
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={handleVoltarEstudo}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              Associação de Conceitos
            </h2>
            <div className="w-16" />
          </div>
          <ConceptMatcher
            matches={matchingPairs}
            onComplete={handleMatchingComplete}
          />
        </div>
      </div>
    );
  }

  // Flashcards
  if (etapa === 'flashcards') {
    const flashcards = (aulaEstrutura.atividadesFinais?.flashcards || []).map(f => ({
      front: f.frente,
      back: f.verso
    }));
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={handleVoltarEstudo}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              Flashcards de Revisão
            </h2>
            <Button variant="default" size="sm" onClick={handleFlashcardsComplete}>
              Continuar
            </Button>
          </div>
          <FlashcardViewer
            flashcards={flashcards}
            tema={aulaEstrutura.titulo}
            area={aulaEstrutura.area}
          />
        </div>
      </div>
    );
  }

  // Quiz
  if (etapa === 'quiz') {
    const questions = (aulaEstrutura.atividadesFinais?.questoes || []).map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explicacao
    }));
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={handleVoltarEstudo}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              Questões de Fixação
            </h2>
            <Button variant="default" size="sm" onClick={handleQuizComplete}>
              Continuar
            </Button>
          </div>
          <QuizViewerEnhanced questions={questions} />
        </div>
      </div>
    );
  }

  // Prova Final
  if (etapa === 'provaFinal') {
    const questoes = (aulaEstrutura.provaFinal || []).map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explicacao: q.explicacao,
      tempoLimite: q.tempoLimite || 90
    }));
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={handleVoltarEstudo}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              Prova Final
            </h2>
            <div className="w-16" />
          </div>
          <AulaProvaFinal
            questoes={questoes}
            onFinalizar={handleProvaFinalComplete}
          />
        </div>
      </div>
    );
  }

  // Resultado
  if (etapa === 'resultado') {
    const totalQuestoes = (aulaEstrutura.provaFinal?.length || 0);
    return (
      <AulaResultadoV2
        titulo={aulaEstrutura.titulo}
        acertos={acertos}
        total={totalQuestoes}
        onRefazer={handleRefazerAula}
        onSair={handleVoltarEstudo}
      />
    );
  }

  return null;
};

export default OABTrilhasAula;
