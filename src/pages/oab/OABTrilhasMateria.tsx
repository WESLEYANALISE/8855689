import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, ImageIcon, Footprints, FileText, RefreshCw, Sparkles, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import bgMateriasOab from "@/assets/bg-materias-oab.webp";
import { OABPdfProcessorModal } from "@/components/oab/OABPdfProcessorModal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOABTrilhasAutoGeneration } from "@/hooks/useOABTrilhasAutoGeneration";
import { OABTrilhasProgressBadge } from "@/components/oab/OABTrilhasProgressBadge";
import { toast } from "sonner";
import { InstantBackground } from "@/components/ui/instant-background";
import { UniversalImage } from "@/components/ui/universal-image";

const OABTrilhasMateria = () => {
  const { materiaId } = useParams<{ materiaId: string }>();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const parsedMateriaId = materiaId ? parseInt(materiaId) : null;

  // Buscar área (antiga "matéria") pelo ID
  // CACHE FIRST: Mostra dados em cache imediatamente
  const { data: area, isLoading: loadingArea } = useQuery({
    queryKey: ["oab-trilha-area", parsedMateriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_trilhas_materias")
        .select("*")
        .eq("id", parsedMateriaId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!parsedMateriaId,
    staleTime: 1000 * 60 * 10, // Cache válido por 10 minutos (área muda pouco)
    gcTime: 1000 * 60 * 60, // Manter em cache por 1 hora
  });

  // Buscar total de áreas ativas
  const { data: totalAreas } = useQuery({
    queryKey: ["oab-trilhas-total-areas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("oab_trilhas_materias")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);
      if (error) throw error;
      return count || 0;
    },
  });

  // Buscar matérias (antigos "tópicos") da área
  // CACHE FIRST: Mostra dados em cache imediatamente enquanto revalida
  const { data: materias, isLoading: loadingMaterias } = useQuery({
    queryKey: ["oab-trilha-materias-da-area", parsedMateriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_trilhas_topicos")
        .select("*")
        .eq("materia_id", parsedMateriaId!)
        .order("ordem");
      if (error) throw error;
      return data;
    },
    enabled: !!parsedMateriaId,
    staleTime: 1000 * 60 * 5, // Cache válido por 5 minutos
    gcTime: 1000 * 60 * 30, // Manter em cache por 30 minutos
    refetchOnMount: "always", // Sempre revalida, mas mostra cache primeiro
    refetchInterval: (query) => {
      const data = query.state.data;
      // Refetch enquanto houver algum tópico em geração ou pendente
      const hasGenerating = data?.some(t => t.status === "gerando");
      const hasPending = data?.some(t => t.status === "pendente" || !t.status);
      const hasPendingCapa = data?.some(t => t.status === "concluido" && !t.capa_url);
      return hasGenerating || hasPendingCapa ? 3000 : (hasPending ? 5000 : false);
    },
  });

  // Hook de geração automática em cascata
  const {
    isGenerating,
    currentGeneratingTitle,
    currentProgress,
    totalTopicos: totalTopicosGerados,
    concluidos,
    pendentes,
    percentualGeral,
    getTopicoStatus,
  } = useOABTrilhasAutoGeneration({
    materiaId: parsedMateriaId,
    topicos: materias?.map(m => ({
      id: m.id,
      titulo: m.titulo,
      status: m.status,
      progresso: m.progresso,
      ordem: m.ordem,
    })),
    enabled: true,
  });

  // Buscar contagem de subtemas (da tabela RESUMO) para cada matéria
  const { data: subtemasCount } = useQuery({
    queryKey: ["oab-trilha-subtemas-count", parsedMateriaId, materias?.map(m => m.titulo)],
    queryFn: async () => {
      if (!materias || !area) return {};
      
      const counts: Record<string, number> = {};
      
      for (const materia of materias) {
        const { count, error } = await supabase
          .from("RESUMO")
          .select("*", { count: "exact", head: true })
          .eq("area", area.nome)
          .eq("tema", materia.titulo);
        
        if (!error) {
          counts[materia.titulo] = count || 0;
        }
      }
      
      return counts;
    },
    enabled: !!materias && materias.length > 0 && !!area,
  });

  // Mutation para gerar capa única da matéria
  const gerarCapaMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-capa-unica-materia", {
        body: { materia_id: parsedMateriaId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url && !data?.cached) {
        toast.success(`Capa gerada para ${data?.materia || 'matéria'}`);
      }
      queryClient.invalidateQueries({ queryKey: ["oab-trilha-materias-da-area", parsedMateriaId] });
    },
    onError: (error) => {
      console.error("[Capa] Erro ao gerar capa:", error);
    },
  });

  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(subtemasCount || {}).reduce((a, b) => a + b, 0);
  const isLoading = loadingArea || loadingMaterias;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background com InstantBackground */}
      <InstantBackground
        src={bgMateriasOab}
        alt="OAB"
        blurCategory="oab"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button 
              onClick={() => navigate('/oab/trilhas-aprovacao')}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            {area && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Scale className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-red-400">
                      Área {area.ordem} de {totalAreas || '...'}
                    </span>
                    <h1 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                      {area.nome}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                      {totalMaterias} matérias · {totalTopicos} tópicos
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
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>{totalMaterias} matérias</span>
            </div>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-yellow-400" />
              <span>{totalTopicos} tópicos</span>
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

        {/* Timeline de Matérias - Só mostra loading se não tem cache */}
        {isLoading && !materias ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : materias && materias.length > 0 ? (
          <div className="px-4 pb-24 pt-4">
            <div className="max-w-lg mx-auto relative">
              {/* Linha central da timeline - SEMPRE VERMELHA */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
                {/* Animação de fluxo elétrico */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                  animate={{ y: ["0%", "300%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              <div className="space-y-6">
                {materias.map((materia, index) => {
                  const isLeft = index % 2 === 0;
                  const temCapa = !!materia.capa_url;
                  
                  return (
                    <motion.div
                      key={materia.id}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative flex items-center ${
                        isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                      }`}
                    >
                      {/* Marcador Pegada no centro - SEMPRE VERMELHO */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(239, 68, 68, 0.4)",
                              "0 0 0 10px rgba(239, 68, 68, 0)",
                              "0 0 0 0 rgba(239, 68, 68, 0.4)"
                            ]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card da Matéria - SEMPRE VERMELHO */}
                      <div className="w-full">
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/oab/trilhas-aprovacao/materia/${parsedMateriaId}/topicos/${materia.id}`)}
                          className="cursor-pointer rounded-2xl backdrop-blur-sm border transition-all overflow-hidden min-h-[180px] flex flex-col bg-[#12121a]/90 border-white/10 hover:border-red-500/50"
                        >
                          {/* Capa da matéria - usa capa do tópico OU da área (matéria) como fallback */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {(temCapa || area?.capa_url) ? (
                              <>
                                <UniversalImage
                                  src={materia.capa_url || area?.capa_url || ''}
                                  alt={materia.titulo}
                                  priority={index < 4}
                                  blurCategory="oab"
                                  containerClassName="w-full h-full"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800 to-red-900">
                                <ImageIcon className="w-8 h-8 text-white/30" />
                              </div>
                            )}
                            
                            {/* Badge de progresso de geração */}
                            {(() => {
                              const topicoStatus = getTopicoStatus(materia.id);
                              return (
                                <OABTrilhasProgressBadge
                                  status={topicoStatus.status}
                                  progresso={topicoStatus.progresso}
                                />
                              );
                            })()}
                            
                            {/* Badge "Matéria X" dentro da capa */}
                            <div className="absolute bottom-2 left-3">
                              <p className="text-xs font-semibold drop-shadow-lg text-red-400">
                                Matéria {materia.ordem}
                              </p>
                            </div>
                          </div>
                          
                          {/* Conteúdo */}
                          <div className="flex-1 p-3 flex flex-col">
                            <h3 className="font-medium text-[13px] leading-snug text-white">
                              {materia.titulo}
                            </h3>
                            
                            {/* Quantidade de tópicos */}
                            <div className="flex items-center gap-1.5 mt-auto pt-2">
                              <BookOpen className="w-3 h-3 text-red-400/70" />
                              <span className="text-xs text-gray-400">{subtemasCount?.[materia.titulo] || 0} tópicos</span>
                            </div>
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
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-red-400" />
            <p className="text-lg font-medium text-white">Nenhuma matéria encontrada</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">Carregue um PDF para extrair as matérias automaticamente</p>
            <Button 
              onClick={() => setShowPdfModal(true)}
              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
            >
              <FileText className="w-4 h-4 mr-2" />
              Carregar PDF
            </Button>
          </div>
        )}
        
        {/* Botão de reprocessar PDF no canto (quando já tem matérias) */}
        {materias && materias.length > 0 && (
          <div className="fixed bottom-20 right-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPdfModal(true)}
              className="rounded-full w-12 h-12 bg-[#12121a]/90 border-red-500/30 hover:border-red-500 hover:bg-red-500/10"
              title="Reprocessar PDF"
            >
              <RefreshCw className="w-5 h-5 text-red-400" />
            </Button>
          </div>
        )}
        
        {/* Modal de processamento de PDF */}
        {area && (
          <OABPdfProcessorModal
            open={showPdfModal}
            onOpenChange={setShowPdfModal}
            materiaId={parsedMateriaId!}
            materiaNome={area.nome}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["oab-trilha-materias-da-area"] });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OABTrilhasMateria;
