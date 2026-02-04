import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Footprints, Scale, Loader2, ImagePlus, FileText, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";
import { Input } from "@/components/ui/input";

// Função de preload local para capas do Supabase
const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    if (url) {
      const img = new Image();
      img.src = getOptimizedImageUrl(url, 'card-lg');
    }
  });
};

export default function TrilhasAprovacao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar todas as matérias da OAB - CACHE INFINITO para navegação instantânea
  const { data: materias, isLoading } = useQuery({
    queryKey: ["oab-trilhas-materias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oab_trilhas_materias")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: Infinity, // Cache infinito - NUNCA refetch automático
    gcTime: Infinity,    // Manter em cache para sempre durante a sessão
  });

  // Buscar contagem de tópicos por matéria - CACHE INFINITO
  const { data: topicosCount } = useQuery({
    queryKey: ["oab-trilhas-topicos-count"],
    queryFn: async () => {
      const counts: Record<number, number> = {};
      
      // Buscar contagem da tabela unificada
      const { data: topicos } = await supabase
        .from("oab_trilhas_topicos")
        .select("materia_id");
      
      if (topicos) {
        topicos.forEach(t => {
          counts[t.materia_id] = (counts[t.materia_id] || 0) + 1;
        });
      }
      
      // Ética Profissional também pode vir de oab_etica_topicos (legado)
      const { data: eticaTopicos } = await supabase
        .from("oab_etica_topicos")
        .select("tema_id");
      
      // Buscar ID da matéria Ética Profissional
      const { data: eticaMateria } = await supabase
        .from("oab_trilhas_materias")
        .select("id")
        .ilike("nome", "%ética%")
        .maybeSingle();
      
      if (eticaTopicos && eticaMateria) {
        counts[eticaMateria.id] = (counts[eticaMateria.id] || 0) + eticaTopicos.length;
      }
      
      return counts;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Buscar contagem total de subtemas (tópicos) da tabela RESUMO
  const { data: totalSubtemas } = useQuery({
    queryKey: ["oab-trilhas-total-subtemas"],
    queryFn: async () => {
      const { count } = await supabase
        .from("RESUMO")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleGerarCapa = async (materiaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingId(materiaId);
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-capa-oab-materia', {
        body: { materiaId }
      });
      
      if (error) throw error;
      
      toast.success("Capa gerada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["oab-trilhas-materias"] });
    } catch (err: any) {
      console.error("Erro ao gerar capa:", err);
      toast.error("Erro ao gerar capa: " + (err.message || "Tente novamente"));
    } finally {
      setGeneratingId(null);
    }
  };

  // Handler para navegação - UNIFICADO (Ética vai para mesma rota)
  const handleNavigate = (materia: { id: number; nome: string }) => {
    // Ética Profissional vai para página especial (ainda mantém legado por enquanto)
    if (materia.nome.toLowerCase().includes("ética")) {
      navigate('/oab/trilhas-etica');
    } else {
      // Navegar para nova página de matéria
      navigate(`/oab/trilhas-aprovacao/materia/${materia.id}`);
    }
  };

  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a: number, b: number) => a + b, 0);

  // Filtrar matérias baseado na pesquisa
  const filteredMaterias = useMemo(() => {
    if (!materias) return [];
    if (!searchTerm.trim()) return materias;
    
    const term = searchTerm.toLowerCase().trim();
    return materias.filter(m => 
      m.nome.toLowerCase().includes(term)
    );
  }, [materias, searchTerm]);

  // Preload das capas + PREFETCH de todas as matérias para navegação instantânea
  useEffect(() => {
    if (materias && materias.length > 0) {
      // Preload imagens
      const capaUrls = materias
        .map(m => m.capa_url)
        .filter(Boolean) as string[];
      if (capaUrls.length > 0) {
        preloadImages(capaUrls);
      }
      
      // Prefetch de todas as matérias de cada área em background
      materias.forEach(materia => {
        queryClient.prefetchQuery({
          queryKey: ["oab-trilha-materias-da-area", materia.id],
          queryFn: async () => {
            const { data, error } = await supabase
              .from("oab_trilhas_topicos")
              .select("*")
              .eq("materia_id", materia.id)
              .order("ordem");
            if (error) throw error;
            return data;
          },
          staleTime: Infinity,
        });
      });
    }
  }, [materias, queryClient]);

  // Só mostra loading se não tem dados em cache
  if (isLoading && !materias) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d14]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Otimizado para carregamento instantâneo */}
      <div className="fixed inset-0">
        <img 
          src={bgAreasOab}
          alt="Background Trilhas"
          className="w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate('/oab/primeira-fase')}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  Trilhas da Aprovação
                </h1>
                <p className="text-sm text-gray-400">
                  OAB 1ª Fase
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info Stats */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>{totalMaterias} áreas</span>
            </div>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-yellow-400" />
              <span>{totalTopicos} matérias</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>{totalSubtemas || 0} tópicos</span>
            </div>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="px-4 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar área do direito..."
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
                {filteredMaterias.length} área{filteredMaterias.length !== 1 ? 's' : ''} encontrada{filteredMaterias.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Timeline de Matérias */}
        {materias && (
          <div className="px-4 pb-24 pt-4">
            <div className="max-w-lg mx-auto relative">
              {/* Linha central da timeline */}
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
                  const topicos = topicosCount?.[materia.id] || 0;
                  const temCapa = !!materia.capa_url;
                  const isGenerating = generatingId === materia.id;
                  
                  // Simular progresso (em produção, isso viria do banco de dados)
                  const progressoPercentual = 0; // TODO: buscar progresso real do usuário
                  
                  return (
                    <motion.div
                      key={materia.id}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
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
                            delay: index * 0.3
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card da Matéria - Altura fixa - SEMPRE VERMELHO */}
                      <div className="w-full">
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="rounded-2xl backdrop-blur-sm border transition-all overflow-hidden min-h-[200px] flex flex-col bg-[#12121a]/90 border-white/10 hover:border-red-500/50"
                        >
                          {/* Capa da matéria com Tema dentro */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {temCapa ? (
                              <>
                                <img 
                                  src={materia.capa_url!} 
                                  alt={materia.nome}
                                  className="w-full h-full object-cover"
                                  loading="eager"
                                  fetchPriority="high"
                                  decoding="sync"
                                />
                                {/* Gradiente escuro para destaque do texto */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                                
                                {/* Botão Regenerar Capa */}
                                <button
                                  onClick={(e) => handleGerarCapa(materia.id, e)}
                                  disabled={isGenerating}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-500/80 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Regenerar capa da área"
                                >
                                  {isGenerating ? (
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                  ) : (
                                    <ImagePlus className="w-4 h-4 text-white" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <button
                                  onClick={(e) => handleGerarCapa(materia.id, e)}
                                  disabled={isGenerating}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors disabled:opacity-50 bg-red-600/80 hover:bg-red-600"
                                >
                                  {isGenerating ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Gerando...
                                    </>
                                  ) : (
                                    <>
                                      <ImagePlus className="w-4 h-4" />
                                      Gerar Capa
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                            
                            {/* Área dentro da capa */}
                            <div className="absolute bottom-2 left-3">
                              <p className="text-xs font-semibold drop-shadow-lg text-red-400">
                                Área {materia.ordem}
                              </p>
                            </div>
                          </div>
                          
                          {/* Conteúdo clicável */}
                          <button
                            onClick={() => handleNavigate(materia)}
                            className="flex-1 p-3 text-left flex flex-col"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium text-[13px] leading-snug text-white">
                                {materia.nome}
                              </h3>
                              
                              {/* Contagem de matérias */}
                              {topicos > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <BookOpen className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs text-yellow-400 font-medium">{topicos} matérias</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Barra de progresso */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-500">Progresso</span>
                                <span className="text-[10px] text-green-400 font-medium">{progressoPercentual}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                                  style={{ width: `${progressoPercentual}%` }}
                                />
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      </div>
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
}
