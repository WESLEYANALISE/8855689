import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { AulaEstruturaV2, EtapaAulaV2 } from "@/components/aula-v2/types";
import { AulaIntroCard } from "@/components/aula-v2/AulaIntroCard";
import { SecaoHeader } from "@/components/aula-v2/SecaoHeader";
import { InteractiveSlide } from "@/components/aula-v2/InteractiveSlide";
import { ProgressStepper } from "@/components/aula-v2/ProgressStepper";
import { ConceptMatcher } from "@/components/aula-v2/ConceptMatcher";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import { AulaProvaFinal } from "@/components/aula/AulaProvaFinal";
import { AulaResultadoV2 } from "@/components/aula-v2/AulaResultadoV2";

interface JornadaAulaViewerProps {
  aulaEstrutura: AulaEstruturaV2;
  tema: string;
  area: string;
  onClose: () => void;
  onComplete: (acertos: number, total: number) => void;
}

const loadingMessages = [
  "Preparando sua aula...",
  "Organizando o conteúdo...",
  "Finalizando..."
];

export const JornadaAulaViewer = ({
  aulaEstrutura,
  tema,
  area,
  onClose,
  onComplete
}: JornadaAulaViewerProps) => {
  const [etapaAtual, setEtapaAtual] = useState<EtapaAulaV2>('intro');
  const [secaoAtual, setSecaoAtual] = useState(0);
  const [slideAtual, setSlideAtual] = useState(0);
  const [showSecaoHeader, setShowSecaoHeader] = useState(true);
  const [acertos, setAcertos] = useState(0);

  const secaoAtualObj = aulaEstrutura?.secoes[secaoAtual];
  const totalSecoes = aulaEstrutura?.secoes.length || 0;
  const totalSlides = secaoAtualObj?.slides.length || 0;

  const handleComecarSecao = () => {
    setShowSecaoHeader(false);
    setSlideAtual(0);
  };

  const handleNextSlide = () => {
    if (slideAtual < totalSlides - 1) {
      setSlideAtual(prev => prev + 1);
    } else {
      if (secaoAtual < totalSecoes - 1) {
        setSecaoAtual(prev => prev + 1);
        setShowSecaoHeader(true);
        setSlideAtual(0);
      } else {
        setEtapaAtual('matching');
      }
    }
  };

  const handlePreviousSlide = () => {
    if (slideAtual > 0) {
      setSlideAtual(prev => prev - 1);
    }
  };

  const handleSair = () => {
    onClose();
  };

  const handleRefazer = () => {
    setSecaoAtual(0);
    setSlideAtual(0);
    setShowSecaoHeader(true);
    setEtapaAtual('intro');
    setAcertos(0);
  };

  const finalizarAula = (acertosProva: number, total: number) => {
    setAcertos(acertosProva);
    setEtapaAtual('resultado');
    onComplete(acertosProva, total);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden flex flex-col">
      {/* Header */}
      {etapaAtual !== 'intro' && (
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleSair}>
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-foreground text-sm">{tema}</h1>
                <p className="text-xs text-muted-foreground">{area}</p>
              </div>
            </div>
          </div>
          
          {etapaAtual !== 'resultado' && (
            <ProgressStepper
              currentSecao={secaoAtual + 1}
              totalSecoes={totalSecoes}
              currentPhase={etapaAtual === 'secao' ? 'secao' : etapaAtual as any}
            />
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Intro */}
          {etapaAtual === 'intro' && aulaEstrutura && (
            <AulaIntroCard
              titulo={aulaEstrutura.titulo}
              codigoNome={area}
              tempoEstimado={aulaEstrutura.tempoEstimado}
              objetivos={aulaEstrutura.objetivos}
              totalSecoes={totalSecoes}
              onComecar={() => {
                setEtapaAtual('secao');
                setShowSecaoHeader(true);
              }}
            />
          )}

          {/* Section content */}
          {etapaAtual === 'secao' && secaoAtualObj && (
            showSecaoHeader ? (
              <SecaoHeader
                key={`secao-header-${secaoAtual}`}
                secao={secaoAtualObj}
                secaoIndex={secaoAtual}
                totalSecoes={totalSecoes}
                onComecar={handleComecarSecao}
              />
            ) : (
              <InteractiveSlide
                key={`slide-${secaoAtual}-${slideAtual}`}
                slide={secaoAtualObj.slides[slideAtual]}
                slideIndex={slideAtual}
                totalSlides={totalSlides}
                onNext={handleNextSlide}
                onPrevious={handlePreviousSlide}
                canGoBack={slideAtual > 0}
                secaoId={secaoAtualObj.id}
              />
            )
          )}

          {/* Matching Game */}
          {etapaAtual === 'matching' && aulaEstrutura && (
            <motion.div
              key="matching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ConceptMatcher
                matches={aulaEstrutura.atividadesFinais.matching}
                onComplete={() => setEtapaAtual('flashcards')}
              />
            </motion.div>
          )}

          {/* Flashcards */}
          {etapaAtual === 'flashcards' && aulaEstrutura && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 max-w-4xl mx-auto"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-primary mb-4">
                  Flashcards de Revisão
                </h3>
                <FlashcardViewer
                  flashcards={aulaEstrutura.atividadesFinais.flashcards.map(f => ({
                    front: f.frente,
                    back: f.verso,
                    example: f.exemplo
                  }))}
                  tema={tema}
                />
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => setEtapaAtual('quiz')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 rounded-xl"
                  >
                    Ir para Quiz
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quiz */}
          {etapaAtual === 'quiz' && aulaEstrutura && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 max-w-4xl mx-auto"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-primary mb-4">
                  Quiz de Fixação
                </h3>
                <QuizViewerEnhanced
                  questions={aulaEstrutura.atividadesFinais.questoes}
                />
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => setEtapaAtual('provaFinal')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 rounded-xl"
                  >
                    Prova Final
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Final Exam */}
          {etapaAtual === 'provaFinal' && aulaEstrutura && (
            <motion.div
              key="provaFinal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 max-w-4xl mx-auto pb-32"
            >
              <AulaProvaFinal
                questoes={aulaEstrutura.provaFinal.map(q => ({
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explicacao: q.explicacao,
                  tempoLimite: q.tempoLimite || 45
                }))}
                onFinalizar={finalizarAula}
              />
            </motion.div>
          )}

          {/* Results */}
          {etapaAtual === 'resultado' && aulaEstrutura && (
            <AulaResultadoV2
              titulo={`${tema} - ${area}`}
              acertos={acertos}
              total={aulaEstrutura.provaFinal.length}
              onRefazer={handleRefazer}
              onSair={handleSair}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
