import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Footprints, GraduationCap, Loader2, ImagePlus, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import themisBackground from "@/assets/themis-estudos-background.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { UniversalImage } from "@/components/ui/universal-image";
import { FloatingScrollButton } from "@/components/ui/FloatingScrollButton";

const ConceitosTrilhante = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  // Buscar todas as matérias do Trilhante
  const { data: materias, isLoading } = useQuery({
    queryKey: ["conceitos-materias-trilhante"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_materias")
        .select("*")
        .eq("ativo", true)
        .order("area_ordem", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Buscar contagem de tópicos por matéria e total de páginas
  const { data: topicosCount } = useQuery({
    queryKey: ["conceitos-topicos-count-materia"],
    queryFn: async () => {
      const counts: Record<number, number> = {};
      
      const { data: topicos } = await supabase
        .from("conceitos_topicos")
        .select("materia_id");
      
      if (!topicos) return counts;
      
      for (const topico of topicos) {
        counts[topico.materia_id] = (counts[topico.materia_id] || 0) + 1;
      }
      
      return counts;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Buscar total de páginas (slides) de todos os tópicos
  const { data: totalPaginas } = useQuery({
    queryKey: ["conceitos-total-paginas"],
    queryFn: async () => {
      const { data: topicos } = await supabase
        .from("conceitos_topicos")
        .select("slides_json");
      
      if (!topicos) return 0;
      
      let total = 0;
      for (const topico of topicos) {
        if (topico.slides_json) {
          try {
            const slides = typeof topico.slides_json === 'string' 
              ? JSON.parse(topico.slides_json) 
              : topico.slides_json;
            // Contar slides de todas as seções
            if (slides.secoes && Array.isArray(slides.secoes)) {
              for (const secao of slides.secoes) {
                if (secao.slides && Array.isArray(secao.slides)) {
                  total += secao.slides.length;
                }
              }
            }
          } catch {
            // Ignora erro de parse
          }
        }
      }
      
      return total;
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleGerarCapa = async (materiaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingId(materiaId);
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-capa-conceitos-materia', {
        body: { materiaId }
      });
      
      if (error) throw error;
      
      toast.success("Capa gerada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["conceitos-materias-trilhante"] });
    } catch (err: any) {
      console.error("Erro ao gerar capa:", err);
      toast.error("Erro ao gerar capa: " + (err.message || "Tente novamente"));
    } finally {
      setGeneratingId(null);
    }
  };

  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d14]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image com InstantBackground */}
      <InstantBackground
        src={themisBackground}
        alt="Themis"
        blurCategory="estudos"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate('/primeiros-passos')}
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
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  Conceitos
                </h1>
                <p className="text-sm text-gray-400">
                  Fundamentos do Direito
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info Stats */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-white/80">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <span>{totalMaterias} matérias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              <span>{totalTopicos} tópicos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              <span>{totalPaginas || 0} páginas</span>
            </div>
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
                {materias.map((materia, index) => {
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
                      {/* Marcador Pegada no centro */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(239, 68, 68, 0.4)",
                              "0 0 0 10px rgba(239, 68, 68, 0)",
                              "0 0 0 0 rgba(239, 68, 68, 0)"
                            ]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.3
                          }}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card da Matéria - Altura fixa */}
                      <div className="w-full">
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all overflow-hidden min-h-[200px] flex flex-col"
                        >
                          {/* Capa da matéria com Tema dentro */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {temCapa ? (
                              <>
                                <UniversalImage
                                  src={materia.capa_url!}
                                  alt={materia.nome}
                                  priority={index < 4}
                                  blurCategory="course"
                                  containerClassName="w-full h-full"
                                />
                                {/* Gradiente escuro para destaque do texto */}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              </>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <button
                                  onClick={(e) => handleGerarCapa(materia.id, e)}
                                  disabled={isGenerating}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
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
                            
                            {/* Tema dentro da capa */}
                            <div className="absolute bottom-2 left-3">
                              <p className="text-xs text-red-400 font-semibold drop-shadow-lg">
                                Tema {materia.area_ordem}
                              </p>
                            </div>
                          </div>
                          
                          {/* Conteúdo clicável */}
                          <button
                            onClick={() => navigate(`/conceitos/materia/${materia.id}`)}
                            className="flex-1 p-3 text-left flex flex-col"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium text-[13px] leading-snug text-white">
                                {materia.nome}
                              </h3>
                              
                              {/* Contagem de tópicos */}
                              <div className="flex items-center gap-1 mt-2">
                                <BookOpen className="w-3 h-3 text-yellow-400" />
                                <span className="text-xs text-yellow-400 font-medium">{topicos} tópicos</span>
                              </div>
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
        
        {/* Botão flutuante de scroll */}
        <FloatingScrollButton />
      </div>
    </div>
  );
};

export default ConceitosTrilhante;
