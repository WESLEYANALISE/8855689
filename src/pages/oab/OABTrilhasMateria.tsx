import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, ImageIcon, Footprints, FileText, RefreshCw, Sparkles, CheckCircle, Search, X } from "lucide-react";
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
import { FloatingScrollButton } from "@/components/ui/FloatingScrollButton";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

const SCROLL_KEY_PREFIX = "oab-trilhas-scroll-materia";

const OABTrilhasMateria = () => {
  const { materiaId } = useParams<{ materiaId: string }>();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const parsedMateriaId = materiaId ? parseInt(materiaId) : null;

  // Restaurar posição do scroll ao voltar
  useEffect(() => {
    const savedScroll = sessionStorage.getItem(`${SCROLL_KEY_PREFIX}-${parsedMateriaId}`);
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll));
        sessionStorage.removeItem(`${SCROLL_KEY_PREFIX}-${parsedMateriaId}`);
      }, 100);
    }
  }, [parsedMateriaId]);

  // Função para navegar salvando scroll
  const navigateWithScroll = (path: string) => {
    sessionStorage.setItem(`${SCROLL_KEY_PREFIX}-${parsedMateriaId}`, window.scrollY.toString());
    navigate(path);
  };

  // Buscar área - CACHE INFINITO para navegação instantânea
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
    staleTime: Infinity,
    gcTime: Infinity,
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

  // Buscar matérias - CACHE INFINITO + refetch apenas durante geração
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
    staleTime: Infinity, // Cache infinito quando não há geração
    gcTime: Infinity,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Só refetch se há geração ativa (intervalo maior de 5s)
      const hasGenerating = data?.some(t => t.status === "gerando" || t.status === "na_fila");
      return hasGenerating ? 5000 : false;
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
      posicao_fila: m.posicao_fila,
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

  // Buscar progresso de estudo por matéria (para cada tópico dessa área)
  const { data: progressoMateria } = useQuery({
    queryKey: ["oab-trilha-progresso-materia", parsedMateriaId, user?.id, materias?.map(m => m.id)],
    queryFn: async () => {
      if (!user || !materias || !area) return {};
      
      const progressos: Record<number, number> = {};
      
      for (const materia of materias) {
        // Buscar os subtemas (RESUMO) desta matéria
        const { data: subtemas } = await supabase
          .from("RESUMO")
          .select("id")
          .eq("area", area.nome)
          .eq("tema", materia.titulo);
        
        if (!subtemas || subtemas.length === 0) {
          progressos[materia.id] = 0;
          continue;
        }
        
        // Buscar progresso de cada subtema
        const subtemaIds = subtemas.map(s => s.id);
        const { data: progressoData } = await supabase
          .from("oab_trilhas_estudo_progresso")
          .select("topico_id, leitura_completa, progresso_flashcards, progresso_questoes")
          .eq("user_id", user.id)
          .in("topico_id", subtemaIds);
        
        if (!progressoData || progressoData.length === 0) {
          progressos[materia.id] = 0;
          continue;
        }
        
        // Calcular média de progresso (leitura=33%, flashcards=33%, questões=33%)
        let totalProgresso = 0;
        for (const subtemaId of subtemaIds) {
          const p = progressoData.find(pd => pd.topico_id === subtemaId);
          if (p) {
            const leituraPct = p.leitura_completa ? 33 : 0;
            const flashcardsPct = (p.progresso_flashcards || 0) * 0.33;
            const questoesPct = (p.progresso_questoes || 0) * 0.34;
            totalProgresso += leituraPct + flashcardsPct + questoesPct;
          }
        }
        
        progressos[materia.id] = Math.round(totalProgresso / subtemaIds.length);
      }
      
      return progressos;
    },
    enabled: !!user && !!materias && materias.length > 0 && !!area,
    staleTime: 1000 * 60 * 2,
  });


  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(subtemasCount || {}).reduce((a, b) => a + b, 0);
  const isLoading = loadingArea || loadingMaterias;

  // Filtrar matérias baseado na pesquisa
  const filteredMaterias = useMemo(() => {
    if (!materias) return [];
    if (!searchTerm.trim()) return materias;
    
    const term = searchTerm.toLowerCase().trim();
    return materias.filter(m => 
      m.titulo.toLowerCase().includes(term)
    );
  }, [materias, searchTerm]);

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
                      {totalMaterias} matérias · {totalTopicos} aulas
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
              <span>{totalTopicos} aulas</span>
            </div>
          </div>

          {/* Banner de geração em andamento */}
          {isGenerating && currentGeneratingTitle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-gradient-to-r from-amber-900/40 to-amber-800/30 border border-amber-500/30 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-sm text-white truncate">Gerando: {currentGeneratingTitle?.toLowerCase().replace(/(?:^|\s)\S/g, (l) => l.toUpperCase())}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={currentProgress} 
                  className="h-2 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" 
                />
                <span className="text-sm font-bold text-amber-400 min-w-[40px] text-right">{currentProgress}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{concluidos} de {totalTopicosGerados} concluídos • {pendentes} pendentes</p>
            </motion.div>
          )}

        </div>

        {/* Barra de Pesquisa */}
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar matéria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                {filteredMaterias.length} matéria{filteredMaterias.length !== 1 ? 's' : ''} encontrada{filteredMaterias.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
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
                {filteredMaterias.map((materia, index) => {
                  const isLeft = index % 2 === 0;
                  
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
                          onClick={() => navigateWithScroll(`/oab/trilhas-aprovacao/materia/${parsedMateriaId}/topicos/${materia.id}`)}
                          className="cursor-pointer rounded-2xl backdrop-blur-sm border transition-all overflow-hidden min-h-[180px] flex flex-col bg-[#12121a]/90 border-white/10 hover:border-red-500/50"
                        >
                          {/* Capa da matéria - SEMPRE usa capa da ÁREA */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {area?.capa_url ? (
                              <UniversalImage
                                src={area.capa_url}
                                alt={materia.titulo}
                                priority={index < 4}
                                blurCategory="oab"
                                containerClassName="w-full h-full"
                              />
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
                                  posicaoFila={materia.posicao_fila}
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
                            
                            {/* Quantidade de aulas */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <BookOpen className="w-3 h-3 text-red-400/70" />
                              <span className="text-xs text-gray-400">{subtemasCount?.[materia.titulo] || 0} aulas</span>
                            </div>
                            
                            {/* Barra de progresso */}
                            <div className="mt-auto pt-2">
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 ease-out rounded-full"
                                  style={{ width: `${progressoMateria?.[materia.id] || 0}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 text-right">{progressoMateria?.[materia.id] || 0}% concluído</p>
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
        
        {/* Botão flutuante de scroll */}
        <FloatingScrollButton />
        
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
