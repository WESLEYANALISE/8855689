import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Book, Footprints, Loader2, BookOpen, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import themisBackground from "@/assets/themis-estudos-background.webp";

const ConceitosLivro = () => {
  const { trilha } = useParams<{ trilha: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingTemaId, setGeneratingTemaId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hasTriggeredAnalysis = useRef(false);

  // Buscar informações da trilha
  const { data: trilhaInfo } = useQuery({
    queryKey: ["conceitos-trilha-info", trilha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_trilhas")
        .select("*")
        .eq("codigo", trilha)
        .single();
      
      if (error) {
        console.error("Erro ao buscar trilha:", error);
        return null;
      }
      return data;
    },
    refetchInterval: isProcessing || isAnalyzing ? 3000 : false,
  });

  // Buscar temas do livro
  const { data: temas, isLoading } = useQuery({
    queryKey: ["conceitos-livro-temas", trilha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_livro_temas")
        .select("*")
        .eq("trilha", trilha)
        .order("ordem");
      
      if (error) {
        console.error("Erro ao buscar temas:", error);
        return [];
      }
      return data || [];
    },
    refetchInterval: generatingTemaId ? 3000 : (isProcessing || isAnalyzing ? 5000 : false),
  });

  // Auto-trigger analysis when status is "extraido"
  useEffect(() => {
    const triggerAnalysis = async () => {
      if (trilhaInfo?.status === 'extraido' && !hasTriggeredAnalysis.current && !isAnalyzing) {
        hasTriggeredAnalysis.current = true;
        setIsAnalyzing(true);
        toast.info("Identificando temas e capítulos do livro...", { duration: 5000 });

        try {
          const { data, error } = await supabase.functions.invoke('analisar-estrutura-conceitos', {
            body: { trilha }
          });

          if (error) throw error;

          toast.success(`${data.totalTemas} temas identificados!`);
          queryClient.invalidateQueries({ queryKey: ["conceitos-trilha-info"] });
          queryClient.invalidateQueries({ queryKey: ["conceitos-livro-temas"] });

        } catch (error: any) {
          console.error("Erro ao analisar estrutura:", error);
          toast.error(error.message || "Erro ao identificar temas");
          hasTriggeredAnalysis.current = false; // Allow retry
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    triggerAnalysis();
  }, [trilhaInfo?.status, trilha, queryClient, isAnalyzing]);

  const handleProcessarPdf = async () => {
    if (!trilhaInfo?.pdf_url) {
      toast.error("URL do PDF não encontrada");
      return;
    }

    setIsProcessing(true);
    toast.info("Iniciando processamento do PDF com Mistral OCR...");

    try {
      const { data, error } = await supabase.functions.invoke('processar-pdf-conceitos', {
        body: { trilha: trilha, pdfUrl: trilhaInfo.pdf_url }
      });

      if (error) throw error;

      toast.success(data.message || "Processamento iniciado!");
      
      queryClient.invalidateQueries({ queryKey: ["conceitos-trilha-info"] });
      queryClient.invalidateQueries({ queryKey: ["conceitos-livro-temas"] });

    } catch (error: any) {
      console.error("Erro ao processar PDF:", error);
      toast.error(error.message || "Erro ao processar PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGerarConteudo = async (temaId: string, titulo: string) => {
    setGeneratingTemaId(temaId);
    toast.info(`Gerando conteúdo para "${titulo}"...`, { duration: 5000 });

    try {
      const { data, error } = await supabase.functions.invoke('gerar-conteudo-conceitos-livro', {
        body: { temaId }
      });

      if (error) throw error;

      toast.success(data.message || "Conteúdo gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["conceitos-livro-temas"] });

    } catch (error: any) {
      console.error("Erro ao gerar conteúdo:", error);
      toast.error(error.message || "Erro ao gerar conteúdo");
    } finally {
      setGeneratingTemaId(null);
    }
  };

  const handleTemaClick = (tema: any) => {
    if (tema.status === "concluido") {
      navigate(`/conceitos/livro/tema/${tema.id}`);
    } else if (tema.status === "pendente") {
      handleGerarConteudo(tema.id, tema.titulo);
    }
    // Se está "gerando", não faz nada
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-green-500";
      case "gerando":
        return "bg-blue-500 animate-pulse";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusLabel = (status: string, temaId: string) => {
    if (generatingTemaId === temaId) return "Gerando...";
    switch (status) {
      case "concluido":
        return "Pronto";
      case "gerando":
        return "Gerando...";
      default:
        return "Pendente";
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${themisBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/primeiros-passos')}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Trilha 1 - Livro</h1>
                <p className="text-xs text-white/70">
                  {trilhaInfo?.nome || "Introdução ao Estudo do Direito"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Stats */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{trilhaInfo?.total_paginas || 181} páginas</span>
            </div>
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4 text-amber-400" />
              <span>{temas?.length || 0} temas</span>
            </div>
          </div>
          
          {/* Status da trilha */}
          {trilhaInfo?.status && trilhaInfo.status !== "pronto" && (
            <div className="flex justify-center mt-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                trilhaInfo.status === "pendente" 
                  ? "bg-yellow-500/20 text-yellow-300"
                  : trilhaInfo.status === "extraindo"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-purple-500/20 text-purple-300"
              }`}>
              {trilhaInfo.status === "pendente" && "⏳ Aguardando processamento do PDF"}
              {trilhaInfo.status === "extraindo" && "📖 Extraindo conteúdo do livro..."}
              {(trilhaInfo.status === "analisando" || (trilhaInfo.status === "extraido" && isAnalyzing)) && "🔍 Identificando temas e capítulos..."}
              {trilhaInfo.status === "extraido" && !isAnalyzing && "📚 Conteúdo extraído, analisando estrutura..."}
            </span>
          </div>
        )}

        {/* Status de análise em andamento */}
        {isAnalyzing && (
          <div className="flex justify-center mt-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analisando estrutura do livro...</span>
            </div>
          </div>
        )}
        
        {/* Botão para processar PDF */}
        {trilhaInfo?.status === 'pendente' && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleProcessarPdf}
              disabled={isProcessing}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isProcessing ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Iniciar Processamento do PDF
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Timeline de Temas */}
        <div className="px-4 pt-4 pb-24">
          <div className="max-w-lg mx-auto relative">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : temas && temas.length > 0 ? (
              <>
                {/* Linha central */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-900/50 rounded-full">
                  <motion.div
                    className="absolute inset-0 w-full bg-gradient-to-b from-transparent via-white/30 to-transparent"
                    animate={{ y: ["0%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ height: "30%" }}
                  />
                </div>
                
                <div className="space-y-6">
                  {temas.map((tema, index) => {
                    const isLeft = index % 2 === 0;
                    const isReady = tema.status === "concluido";
                    const isGenerating = tema.status === "gerando" || generatingTemaId === tema.id;
                    const isPending = tema.status === "pendente" && generatingTemaId !== tema.id;
                    
                    return (
                      <motion.div
                        key={tema.id}
                        initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`relative flex items-center ${isLeft ? 'justify-start pr-[55%]' : 'justify-end pl-[55%]'}`}
                      >
                        {/* Marcador Pegada no centro */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-10">
                          <motion.div
                            animate={isReady ? { scale: [1, 1.15, 1] } : isGenerating ? { rotate: 360 } : {}}
                            transition={isReady ? { duration: 2, repeat: Infinity } : isGenerating ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isReady 
                                ? "bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/40" 
                                : isGenerating
                                ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/40"
                                : "bg-neutral-800 border border-neutral-700"
                            }`}
                          >
                            {isGenerating ? (
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                              <Footprints className={`w-5 h-5 ${isReady ? 'text-white' : 'text-neutral-500'}`} />
                            )}
                          </motion.div>
                        </div>
                        
                        {/* Card do Tema */}
                        <button
                          onClick={() => handleTemaClick(tema)}
                          disabled={isGenerating}
                          className={`w-full transition-all duration-300 ${
                            isGenerating
                              ? "cursor-wait"
                              : isReady
                              ? "cursor-pointer hover:scale-[1.02]"
                              : isPending
                              ? "cursor-pointer hover:scale-[1.02] opacity-90"
                              : "cursor-not-allowed opacity-70"
                          }`}
                        >
                          <div 
                            className={`p-4 rounded-2xl border h-[120px] flex flex-col ${
                              isReady
                                ? "bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 border-amber-600/50 shadow-xl shadow-amber-900/30"
                                : isGenerating
                                ? "bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 border-blue-600/50 shadow-xl shadow-blue-900/30"
                                : "bg-neutral-900/80 border-neutral-800 hover:border-amber-600/50 hover:bg-neutral-800/80"
                            }`}
                          >
                            {/* Label "Tema X" alinhado à esquerda */}
                            <span className={`text-[10px] uppercase tracking-wider mb-1 text-left ${
                              isReady ? 'text-amber-300' : isGenerating ? 'text-blue-300' : 'text-neutral-500'
                            }`}>
                              Tema {tema.ordem}
                            </span>
                            
                            {/* Título completo sem abreviação */}
                            <h3 className={`font-semibold text-sm text-left ${
                              isReady || isGenerating ? 'text-white' : 'text-neutral-300'
                            }`}>
                              {tema.titulo}
                            </h3>
                            
                            {/* Páginas */}
                            <div className="flex items-center gap-2 text-xs mt-2">
                              <Clock className={`w-3 h-3 ${isReady ? 'text-amber-300' : isGenerating ? 'text-blue-300' : 'text-neutral-600'}`} />
                              <span className={isReady ? 'text-amber-300' : isGenerating ? 'text-blue-300' : 'text-neutral-500'}>
                                Págs. {tema.pagina_inicial}-{tema.pagina_final}
                              </span>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Book className="w-16 h-16 mx-auto mb-4 text-amber-500/50" />
                <h3 className="text-lg font-semibold text-white mb-2">Conteúdo em Preparação</h3>
                <p className="text-sm text-white/60 max-w-xs mx-auto">
                  O livro está sendo processado. Em breve os temas estarão disponíveis para estudo.
                </p>
                {(isProcessing || isAnalyzing || trilhaInfo?.status === 'extraindo' || trilhaInfo?.status === 'analisando' || trilhaInfo?.status === 'extraido') && (
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full text-amber-300 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAnalyzing ? "Identificando temas..." : "Processando PDF..."}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceitosLivro;
