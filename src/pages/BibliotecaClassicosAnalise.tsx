import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, BookOpen, Sparkles, Play, CheckCircle2, Clock, AlertCircle, Footprints } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { InstantBackground } from "@/components/ui/instant-background";
import { UniversalImage } from "@/components/ui/universal-image";

// Imagem de fundo para "O Caso dos Exploradores de Cavernas"
import exploradoresCavernaBackground from "@/assets/backgrounds/exploradores-caverna.webp";

// Fundo padrão para outros livros clássicos
const defaultBackground = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80";

const getBackgroundForBook = (titulo: string | undefined): string => {
  if (!titulo) return defaultBackground;
  const lowerTitle = titulo.toLowerCase();
  if (lowerTitle.includes("caverna") || lowerTitle.includes("exploradores") || lowerTitle.includes("espeleolog")) {
    return exploradoresCavernaBackground;
  }
  return defaultBackground;
};

const BibliotecaClassicosAnalise = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  // Buscar livro
  const { data: livro, isLoading: isLoadingLivro, refetch: refetchLivro } = useQuery({
    queryKey: ["biblioteca-classicos-livro-analise", livroId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-CLASSICOS")
        .select("*")
        .eq("id", livroId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar temas
  const { data: temas, isLoading: isLoadingTemas, refetch: refetchTemas } = useQuery({
    queryKey: ["biblioteca-classicos-temas", livroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biblioteca_classicos_temas")
        .select("*")
        .eq("livro_id", parseInt(livroId || "0"))
        .order("ordem");

      if (error) throw error;
      return data;
    },
    enabled: !!livroId,
    staleTime: 0, // Sempre buscar dados atualizados para capas geradas em segundo plano
  });

  // Polling quando estiver processando
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (livro?.analise_status === 'extraindo' || livro?.analise_status === 'analisando') {
      interval = setInterval(() => {
        refetchLivro();
        refetchTemas();
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [livro?.analise_status, refetchLivro, refetchTemas]);

  const iniciarProcessamento = async () => {
    if (!livro?.download) {
      toast.error("Este livro não possui PDF para processamento");
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Iniciando extração do PDF...");

    try {
      const { data, error } = await supabase.functions.invoke('processar-pdf-classicos', {
        body: { 
          livroId: parseInt(livroId || "0"), 
          pdfUrl: livro.download 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || "Processamento iniciado!");
        refetchLivro();
        refetchTemas();
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Erro ao processar PDF:", error);
      toast.error(error.message || "Erro ao processar PDF");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'gerando':
        return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoadingLivro) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d14]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!livro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#0d0d14]">
        <p className="text-gray-400">Livro não encontrado</p>
        <Button onClick={() => navigate('/biblioteca-classicos')}>Voltar</Button>
      </div>
    );
  }

  const showProcessingUI = livro.analise_status === 'extraindo' || livro.analise_status === 'analisando' || isProcessing;
  const showTimeline = livro.analise_status === 'pronto' && temas && temas.length > 0;
  const showStartButton = !showProcessingUI && !showTimeline;
  const backgroundImage = getBackgroundForBook(livro.livro);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image com InstantBackground */}
      <InstantBackground
        src={backgroundImage}
        alt={livro.livro || ''}
        blurCategory="library"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate(`/biblioteca-classicos/${livroId}`)}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {livro.livro}
                </h1>
                <p className="text-sm text-gray-400">
                  Análise por Capítulos
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Estado: Iniciar Processamento */}
        {showStartButton && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
              Análise Profunda do Livro
            </h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Vamos extrair e analisar cada capítulo de "{livro.livro}" usando inteligência artificial para gerar uma análise completa e questões de estudo.
            </p>
            <Button
              onClick={iniciarProcessamento}
              size="lg"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar Análise
                </>
              )}
            </Button>
          </div>
        )}

        {/* Estado: Processando */}
        {showProcessingUI && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {livro.analise_status === 'extraindo' ? 'Extraindo texto do PDF...' : 'Analisando estrutura do livro...'}
            </h2>
            <p className="text-gray-400 mb-4">
              {processingMessage || 'Isso pode levar alguns minutos. Por favor, aguarde.'}
            </p>
            {livro.total_paginas && (
              <p className="text-sm text-amber-500">
                {livro.total_paginas} páginas sendo processadas
              </p>
            )}
          </div>
        )}

        {/* Estado: Timeline de Temas */}
        {showTimeline && (
          <div className="px-4 pb-24 pt-8">
            <div className="max-w-lg mx-auto relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {temas.length} Capítulos Identificados
                </h2>
                <span className="text-sm text-gray-400">
                  {livro.total_paginas || 0} páginas
                </span>
              </div>

              {/* Linha central da timeline */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                <div className="w-full h-full bg-gradient-to-b from-amber-500/80 via-amber-600/60 to-amber-700/40 rounded-full" />
                {/* Animação de fluxo elétrico */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-amber-300/30 to-transparent rounded-full"
                  animate={{ y: ["0%", "300%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="space-y-6">
                {temas.map((tema: any, index: number) => {
                  const isLeft = index % 2 === 0;
                  
                  return (
                    <motion.div
                      key={tema.id}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative flex items-center ${
                        isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                      }`}
                    >
                      {/* Marcador Pegada no centro */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(245, 158, 11, 0.4)",
                              "0 0 0 10px rgba(245, 158, 11, 0)",
                              "0 0 0 0 rgba(245, 158, 11, 0)"
                            ]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.3
                          }}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card do Tema */}
                      <button
                        onClick={() => navigate(`/biblioteca-classicos/${livroId}/analise/${tema.id}`)}
                        className="w-full text-left"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border transition-all overflow-hidden ${
                            tema.status === 'concluido' 
                              ? 'border-green-500/30 hover:border-green-500/50' 
                              : 'border-white/10 hover:border-amber-500/50'
                          }`}
                        >
                          {/* Capa do tema se disponível */}
                          {tema.capa_url && (
                            <div className="h-20 w-full overflow-hidden">
                              <UniversalImage
                                src={tema.capa_url}
                                alt={tema.titulo}
                                priority={index < 4}
                                blurCategory="book"
                                containerClassName="w-full h-full"
                              />
                            </div>
                          )}
                          
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-amber-500 font-medium mb-1">
                                  Capítulo {tema.ordem}
                                </p>
                                <h3 className="font-medium text-[13px] leading-snug text-white line-clamp-2">
                                  {tema.titulo}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  Páginas {tema.pagina_inicial}-{tema.pagina_final}
                                </p>
                                {/* Indicador de status */}
                                {tema.status === 'pendente' && (
                                  <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Clique para gerar análise
                                  </p>
                                )}
                                {tema.status === 'concluido' && (
                                  <p className="text-xs text-green-400/80 mt-2 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Análise pronta
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                {getStatusIcon(tema.status)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibliotecaClassicosAnalise;
