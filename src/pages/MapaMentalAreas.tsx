import { useNavigate } from "react-router-dom";
import { Brain, Lock, Crown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGenericCache } from "@/hooks/useGenericCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AreaData {
  area: string;
  count: number;
}

const CORES_POR_AREA: Record<string, { glowColor: string }> = {
  "DIREITO CIVIL": { glowColor: "rgb(239, 68, 68)" },
  "DIREITO CONSTITUCIONAL": { glowColor: "rgb(59, 130, 246)" },
  "DIREITO EMPRESARIAL": { glowColor: "rgb(34, 197, 94)" },
  "DIREITO PENAL": { glowColor: "rgb(168, 85, 247)" },
  "DIREITO TRIBUTÁRIO": { glowColor: "rgb(234, 179, 8)" },
  "DIREITO ADMINISTRATIVO": { glowColor: "rgb(99, 102, 241)" },
  "DIREITO TRABALHISTA": { glowColor: "rgb(249, 115, 22)" },
  "DIREITO PROCESSUAL CIVIL": { glowColor: "rgb(6, 182, 212)" },
  "DIREITO PROCESSUAL PENAL": { glowColor: "rgb(236, 72, 153)" }
};

const CORES_DEFAULT = { glowColor: "rgb(124, 58, 237)" };

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
    <div className="min-h-screen bg-background pb-20">
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

            <div className="space-y-6 relative z-10">
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
                      isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                    }`}
                  >
                    {/* Marcador no centro */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.15, 1],
                          boxShadow: [
                            `0 0 0 0 ${cores.glowColor}66`,
                            `0 0 0 10px ${cores.glowColor}00`,
                            `0 0 0 0 ${cores.glowColor}66`
                          ]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          delay: index * 0.2
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                        style={{ 
                          background: `linear-gradient(to bottom right, ${cores.glowColor}, ${cores.glowColor}dd)`,
                          boxShadow: `0 4px 20px ${cores.glowColor}40`
                        }}
                      >
                        <Brain className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Card */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAreaClick(areaData, index)}
                      className={`w-full h-[100px] bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-2xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-2xl shadow-xl border border-red-800/30 flex items-center gap-3 relative ${
                        isLocked ? 'opacity-80' : ''
                      }`}
                    >
                      {/* Badge Premium */}
                      {isLocked && (
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 bg-amber-500/90 text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                          <Crown className="w-2.5 h-2.5" />
                          <span>Premium</span>
                        </div>
                      )}
                      
                      <div 
                        className="bg-white/15 rounded-xl p-2.5 relative"
                        style={{ background: `linear-gradient(135deg, ${cores.glowColor}40, ${cores.glowColor}20)` }}
                      >
                        <Brain className="w-6 h-6 text-white" />
                        {isLocked && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                            <Lock className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-cinzel text-sm font-bold text-white">{areaData.area}</h3>
                        <p className="text-xs text-white/70 mt-1">
                          {areaData.count} {areaData.count === 1 ? 'mapa' : 'mapas'}
                        </p>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-white/50" />
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
  );
}
