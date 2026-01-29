import { useState, useEffect } from "react";
import { X, BookOpen, Sparkles, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AulaModuloNav } from "./aula/AulaModuloNav";
import { AulaTeoriaEnhanced } from "./aula/AulaTeoriaEnhanced";
import { ModuloTransitionCard } from "./aula/ModuloTransitionCard";
import { MatchingGame } from "./aula/MatchingGame";
import { FlashcardViewer } from "./FlashcardViewer";
import { QuizViewerEnhanced } from "./QuizViewerEnhanced";
import { AulaProvaFinal } from "./aula/AulaProvaFinal";
import { AulaResultado } from "./aula/AulaResultado";
import { motion, AnimatePresence } from "framer-motion";

interface AulaArtigoModalProps {
  isOpen: boolean;
  onClose: () => void;
  codigoTabela: string;
  codigoNome: string;
  numeroArtigo: string;
  conteudoArtigo: string;
}

type Etapa = 'loading' | 'transicao' | 'teoria' | 'matching' | 'flashcards' | 'questoes' | 'provaFinal' | 'resultado';

interface AulaEstrutura {
  titulo: string;
  descricao: string;
  area: string;
  modulos: {
    id: number;
    nome: string;
    icone: string;
    teoria: string;
    exemploPratico?: {
      cenario: string;
      analise: string;
      solucao: string;
    };
    quizRapido?: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explicacao: string;
    }>;
    resumo?: string[];
    matching: Array<{ termo: string; definicao: string }>;
    flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
    questoes: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explicacao: string;
    }>;
  }[];
  provaFinal: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
    tempoLimite?: number;
  }>;
}

const loadingMessages = [
  "Analisando o artigo em profundidade...",
  "Buscando jurisprudência relevante...",
  "Criando exemplos práticos...",
  "Gerando questões de concursos...",
  "Preparando flashcards de memorização...",
  "Montando a prova final...",
  "Finalizando sua aula personalizada..."
];

export const AulaArtigoModal = ({
  isOpen,
  onClose,
  codigoTabela,
  codigoNome,
  numeroArtigo,
  conteudoArtigo
}: AulaArtigoModalProps) => {
  const [aulaEstrutura, setAulaEstrutura] = useState<AulaEstrutura | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<Etapa>('loading');
  const [moduloAtual, setModuloAtual] = useState(1);
  const [acertos, setAcertos] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [isCached, setIsCached] = useState(false);
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
      setAulaEstrutura(estrutura);
      setIsCached(estrutura.cached || false);
      setAulaId(estrutura.aulaId || null);
      
      if (estrutura.cached) {
        toast.success("Aula carregada! Alguém já criou essa aula antes.");
      } else {
        toast.success("Aula criada com sucesso!");
      }
      
      setEtapaAtual('transicao');
    } catch (error: any) {
      console.error('Erro ao gerar aula:', error);
      toast.error("Erro ao gerar aula. Tente novamente.");
      onClose();
    }
  };

  const moduloAtualObj = aulaEstrutura?.modulos[moduloAtual - 1];
  const totalModulos = aulaEstrutura?.modulos.length || 3;

  const calcularProgresso = () => {
    const etapaPorModulo = 100 / (totalModulos + 1); // +1 for prova final
    const etapasModulo = ['transicao', 'teoria', 'matching', 'flashcards', 'questoes'];
    const etapaIndex = etapasModulo.indexOf(etapaAtual);
    const progressoEtapa = etapaIndex >= 0 ? (etapaIndex / etapasModulo.length) * etapaPorModulo : 0;
    
    if (etapaAtual === 'provaFinal') return 90;
    if (etapaAtual === 'resultado') return 100;
    
    return ((moduloAtual - 1) * etapaPorModulo) + progressoEtapa;
  };

  const proximaEtapa = () => {
    switch (etapaAtual) {
      case 'transicao':
        setEtapaAtual('teoria');
        break;
      case 'teoria':
        setEtapaAtual('matching');
        break;
      case 'matching':
        setEtapaAtual('flashcards');
        break;
      case 'flashcards':
        setEtapaAtual('questoes');
        break;
      case 'questoes':
        if (moduloAtual < totalModulos) {
          setModuloAtual(moduloAtual + 1);
          setEtapaAtual('transicao');
        } else {
          setEtapaAtual('provaFinal');
        }
        break;
    }
  };

  const handleMudarModulo = (novoModulo: number) => {
    setModuloAtual(novoModulo);
    setEtapaAtual('transicao');
  };

  const handleSair = () => {
    setAulaEstrutura(null);
    setEtapaAtual('loading');
    setModuloAtual(1);
    setAcertos(0);
    onClose();
  };

  const handleRefazer = () => {
    setModuloAtual(1);
    setEtapaAtual('transicao');
    setAcertos(0);
  };

  const finalizarAula = async (acertosProva: number, total: number) => {
    setAcertos(acertosProva);
    setEtapaAtual('resultado');

    // Update aproveitamento_medio if we have aulaId
    if (aulaId) {
      try {
        const percentual = (acertosProva / total) * 100;
        
        // Fetch current stats
        const { data: aulaData } = await supabase
          .from('aulas_artigos')
          .select('aproveitamento_medio, visualizacoes')
          .eq('id', aulaId)
          .single();

        if (aulaData) {
          // Calculate new average (simple moving average)
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
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      {/* Navigation */}
      {etapaAtual !== 'loading' && aulaEstrutura && (
        <AulaModuloNav
          modulos={aulaEstrutura.modulos.map(m => ({ id: m.id, nome: m.nome }))}
          moduloAtual={moduloAtual}
          progresso={calcularProgresso()}
          onSair={handleSair}
          onMudarModulo={handleMudarModulo}
        />
      )}

      {/* Content */}
      <div className={`h-full overflow-y-auto ${etapaAtual !== 'loading' ? 'pt-16' : ''}`}>
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
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[hsl(45,93%,58%)] to-[hsl(45,93%,48%)] rounded-full flex items-center justify-center shadow-2xl shadow-[hsl(45,93%,58%)]/30">
                    <GraduationCap className="w-12 h-12 text-black" />
                  </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Art. {numeroArtigo}
                </h2>
                <p className="text-muted-foreground mb-8">{codigoNome}</p>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <Loader2 className="w-5 h-5 animate-spin text-[hsl(45,93%,58%)]" />
                  <motion.span
                    key={loadingIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
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
                        i <= loadingIndex ? 'bg-[hsl(45,93%,58%)]' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  onClick={handleSair}
                  className="mt-8 text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Module Transition */}
          {etapaAtual === 'transicao' && moduloAtualObj && (
            <ModuloTransitionCard
              moduloNumero={moduloAtual}
              moduloNome={moduloAtualObj.nome}
              icone={moduloAtualObj.icone}
              onComplete={() => setEtapaAtual('teoria')}
            />
          )}

          {/* Theory */}
          {etapaAtual === 'teoria' && moduloAtualObj && (
            <motion.div
              key={`teoria-${moduloAtual}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 max-w-4xl mx-auto pb-32"
            >
              {isCached && moduloAtual === 1 && (
                <div className="mb-4 p-3 bg-[hsl(45,93%,58%)]/10 border border-[hsl(45,93%,58%)]/30 rounded-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[hsl(45,93%,58%)]" />
                  <span className="text-sm text-muted-foreground">
                    Aula pré-existente! Criada por outro usuário.
                  </span>
                </div>
              )}
              <AulaTeoriaEnhanced
                moduloNumero={moduloAtual}
                titulo={moduloAtualObj.nome}
                conteudo={moduloAtualObj.teoria}
                exemploPratico={moduloAtualObj.exemploPratico}
                quizRapido={moduloAtualObj.quizRapido}
                resumo={moduloAtualObj.resumo}
                onProximo={proximaEtapa}
                proximoLabel="Jogo de Matching"
              />
            </motion.div>
          )}

          {/* Matching Game */}
          {etapaAtual === 'matching' && moduloAtualObj && (
            <motion.div
              key={`matching-${moduloAtual}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 max-w-4xl mx-auto pb-32"
            >
              <MatchingGame
                matches={moduloAtualObj.matching}
                onProximo={proximaEtapa}
              />
            </motion.div>
          )}

          {/* Flashcards */}
          {etapaAtual === 'flashcards' && moduloAtualObj && (
            <motion.div
              key={`flashcards-${moduloAtual}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 max-w-4xl mx-auto pb-32"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-[hsl(45,93%,58%)] mb-4">
                  Flashcards - Módulo {moduloAtual}
                </h3>
                <FlashcardViewer
                  flashcards={moduloAtualObj.flashcards.map(f => ({
                    front: f.frente,
                    back: f.verso,
                    example: f.exemplo
                  }))}
                  tema={`Art. ${numeroArtigo} - ${moduloAtualObj.nome}`}
                />
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={proximaEtapa}
                    className="bg-[hsl(45,93%,58%)] hover:bg-[hsl(45,88%,52%)] text-black font-semibold px-8"
                  >
                    Ir para Questões
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Questions */}
          {etapaAtual === 'questoes' && moduloAtualObj && (
            <motion.div
              key={`questoes-${moduloAtual}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 max-w-4xl mx-auto pb-32"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-[hsl(45,93%,58%)] mb-4">
                  Questões - Módulo {moduloAtual}
                </h3>
                <QuizViewerEnhanced
                  questions={moduloAtualObj.questoes}
                />
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={proximaEtapa}
                    className="bg-[hsl(45,93%,58%)] hover:bg-[hsl(45,88%,52%)] text-black font-semibold px-8"
                  >
                    {moduloAtual < totalModulos ? 'Próximo Módulo' : 'Prova Final'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Final Exam */}
          {etapaAtual === 'provaFinal' && aulaEstrutura && (
            <motion.div
              key="provaFinal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
            <motion.div
              key="resultado"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 max-w-4xl mx-auto pb-32"
            >
              <AulaResultado
                titulo={`Art. ${numeroArtigo} - ${codigoNome}`}
                acertos={acertos}
                total={aulaEstrutura.provaFinal.length}
                onRefazer={handleRefazer}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
