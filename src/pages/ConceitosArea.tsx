import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Clock, ArrowLeft, Loader2, Footprints, Layers } from "lucide-react";
import { motion } from "framer-motion";
import salaAulaImage from "@/assets/sala-aula-direito.webp";

const AREAS_NOMES: Record<number, string> = {
  1: "História do Direito",
  2: "Fundamentos do Direito",
  3: "Filosofia e Sociologia",
  4: "Direito Constitucional Básico",
  5: "Direito Civil e Penal Básico",
};

const ConceitosArea = () => {
  const { areaOrdem } = useParams<{ areaOrdem: string }>();
  const navigate = useNavigate();
  const areaNum = parseInt(areaOrdem || "1");

  const { data: materias, isLoading } = useQuery({
    queryKey: ["conceitos-materias", areaNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conceitos_materias")
        .select("*")
        .eq("area_ordem", areaNum)
        .eq("ativo", true)
        .order("codigo");

      if (error) throw error;
      return data;
    },
  });

  // Buscar contagem de tópicos por matéria
  const { data: topicosCount } = useQuery({
    queryKey: ["conceitos-topicos-count", materias?.map(m => m.id)],
    queryFn: async () => {
      if (!materias || materias.length === 0) return {};
      
      const counts: Record<number, number> = {};
      for (const mat of materias) {
        const { count } = await supabase
          .from("conceitos_topicos")
          .select("*", { count: "exact", head: true })
          .eq("materia_id", mat.id);
        counts[mat.id] = count || 0;
      }
      return counts;
    },
    enabled: !!materias && materias.length > 0,
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${salaAulaImage})` }}
      />
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black/90" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate("/conceitos/trilhante")}
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
                <span className="text-xl font-bold text-white">{areaNum}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{AREAS_NOMES[areaNum] || `Área ${areaNum}`}</h1>
                <p className="text-sm text-neutral-400">
                  {materias?.length || 0} matérias
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Timeline de Matérias */}
        <div className="px-4 pb-24 pt-8">
          <div className="max-w-lg mx-auto relative">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : (
              <>
                {/* Linha central da timeline */}
                {materias && materias.length > 0 && (
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                    <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
                    {/* Animação de fluxo elétrico */}
                    <motion.div
                      className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                      animate={{ y: ["0%", "300%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}

                <div className="space-y-6">
                  {materias?.map((materia, index) => {
                    const totalTopicos = topicosCount?.[materia.id] || 0;
                    const isLeft = index % 2 === 0;
                    
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
                        
                        {/* Card da Matéria */}
                        <button
                          onClick={() => navigate(`/conceitos/materia/${materia.id}`)}
                          className="w-full text-left"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-4 rounded-2xl bg-neutral-800/90 backdrop-blur-sm border border-neutral-700/50 hover:border-neutral-600 transition-all min-h-[130px] flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-xs text-red-500 font-medium mb-1.5 block">
                                Matéria {index + 1}
                              </span>
                              <h3 className="font-medium text-[13px] leading-snug text-white">
                                {materia.nome}
                              </h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-neutral-400">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {totalTopicos} tópicos
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {materia.carga_horaria}h
                              </span>
                            </div>
                          </motion.div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
            
            {!isLoading && (!materias || materias.length === 0) && (
              <div className="text-center py-12 text-neutral-400">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma matéria encontrada</p>
                <p className="text-sm">Execute a migração para popular os dados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConceitosArea;
