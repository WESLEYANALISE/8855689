import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Footprints, GraduationCap, Loader2, Scale, Crown, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { UniversalImage } from "@/components/ui/universal-image";
import { LockedTimelineCard } from "@/components/LockedTimelineCard";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";
import { useSubscription } from "@/contexts/SubscriptionContext";

// Matéria gratuita: "História do Direito"
const FREE_MATERIA_NAMES = ["história do direito", "historia do direito"];

export const MobileTrilhasAprender = () => {
  const navigate = useNavigate();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium } = useSubscription();

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
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  // Buscar contagem de tópicos por matéria
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
    staleTime: 1000 * 60 * 5,
  });

  // Buscar total de páginas (slides)
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

  const totalMaterias = materias?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a, b) => a + b, 0);

  // Separar matérias gratuitas e premium
  const isMateriaFree = (nome: string) => FREE_MATERIA_NAMES.includes(nome.toLowerCase().trim());
  
  const freeMaterias = materias?.filter(m => isMateriaFree(m.nome)) || [];
  const premiumMaterias = materias?.filter(m => !isMateriaFree(m.nome)) || [];
  
  // Se o usuário é premium, todas são visíveis
  const visibleItems = isPremium ? materias || [] : freeMaterias;
  const lockedItems = isPremium ? [] : premiumMaterias;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="relative py-4 flex flex-col items-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-5"
      >
        <h2 className="font-cinzel text-xl font-bold text-amber-100 mb-1">
          Jornada de Estudos
        </h2>
        <p className="text-amber-200/70 text-xs">Fundamentos do Direito</p>
      </motion.div>

      {/* Info Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-white/80 mb-6">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span>{totalMaterias} matérias</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Footprints className="w-3.5 h-3.5 text-yellow-400" />
          <span>{totalTopicos} tópicos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-purple-400" />
          <span>{totalPaginas || 0} páginas</span>
        </div>
      </div>

      {/* Timeline de Matérias */}
      {materias && materias.length > 0 && (
        <div className="w-full px-4">
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
               {/* Matérias visíveis (liberadas) */}
               {visibleItems.map((materia, index) => {
                const isLeft = index % 2 === 0;
                const topicos = topicosCount?.[materia.id] || 0;
                const temCapa = !!materia.capa_url;
                
                // Simular progresso (em produção, isso viria do banco de dados)
                const progressoPercentual = 0; // TODO: buscar progresso real do usuário
                
                return (
                  <motion.div
                    key={materia.id}
                    initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
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
                    <div className="w-full">
                      <motion.div 
                        whileTap={{ scale: 0.98 }}
                        className="rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all overflow-hidden min-h-[180px] flex flex-col"
                      >
                        {/* Capa da matéria */}
                        <div className="h-16 w-full overflow-hidden relative flex-shrink-0">
                          {temCapa ? (
                            <>
                              <UniversalImage
                                src={materia.capa_url!}
                                alt={materia.nome}
                                priority={index < 4}
                                blurCategory="course"
                                containerClassName="w-full h-full"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                          )}
                          
                          {/* Tema */}
                          <div className="absolute bottom-1 left-2">
                            <p className="text-[10px] text-red-400 font-semibold drop-shadow-lg">
                              Tema {materia.area_ordem}
                            </p>
                          </div>
                        </div>
                        
                        {/* Conteúdo clicável */}
                        <button
                          onClick={() => navigate(`/conceitos/materia/${materia.id}`)}
                          className="flex-1 p-2.5 text-left flex flex-col"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-xs leading-snug text-white line-clamp-2">
                              {materia.nome}
                            </h3>
                            
                            {/* Contagem de tópicos */}
                            <div className="flex items-center gap-1 mt-1.5">
                              <BookOpen className="w-3 h-3 text-yellow-400" />
                              <span className="text-[10px] text-yellow-400 font-medium">{topicos} tópicos</span>
                            </div>
                          </div>
                          
                          {/* Barra de progresso */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[9px] text-gray-500">Progresso</span>
                              <span className="text-[9px] text-green-400 font-medium">{progressoPercentual}%</span>
                            </div>
                            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
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
               
               {/* Matérias bloqueadas (Premium) */}
               {lockedItems.map((materia, index) => {
                 const realIndex = visibleItems.length + index;
                 const isLeft = realIndex % 2 === 0;
                 
                 return (
                   <LockedTimelineCard
                     key={materia.id}
                     title={materia.nome}
                     subtitle={`Tema ${materia.area_ordem}`}
                     imageUrl={materia.capa_url || undefined}
                     isLeft={isLeft}
                     index={realIndex}
                     onClick={() => setShowPremiumModal(true)}
                   />
                 );
               })}
            </div>
          </div>
        </div>
      )}
       
      {/* Modal Premium */}
      <PremiumUpgradeModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        featureName="Todos os conceitos"
      />
    </div>
  );
};
