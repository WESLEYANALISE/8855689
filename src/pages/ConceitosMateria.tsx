import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Layers, ImageIcon, Footprints, FileText, RefreshCw, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { PdfProcessorModal } from "@/components/conceitos/PdfProcessorModal";
import { Button } from "@/components/ui/button";
import { useOABTrilhasAutoGeneration } from "@/hooks/useOABTrilhasAutoGeneration";
import { ConceitosProgressBadge } from "@/components/conceitos/ConceitosProgressBadge";
import { useConceitosAutoGeneration } from "@/hooks/useConceitosAutoGeneration";

const ConceitosMateria = () => {
  const { id } = useParams<{ id: string }>();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const parsedMateriaId = id ? parseInt(id) : null;

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
  const isLoading = loadingMateria || loadingTopicos;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#0d0d14] via-[#12121a] to-[#0d0d14]">
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button 
              onClick={() => navigate('/conceitos/trilhante')}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            {materia && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Layers className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-primary">
                      {materia.codigo}
                    </span>
                    <h1 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                      {materia.nome}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                      {totalTopicosCount} tópicos
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>{totalTopicosCount} tópicos</span>
            </div>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-yellow-400" />
              <span>{concluidos} prontos</span>
            </div>
          </div>

          {/* Banner de conclusão */}
          {!isGenerating && concluidos === totalTopicosGerados && totalTopicosGerados > 0 && pendentes === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-gradient-to-r from-green-900/40 to-green-800/30 border border-green-500/30 rounded-xl p-3 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white">Todos os {totalTopicosGerados} conteúdos foram gerados!</span>
            </motion.div>
          )}
        </div>

        {/* Timeline de Tópicos */}
        {isLoading && !topicos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : topicos && topicos.length > 0 ? (
          <div className="px-4 pb-24 pt-4">
            <div className="max-w-lg mx-auto relative">
              {/* Linha central da timeline */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                <div className="w-full h-full bg-gradient-to-b from-primary/80 via-primary/60 to-primary/40 rounded-full" />
                {/* Animação de fluxo */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-primary/30 to-transparent rounded-full"
                  animate={{ y: ["0%", "300%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              <div className="space-y-6">
                {topicos.map((topico, index) => {
                  const isLeft = index % 2 === 0;
                  const temCapa = !!topico.capa_url;
                  const topicoStatus = getTopicoStatus(topico.id);
                  
                  return (
                    <motion.div
                      key={topico.id}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
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
                              "0 0 0 0 rgba(var(--primary), 0.4)",
                              "0 0 0 10px rgba(var(--primary), 0)",
                              "0 0 0 0 rgba(var(--primary), 0.4)"
                            ]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-primary to-primary/70 shadow-primary/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card do Tópico */}
                      <div className="w-full">
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/conceitos/topico/${topico.id}`)}
                          className={`cursor-pointer rounded-2xl backdrop-blur-sm border transition-all overflow-hidden min-h-[180px] flex flex-col ${
                            topico.status === "gerando"
                              ? "bg-amber-500/10 border-amber-500/30"
                              : "bg-[#12121a]/90 border-white/10 hover:border-primary/50"
                          }`}
                        >
                          {/* Capa do tópico */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {(temCapa || materia?.capa_url) ? (
                              <>
                                <img
                                  src={topico.capa_url || materia?.capa_url || ''}
                                  alt={topico.titulo}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                                <ImageIcon className="w-8 h-8 text-white/30" />
                              </div>
                            )}
                            
                            {/* Badge de progresso de geração */}
                            <ConceitosProgressBadge
                              status={topicoStatus.status}
                              progresso={topicoStatus.progresso}
                              posicaoFila={topico.posicao_fila}
                            />
                            
                            {/* Badge "Tópico X" dentro da capa */}
                            <div className="absolute bottom-2 left-3">
                              <p className="text-xs font-semibold drop-shadow-lg text-primary">
                                Tópico {topico.ordem}
                              </p>
                            </div>
                            
                            {/* Indicador de geração sobreposto */}
                            {topico.status === "gerando" && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 p-3 flex flex-col">
                            <h3 className="font-medium text-[13px] leading-snug text-white">
                              {topico.titulo}
                            </h3>
                            
                            {/* Páginas */}
                            {topico.pagina_inicial && topico.pagina_final && (
                              <div className="flex items-center gap-1.5 mt-auto pt-2">
                                <BookOpen className="w-3 h-3 text-primary/70" />
                                <span className="text-xs text-gray-400">
                                  págs {topico.pagina_inicial}-{topico.pagina_final}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 px-4">
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
    </div>
  );
};

export default ConceitosMateria;
