import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Footprints, Crown, Loader2, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import dominandoHeroThemis from "@/assets/dominando-hero-themis.webp";

export default function DominandoTrilhas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  // Buscar áreas do Dominando
  const { data: areas, isLoading } = useQuery({
    queryKey: ["dominando-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dominando_areas")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Buscar contagem de disciplinas por área da BIBLIOTECA-ESTUDOS
  const { data: disciplinasCount } = useQuery({
    queryKey: ["dominando-disciplinas-count"],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      
      const { data: disciplinas } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("Área");
      
      if (disciplinas) {
        disciplinas.forEach(d => {
          if (d["Área"]) {
            counts[d["Área"]] = (counts[d["Área"]] || 0) + 1;
          }
        });
      }
      
      return counts;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const handleGerarCapa = async (areaId: number, areaNome: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingId(areaId);
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-capa-dominando-area', {
        body: { areaId, areaNome }
      });
      
      if (error) throw error;
      
      toast.success("Capa gerada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["dominando-areas"] });
    } catch (err: any) {
      console.error("Erro ao gerar capa:", err);
      toast.error("Erro ao gerar capa: " + (err.message || "Tente novamente"));
    } finally {
      setGeneratingId(null);
    }
  };

  const handleNavigate = (area: { id: number; nome: string }) => {
    navigate(`/dominando/area/${encodeURIComponent(area.nome)}`);
  };

  const totalAreas = areas?.length || 0;
  const totalDisciplinas = Object.values(disciplinasCount || {}).reduce((a: number, b: number) => a + b, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d14]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0d0d14]">
      {/* Background image - Deusa da Justiça */}
      <div className="fixed inset-0 z-0">
        <img
          src={dominandoHeroThemis}
          alt="Deusa da Justiça"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d14]/60 via-[#0d0d14]/80 to-[#0d0d14]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate('/dominando')}
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
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  Dominando o Direito
                </h1>
                <p className="text-sm text-gray-400">
                  Todas as áreas jurídicas
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
              <span>{totalAreas} áreas</span>
            </div>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-yellow-400" />
              <span>{totalDisciplinas} disciplinas</span>
            </div>
          </div>
        </div>

        {/* Timeline de Áreas */}
        {areas && (
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
                {areas.map((area, index) => {
                  const isLeft = index % 2 === 0;
                  const disciplinas = disciplinasCount?.[area.nome] || 0;
                  const temCapa = !!area.capa_url;
                  const isGenerating = generatingId === area.id;
                  const progressoPercentual = 0; // TODO: buscar progresso real
                  
                  return (
                    <motion.div
                      key={area.id}
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
                      
                      {/* Card da Área */}
                      <div className="w-full">
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="rounded-2xl backdrop-blur-sm border transition-all overflow-hidden min-h-[200px] flex flex-col bg-[#12121a]/90 border-white/10 hover:border-red-500/50"
                        >
                          {/* Capa da área */}
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {temCapa ? (
                              <>
                                <img 
                                  src={area.capa_url!} 
                                  alt={area.nome}
                                  className="w-full h-full object-cover"
                                  loading="eager"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <button
                                  onClick={(e) => handleGerarCapa(area.id, area.nome, e)}
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
                            
                            {/* Número da área */}
                            <div className="absolute bottom-2 left-3">
                              <p className="text-xs font-semibold drop-shadow-lg text-red-400">
                                Área {area.ordem}
                              </p>
                            </div>
                          </div>
                          
                          {/* Conteúdo clicável */}
                          <button
                            onClick={() => handleNavigate(area)}
                            className="flex-1 p-3 text-left flex flex-col"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium text-[13px] leading-snug text-white">
                                {area.nome}
                              </h3>
                              
                              {/* Contagem de disciplinas */}
                              {disciplinas > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <BookOpen className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs text-yellow-400 font-medium">{disciplinas} disciplinas</span>
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
