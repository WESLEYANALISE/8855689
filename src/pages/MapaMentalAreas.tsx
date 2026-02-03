import { useNavigate } from "react-router-dom";
import { Brain, Lock, Crown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGenericCache } from "@/hooks/useGenericCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import HeroBackground from "@/components/HeroBackground";
import heroMapaMental from "@/assets/hero-mapamental.webp";

interface AreaData {
  area: string;
  count: number;
}

const CORES_POR_AREA: Record<string, { bgGradient: string; glowColor: string; borderColor: string }> = {
  "DIREITO CIVIL": { 
    bgGradient: "from-red-600 via-red-700 to-red-800", 
    glowColor: "rgb(239, 68, 68)", 
    borderColor: "border-red-500/40" 
  },
  "DIREITO CONSTITUCIONAL": { 
    bgGradient: "from-blue-600 via-blue-700 to-blue-800", 
    glowColor: "rgb(59, 130, 246)", 
    borderColor: "border-blue-500/40" 
  },
  "DIREITO EMPRESARIAL": { 
    bgGradient: "from-green-600 via-green-700 to-green-800", 
    glowColor: "rgb(34, 197, 94)", 
    borderColor: "border-green-500/40" 
  },
  "DIREITO PENAL": { 
    bgGradient: "from-purple-600 via-purple-700 to-purple-800", 
    glowColor: "rgb(168, 85, 247)", 
    borderColor: "border-purple-500/40" 
  },
  "DIREITO TRIBUTÁRIO": { 
    bgGradient: "from-yellow-600 via-yellow-700 to-yellow-800", 
    glowColor: "rgb(234, 179, 8)", 
    borderColor: "border-yellow-500/40" 
  },
  "DIREITO ADMINISTRATIVO": { 
    bgGradient: "from-indigo-600 via-indigo-700 to-indigo-800", 
    glowColor: "rgb(99, 102, 241)", 
    borderColor: "border-indigo-500/40" 
  },
  "DIREITO TRABALHISTA": { 
    bgGradient: "from-orange-600 via-orange-700 to-orange-800", 
    glowColor: "rgb(249, 115, 22)", 
    borderColor: "border-orange-500/40" 
  },
  "DIREITO PROCESSUAL CIVIL": { 
    bgGradient: "from-cyan-600 via-cyan-700 to-cyan-800", 
    glowColor: "rgb(6, 182, 212)", 
    borderColor: "border-cyan-500/40" 
  },
  "DIREITO PROCESSUAL PENAL": { 
    bgGradient: "from-pink-600 via-pink-700 to-pink-800", 
    glowColor: "rgb(236, 72, 153)", 
    borderColor: "border-pink-500/40" 
  }
};

const CORES_DEFAULT = { 
  bgGradient: "from-violet-600 via-violet-700 to-violet-800", 
  glowColor: "rgb(124, 58, 237)", 
  borderColor: "border-violet-500/40" 
};

export default function MapaMentalAreas() {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();

  const { data: areas, isLoading: loading } = useGenericCache<AreaData[]>({
    cacheKey: 'mapa-mental-areas',
    fetchFn: async () => {
      const { data, error } = await supabase.from('MAPA MENTAL' as any).select('area');
      if (error) throw error;

      const areaMap = new Map<string, number>();
      data?.forEach((item: any) => {
        const area = item.area;
        if (area) {
          areaMap.set(area, (areaMap.get(area) || 0) + 1);
        }
      });

      return Array.from(areaMap.entries())
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
    },
  });

  // Limite de 20% das áreas para usuários gratuitos
  const limiteGratis = Math.max(1, Math.ceil((areas || []).length * 0.20));

  const handleLockedClick = () => {
    toast.error("Conteúdo Premium", {
      description: "Assine para acessar todos os mapas mentais",
      action: {
        label: "Ver Planos",
        onClick: () => navigate('/assinatura')
      }
    });
  };

  const handleAreaClick = (areaData: AreaData, index: number) => {
    const isLocked = !isPremium && index >= limiteGratis;
    
    if (isLocked) {
      handleLockedClick();
      return;
    }
    
    navigate(`/mapa-mental/area/${encodeURIComponent(areaData.area)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <HeroBackground imageSrc={heroMapaMental} height="100%" gradientOpacity={{ top: 0.6, middle: 0.8, bottom: 1 }} />
      
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-500/50">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Mapa Mental</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Escolha a área do direito
                </p>
              </div>
            </div>
          </div>

          {(areas || []).length > 0 ? (
            <div className="relative py-4">
              {/* Linha central da timeline */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
                <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
                {/* Animação de fluxo */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                  animate={{ y: ["0%", "300%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="space-y-4 relative z-10">
                {(areas || []).map((areaData, index) => {
                  const cores = CORES_POR_AREA[areaData.area.toUpperCase()] || CORES_DEFAULT;
                  const isLocked = !isPremium && index >= limiteGratis;
                  const isLeft = index % 2 === 0;
                  
                  return (
                    <motion.div
                      key={areaData.area}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative flex items-center ${
                        isLeft ? 'justify-start pr-[54%]' : 'justify-end pl-[54%]'
                      }`}
                    >
                      {/* Marcador no centro */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              `0 0 0 0 ${cores.glowColor}66`,
                              `0 0 0 8px ${cores.glowColor}00`,
                              `0 0 0 0 ${cores.glowColor}66`
                            ]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            delay: index * 0.2
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br ${cores.bgGradient}`}
                          style={{ boxShadow: `0 4px 16px ${cores.glowColor}40` }}
                        >
                          <Brain className="w-4 h-4 text-white" />
                        </motion.div>
                      </div>
                      
                      {/* Card */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAreaClick(areaData, index)}
                        className={`w-full min-h-[80px] bg-gradient-to-br ${cores.bgGradient} rounded-xl p-3 text-left transition-all hover:scale-[1.02] hover:shadow-xl shadow-lg border ${cores.borderColor} flex items-center gap-2 relative ${
                          isLocked ? 'opacity-80' : ''
                        }`}
                        style={{ boxShadow: `0 4px 20px ${cores.glowColor}30` }}
                      >
                        {/* Badge Premium */}
                        {isLocked && (
                          <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 bg-amber-500/90 text-white px-1.5 py-0.5 rounded-full text-[9px] font-medium">
                            <Crown className="w-2 h-2" />
                            <span>Premium</span>
                          </div>
                        )}
                        
                        <div className="bg-white/20 rounded-lg p-2 flex-shrink-0 relative">
                          <Brain className="w-5 h-5 text-white" />
                          {isLocked && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center">
                              <Lock className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h3 className="text-xs font-bold text-white leading-tight truncate">
                            {areaData.area}
                          </h3>
                          <p className="text-[10px] text-white/70 mt-0.5">
                            {areaData.count} {areaData.count === 1 ? 'mapa' : 'mapas'}
                          </p>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-white/50 flex-shrink-0" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma área encontrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
