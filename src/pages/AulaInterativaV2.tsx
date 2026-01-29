import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
import { AulaIntro } from "@/components/aula/AulaIntro";

const loadingMessages = [
  "Analisando o tema em profundidade...",
  "Criando histórias envolventes...",
  "Preparando explicações detalhadas...",
  "Gerando exemplos práticos...",
  "Criando questões de fixação...",
  "Montando flashcards de memorização...",
  "Finalizando sua aula personalizada..."
];

const AulaInterativaV2 = () => {
  const [aulaEstrutura, setAulaEstrutura] = useState<AulaEstruturaV2 | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<EtapaAulaV2>('intro');
  const [secaoAtual, setSecaoAtual] = useState(0);
  const [slideAtual, setSlideAtual] = useState(0);
  const [showSecaoHeader, setShowSecaoHeader] = useState(true);
  const [acertos, setAcertos] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [aulaId, setAulaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [tema, setTema] = useState("");

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

  // Check for lesson from chat
  useEffect(() => {
    const aulaFromChat = sessionStorage.getItem('aulaGeradaChat');
    if (aulaFromChat) {
      try {
        const { estrutura, tema: temaSalvo, aulaId: id } = JSON.parse(aulaFromChat);
        sessionStorage.removeItem('aulaGeradaChat');
        setAulaEstrutura(estrutura);
        setAulaId(id || null);
        setTema(temaSalvo);
        setEtapaAtual('intro');
        toast.success(`Aula "${temaSalvo}" carregada!`);
      } catch (e) {
        console.error('Erro ao carregar aula do chat:', e);
      }
    }
  }, []);

  const gerarAula = async (temaInput: string) => {
    setIsLoading(true);
    setEtapaAtual('loading');
    setTema(temaInput);
    
    try {
      // Use streaming endpoint
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-aula-streaming`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
          },
          body: JSON.stringify({ tema: temaInput })
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Erro ao conectar');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let primeiraSecaoRecebida = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'status') {
                setLoadingMessage(data.message);
                setLoadingIndex(Math.floor((data.progress / 100) * loadingMessages.length));
              }
              
              if (data.type === 'secao' && !primeiraSecaoRecebida) {
                // Show first section immediately
                primeiraSecaoRecebida = true;
                setIsLoadingMore(true);
                const estruturaParcial: AulaEstruturaV2 = {
                  versao: 2,
                  titulo: data.estruturaBasica.titulo,
                  tempoEstimado: data.estruturaBasica.tempoEstimado,
                  area: data.estruturaBasica.area,
                  descricao: data.estruturaBasica.descricao,
                  objetivos: data.estruturaBasica.objetivos,
                  secoes: [data.secao],
                  atividadesFinais: { matching: [], flashcards: [], questoes: [] },
                  provaFinal: []
                };
                setAulaEstrutura(estruturaParcial);
                setEtapaAtual('intro');
                toast.success("Primeira seção pronta! Continue enquanto o resto carrega.");
              }
              
              if (data.type === 'complete') {
                // Update with complete structure
                setIsLoadingMore(false);
                setAulaEstrutura(data.estrutura);
                setAulaId(data.aulaId || null);
                
                if (data.cached) {
                  toast.success("Aula carregada do cache!");
                } else if (primeiraSecaoRecebida) {
                  toast.success("Aula completa carregada!");
                } else {
                  toast.success("Aula criada com sucesso!");
                }
                
                if (!primeiraSecaoRecebida) {
                  setEtapaAtual('intro');
                }
              }
              
              if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseErr) {
              console.error('Erro ao parsear SSE:', parseErr);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar aula:', error);
      toast.error("Erro ao gerar aula. Tente novamente.");
      setEtapaAtual('intro');
      setAulaEstrutura(null);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarAulaPronta = (estruturaAula: any, idAula: string) => {
    setAulaEstrutura(estruturaAula);
    setAulaId(idAula);
    setTema(estruturaAula.titulo || '');
    setSecaoAtual(0);
    setSlideAtual(0);
    setShowSecaoHeader(true);
    setEtapaAtual('intro');
    toast.success('Aula carregada!');
  };

  const secaoAtualObj = aulaEstrutura?.secoes?.[secaoAtual];
  const totalSecoes = aulaEstrutura?.secoes?.length || 0;
  const totalSlides = secaoAtualObj?.slides?.length || 0;

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
    setEtapaAtual('intro');
    setSecaoAtual(0);
    setSlideAtual(0);
    setShowSecaoHeader(true);
    setAcertos(0);
    setTema("");
    setAulaId(null);
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
          .from('aulas_interativas')
          .select('aproveitamento_medio, visualizacoes')
          .eq('id', aulaId)
          .single();

        if (aulaData) {
          const visualizacoes = aulaData.visualizacoes || 1;
          const mediaAtual = aulaData.aproveitamento_medio || 0;
          const novaMedia = ((mediaAtual * (visualizacoes - 1)) + percentual) / visualizacoes;

          await supabase
            .from('aulas_interativas')
            .update({ aproveitamento_medio: novaMedia })
            .eq('id', aulaId);
        }
      } catch (error) {
        console.error('Erro ao atualizar aproveitamento:', error);
      }
    }
  };

  // Show intro/selection screen
  if ((etapaAtual === 'intro' && !aulaEstrutura) || (etapaAtual === 'intro' && !aulaEstrutura && !isLoading)) {
    return (
      <AulaIntro 
        onIniciar={gerarAula}
        onSelecionarAulaPronta={carregarAulaPronta}
        isLoading={isLoading}
      />
    );
  }

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
                <h1 className="font-semibold text-foreground text-sm line-clamp-1">
                  {aulaEstrutura?.titulo || tema}
                </h1>
                <p className="text-xs text-muted-foreground">Aula Interativa</p>
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
                  {tema}
                </h2>
                <p className="text-muted-foreground mb-8">Criando sua aula personalizada</p>

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
              codigoNome="Aula Interativa"
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
                numeroArtigo={tema}
                codigoTabela="aula-interativa"
                secaoId={secaoAtualObj.id}
                aulaId={aulaId || undefined}
                onImageGenerated={(idx, url) => {
                  if (aulaEstrutura) {
                    const updatedSecoes = [...aulaEstrutura.secoes];
                    if (updatedSecoes[secaoAtual]?.slides[idx]) {
                      updatedSecoes[secaoAtual].slides[idx].imagemUrl = url;
                      setAulaEstrutura({ ...aulaEstrutura, secoes: updatedSecoes });
                    }
                  }
                }}
                onAudioGenerated={(idx, url) => {
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
              titulo={aulaEstrutura.titulo}
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

export default AulaInterativaV2;
