import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { AulaEstruturaV2, EtapaAulaV2 } from "./types";
import { AulaIntroCard } from "./AulaIntroCard";
import { SecaoHeader } from "./SecaoHeader";
import { InteractiveSlide } from "./InteractiveSlide";
import { ProgressStepper } from "./ProgressStepper";
import { ConceptMatcher } from "./ConceptMatcher";
import { FlashcardViewer } from "../FlashcardViewer";
import { QuizViewerEnhanced } from "../QuizViewerEnhanced";
import { AulaProvaFinal } from "../aula/AulaProvaFinal";
import { AulaResultadoV2 } from "./AulaResultadoV2";

interface AulaArtigoBreakdownProps {
  isOpen: boolean;
  onClose: () => void;
  codigoTabela: string;
  codigoNome: string;
  numeroArtigo: string;
  conteudoArtigo: string;
}

const loadingMessages = [
  "Analisando o artigo em profundidade...",
  "Dividindo em seções para melhor compreensão...",
  "Criando explicações detalhadas...",
  "Preparando exemplos práticos...",
  "Gerando questões de fixação...",
  "Montando flashcards de memorização...",
  "Finalizando sua aula personalizada..."
];

export const AulaArtigoBreakdown = ({
  isOpen,
  onClose,
  codigoTabela,
  codigoNome,
  numeroArtigo,
  conteudoArtigo
}: AulaArtigoBreakdownProps) => {
  const [aulaEstrutura, setAulaEstrutura] = useState<AulaEstruturaV2 | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<EtapaAulaV2>('loading');
  const [secaoAtual, setSecaoAtual] = useState(0);
  const [slideAtual, setSlideAtual] = useState(0);
  const [showSecaoHeader, setShowSecaoHeader] = useState(true);
  const [acertos, setAcertos] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [aulaId, setAulaId] = useState<string | null>(null);

  // Rotate loading messages
  useEffect(() => {
    if (etapaAtual === 'loading') {
      const interval = setInterval(() => {
        setLoadingIndex(prev => {
          const next = (prev + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[next]);
          return next;
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [etapaAtual]);

  // Fetch or generate lesson when modal opens
  useEffect(() => {
    if (isOpen && !aulaEstrutura) {
      fetchOrGenerateAula();
    }
  }, [isOpen]);

  const fetchOrGenerateAula = async () => {
    try {
      setEtapaAtual('loading');
      
      const response = await supabase.functions.invoke('gerar-aula-artigo', {
        body: {
          codigoTabela,
          numeroArtigo,
          conteudoArtigo
        }
      });

      if (response.error) throw response.error;

      const estrutura = response.data;
      
      // Check if it's the new v2 structure
      if (estrutura.versao === 2) {
        setAulaEstrutura(estrutura);
      } else {
        // Convert old structure to new format (fallback)
        const converted = convertToV2(estrutura, conteudoArtigo);
        setAulaEstrutura(converted);
      }
      
      setAulaId(estrutura.aulaId || null);
      
      if (estrutura.cached) {
        toast.success("Aula carregada do cache!");
      } else {
        toast.success("Aula criada com sucesso!");
      }
      
      setEtapaAtual('intro');
    } catch (error: any) {
      console.error('Erro ao gerar aula:', error);
      toast.error("Erro ao gerar aula. Tente novamente.");
      onClose();
    }
  };

  // Convert old structure to v2 format
  const convertToV2 = (oldStructure: any, conteudo: string): AulaEstruturaV2 => {
    const secoes = oldStructure.modulos?.map((modulo: any, index: number) => ({
      id: index + 1,
      tipo: 'caput' as const,
      trechoOriginal: conteudo.substring(0, 300),
      titulo: modulo.nome,
      slides: [
        { tipo: 'texto' as const, conteudo: conteudo.substring(0, 300) },
        { tipo: 'explicacao' as const, conteudo: modulo.teoria || '' },
        ...(modulo.exemploPratico ? [{
          tipo: 'exemplo' as const,
          conteudo: `${modulo.exemploPratico.cenario}\n\n${modulo.exemploPratico.analise}\n\n${modulo.exemploPratico.solucao}`
        }] : []),
        ...(modulo.quizRapido?.[0] ? [{
          tipo: 'quickcheck' as const,
          pergunta: modulo.quizRapido[0].question,
          opcoes: modulo.quizRapido[0].options,
          resposta: modulo.quizRapido[0].correctAnswer,
          feedback: modulo.quizRapido[0].explicacao,
          conteudo: ''
        }] : [])
      ]
    })) || [];

    return {
      versao: 2,
      titulo: oldStructure.titulo || `Art. ${numeroArtigo}`,
      tempoEstimado: '15 min',
      objetivos: [
        'Compreender o texto do artigo',
        'Aplicar na prática',
        'Fixar conceitos importantes'
      ],
      secoes: secoes.length > 0 ? secoes : [{
        id: 1,
        tipo: 'caput' as const,
        trechoOriginal: conteudo,
        titulo: 'Conteúdo do Artigo',
        slides: [
          { tipo: 'texto' as const, conteudo: conteudo }
        ]
      }],
      atividadesFinais: {
        matching: oldStructure.modulos?.[0]?.matching || [],
        flashcards: oldStructure.modulos?.[0]?.flashcards || [],
        questoes: oldStructure.modulos?.[0]?.questoes || []
      },
      provaFinal: oldStructure.provaFinal || []
    };
  };

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
      // Finished current section
      if (secaoAtual < totalSecoes - 1) {
        setSecaoAtual(prev => prev + 1);
        setShowSecaoHeader(true);
        setSlideAtual(0);
      } else {
        // All sections complete, go to activities
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
    setAulaEstrutura(null);
    setEtapaAtual('loading');
    setSecaoAtual(0);
    setSlideAtual(0);
    setShowSecaoHeader(true);
    setAcertos(0);
    onClose();
  };

  const handleRefazer = () => {
    setSecaoAtual(0);
    setSlideAtual(0);
    setShowSecaoHeader(true);
    setEtapaAtual('intro');
    setAcertos(0);
  };

  const finalizarAula = async (acertosProva: number, total: number) => {
    setAcertos(acertosProva);
    setEtapaAtual('resultado');

    if (aulaId) {
      try {
        const percentual = (acertosProva / total) * 100;
        
        const { data: aulaData } = await supabase
          .from('aulas_artigos')
          .select('aproveitamento_medio, visualizacoes')
          .eq('id', aulaId)
          .single();

        if (aulaData) {
          const visualizacoes = aulaData.visualizacoes || 1;
          const mediaAtual = aulaData.aproveitamento_medio || 0;
          const novaMedia = ((mediaAtual * (visualizacoes - 1)) + percentual) / visualizacoes;

          await supabase
            .from('aulas_artigos')
            .update({ aproveitamento_medio: novaMedia })
            .eq('id', aulaId);
        }
      } catch (error) {
        console.error('Erro ao atualizar aproveitamento:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden flex flex-col">
      {/* Header */}
      {etapaAtual !== 'loading' && etapaAtual !== 'intro' && (
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleSair}>
                <X className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-foreground text-sm">Art. {numeroArtigo}</h1>
                <p className="text-xs text-muted-foreground">{codigoNome}</p>
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
          {/* Loading State */}
          {etapaAtual === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center px-6 max-w-md">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30">
                    <GraduationCap className="w-12 h-12 text-primary-foreground" />
                  </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Art. {numeroArtigo}
                </h2>
                <p className="text-muted-foreground mb-8">{codigoNome}</p>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <motion.span
                    key={loadingIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-muted-foreground"
                  >
                    {loadingMessage}
                  </motion.span>
                </div>

                <div className="flex justify-center gap-2">
                  {loadingMessages.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        i <= loadingIndex ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>

                <Button variant="ghost" onClick={handleSair} className="mt-8 text-muted-foreground">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Intro */}
          {etapaAtual === 'intro' && aulaEstrutura && (
            <AulaIntroCard
              titulo={aulaEstrutura.titulo}
              codigoNome={codigoNome}
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
                numeroArtigo={numeroArtigo}
                codigoTabela={codigoTabela}
                secaoId={secaoAtualObj.id}
                aulaId={aulaId || undefined}
                onImageGenerated={(idx, url) => {
                  // Cache the image URL in the structure
                  if (aulaEstrutura) {
                    const updatedSecoes = [...aulaEstrutura.secoes];
                    if (updatedSecoes[secaoAtual]?.slides[idx]) {
                      updatedSecoes[secaoAtual].slides[idx].imagemUrl = url;
                      setAulaEstrutura({ ...aulaEstrutura, secoes: updatedSecoes });
                    }
                  }
                }}
                onAudioGenerated={(idx, url) => {
                  // Cache audio URL could be saved here if needed
                  console.log(`Audio generated for slide ${idx}: ${url}`);
                }}
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
                  tema={`Art. ${numeroArtigo}`}
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
              titulo={`Art. ${numeroArtigo} - ${codigoNome}`}
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
