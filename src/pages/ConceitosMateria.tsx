import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Layers, ImageIcon, FileText, RefreshCw, CheckCircle, ChevronRight, Target } from "lucide-react";
import { motion } from "framer-motion";
import { PdfProcessorModal } from "@/components/conceitos/PdfProcessorModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConceitosProgressBadge } from "@/components/conceitos/ConceitosProgressBadge";
import { useConceitosAutoGeneration } from "@/hooks/useConceitosAutoGeneration";
import { useAuth } from "@/contexts/AuthContext";

const ConceitosMateria = () => {
  const { id } = useParams<{ id: string }>();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const parsedMateriaId = id ? parseInt(id) : null;
  const { user } = useAuth();

  // Buscar matéria
  const { data: materia, isLoading: loadingMateria } = useQuery({
    queryKey: ["conceitos-materia", parsedMateriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_materias")
        .select("*")
        .eq("id", parsedMateriaId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!parsedMateriaId,
    staleTime: 1000 * 60 * 10,
  });

  // Buscar total de matérias
  const { data: totalMaterias } = useQuery({
    queryKey: ["conceitos-total-materias"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("conceitos_materias")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Buscar tópicos da matéria
  const { data: topicos, isLoading: loadingTopicos } = useQuery({
    queryKey: ["conceitos-topicos", parsedMateriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_topicos")
        .select("*")
        .eq("materia_id", parsedMateriaId!)
        .order("ordem");
      if (error) throw error;
      return data;
    },
    enabled: !!parsedMateriaId,
    staleTime: 1000 * 60 * 5,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasGenerating = data?.some(t => t.status === "gerando");
      const hasPending = data?.some(t => t.status === "pendente" || !t.status);
      return hasGenerating ? 3000 : (hasPending ? 5000 : false);
    },
  });

  // Buscar progresso do usuário em cada tópico
  const { data: progressoUsuario } = useQuery({
    queryKey: ["conceitos-topicos-progresso", parsedMateriaId, user?.id],
    queryFn: async () => {
      if (!user?.id || !topicos) return {};
      
      const topicoIds = topicos.map(t => t.id);
      const { data, error } = await supabase
        .from("oab_trilhas_estudo_progresso")
        .select("topico_id, leitura_completa, progresso_leitura")
        .eq("user_id", user.id)
        .in("topico_id", topicoIds);
      
      if (error) {
        console.error("Erro ao buscar progresso:", error);
        return {};
      }
      
      const progressoMap: Record<number, { leituraCompleta: boolean; progresso: number }> = {};
      data?.forEach(p => {
        progressoMap[p.topico_id] = {
          leituraCompleta: p.leitura_completa || false,
          progresso: p.progresso_leitura || 0
        };
      });
      return progressoMap;
    },
    enabled: !!user?.id && !!topicos && topicos.length > 0,
    staleTime: 1000 * 30,
  });

  // Hook de geração automática
  const {
    isGenerating,
    currentGeneratingTitle,
    currentProgress,
    totalTopicos: totalTopicosGerados,
    concluidos,
    pendentes,
    percentualGeral,
    getTopicoStatus,
  } = useConceitosAutoGeneration({
    materiaId: parsedMateriaId,
    topicos: topicos?.map(t => ({
      id: t.id,
      titulo: t.titulo,
      status: t.status,
      progresso: t.progresso,
      ordem: t.ordem,
    })),
    enabled: true,
  });

  const totalTopicosCount = topicos?.length || 0;
  
  // Calcular contagem de tópicos concluídos pelo usuário (leitura completa)
  const topicosConcluidosUsuario = Object.values(progressoUsuario || {}).filter(p => p.leituraCompleta).length;
  const topicosPendentesUsuario = totalTopicosCount - topicosConcluidosUsuario;

  const isLoading = loadingMateria || loadingTopicos;

  // Capa de fallback: usar capa da matéria ou gradiente
  const fallbackCapa = materia?.capa_url;

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0d0d14]/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate('/conceitos/trilhante')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>

      {/* Header com Capa de Fundo */}
      <div className="relative">
        {/* Imagem de Fundo */}
        <div className="absolute inset-0 h-48 overflow-hidden">
          {fallbackCapa ? (
            <img 
              src={fallbackCapa} 
              alt={materia?.nome}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d14]/60 via-[#0d0d14]/80 to-[#0d0d14]" />
        </div>

        {/* Conteúdo do Header */}
        <div className="relative z-10 px-4 pt-6 pb-4">
          <div className="max-w-lg mx-auto">
            {/* Badge + Título */}
            {materia && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-primary">
                      {materia.codigo}
                    </span>
                    <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                      {materia.nome}
                    </h1>
                  </div>
                </div>

                {/* Info - Contagem e Progresso */}
                <div className="rounded-xl p-3 bg-neutral-800/80 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span>{totalTopicosCount} tópicos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>{topicosConcluidosUsuario} concluídos</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{topicosPendentesUsuario} restantes</span>
                  </div>
                  
                  {/* Barra de progresso geral */}
                  <Progress 
                    value={totalTopicosCount > 0 ? (topicosConcluidosUsuario / totalTopicosCount) * 100 : 0} 
                    className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500" 
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Banner de conclusão */}
      {!isGenerating && concluidos === totalTopicosGerados && totalTopicosGerados > 0 && pendentes === 0 && (
        <div className="px-4 py-3">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-green-900/40 to-green-800/30 border border-green-500/30 rounded-xl p-3 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white">Todos os {totalTopicosGerados} conteúdos foram gerados!</span>
            </motion.div>
          </div>
        </div>
      )}

      {/* Label Conteúdo */}
      <div className="px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2 text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Conteúdo Programático</span>
        </div>
      </div>

      {/* Lista de Tópicos - Layout de Lista */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto space-y-3">
          {isLoading && !topicos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : topicos && topicos.length > 0 ? (
            topicos.map((topico, index) => {
              const topicoStatus = getTopicoStatus(topico.id);
              const temCapa = !!topico.capa_url;
              const progresso = progressoUsuario?.[topico.id];
              const leituraCompleta = progresso?.leituraCompleta || false;
              const progressoLeitura = progresso?.progresso || 0;
              
              return (
                <motion.button
                  key={topico.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/conceitos/topico/${topico.id}`)}
                  className={`w-full text-left bg-neutral-800 rounded-xl border overflow-hidden transition-all group ${
                    topico.status === "gerando"
                      ? "border-amber-500/50 bg-amber-900/20"
                      : "border-white/10 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center">
                    {/* Capa */}
                    <div className="w-20 h-20 flex-shrink-0 relative bg-neutral-900 overflow-hidden rounded-l-xl">
                      {(temCapa || fallbackCapa) ? (
                        <img 
                          src={topico.capa_url || fallbackCapa || ''}
                          alt={topico.titulo}
                          className="w-full h-full object-cover"
                          loading="eager"
                          fetchPriority="high"
                          decoding="sync"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                          <ImageIcon className="w-6 h-6 text-primary/50" />
                        </div>
                      )}
                      
                      {/* Badge do número no canto inferior esquerdo */}
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-xs font-bold bg-primary text-white">
                        {String(topico.ordem).padStart(2, '0')}
                      </div>
                      
                      {/* Indicador de geração sobreposto */}
                      {topico.status === "gerando" && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 p-3 flex flex-col justify-center min-h-[80px] relative">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-white transition-colors text-sm group-hover:text-primary flex-1 pr-2 line-clamp-2">
                          {topico.titulo}
                        </h3>
                        
                        {/* Ícone de conclusão ou badge de status */}
                        {leituraCompleta ? (
                          <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
                        ) : topicoStatus.status === "erro" ? (
                          <ConceitosProgressBadge
                            status={topicoStatus.status}
                            progresso={topicoStatus.progresso}
                            posicaoFila={topico.posicao_fila}
                          />
                        ) : topicoStatus.status === "na_fila" && topico.posicao_fila ? (
                          <ConceitosProgressBadge
                            status={topicoStatus.status}
                            progresso={topicoStatus.progresso}
                            posicaoFila={topico.posicao_fila}
                          />
                        ) : (
                          <ChevronRight className="w-5 h-5 flex-shrink-0 text-primary/50" />
                        )}
                      </div>
                      
                      {/* Barra de progresso do tópico */}
                      {topico.status === "concluido" && (
                        <div className="mt-1">
                          <Progress 
                            value={progressoLeitura} 
                            className="h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-orange-500" 
                          />
                          <span className="text-xs text-gray-500 mt-0.5 block">
                            {leituraCompleta ? "Concluído ✓" : `${progressoLeitura}% lido`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary" />
              <p className="text-lg font-medium text-white">Nenhum tópico encontrado</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Carregue um PDF para extrair os tópicos automaticamente</p>
              <Button 
                onClick={() => setShowPdfModal(true)}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <FileText className="w-4 h-4 mr-2" />
                Carregar PDF
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Botão de reprocessar PDF */}
      {topicos && topicos.length > 0 && (
        <div className="fixed bottom-20 right-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPdfModal(true)}
            className="rounded-full w-12 h-12 bg-[#12121a]/90 border-primary/30 hover:border-primary hover:bg-primary/10"
            title="Reprocessar PDF"
          >
            <RefreshCw className="w-5 h-5 text-primary" />
          </Button>
        </div>
      )}
      
      {/* Modal de processamento de PDF */}
      {materia && (
        <PdfProcessorModal
          open={showPdfModal}
          onOpenChange={setShowPdfModal}
          materiaId={parsedMateriaId!}
          materiaNome={materia.nome}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["conceitos-topicos"] });
            queryClient.invalidateQueries({ queryKey: ["conceitos-materia"] });
          }}
        />
      )}
    </div>
  );
};

export default ConceitosMateria;
