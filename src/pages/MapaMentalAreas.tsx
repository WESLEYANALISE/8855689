import { useNavigate } from "react-router-dom";
import { Brain, Lock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useGenericCache } from "@/hooks/useGenericCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import HeroBackground from "@/components/HeroBackground";
import heroMapaMental from "@/assets/hero-mapamental.webp";
import BackButton from "@/components/BackButton";

interface AreaData {
  area: string;
  count: number;
}

const CORES_POR_AREA: Record<string, { cor: string; bordaCor: string; glowColor: string }> = {
  "DIREITO CIVIL": { cor: "from-red-500 to-red-700", bordaCor: "border-red-500/30", glowColor: "rgb(239, 68, 68)" },
  "DIREITO CONSTITUCIONAL": { cor: "from-blue-500 to-blue-700", bordaCor: "border-blue-500/30", glowColor: "rgb(59, 130, 246)" },
  "DIREITO EMPRESARIAL": { cor: "from-green-500 to-green-700", bordaCor: "border-green-500/30", glowColor: "rgb(34, 197, 94)" },
  "DIREITO PENAL": { cor: "from-purple-500 to-purple-700", bordaCor: "border-purple-500/30", glowColor: "rgb(168, 85, 247)" },
  "DIREITO TRIBUTÁRIO": { cor: "from-yellow-500 to-yellow-700", bordaCor: "border-yellow-500/30", glowColor: "rgb(234, 179, 8)" },
  "DIREITO ADMINISTRATIVO": { cor: "from-indigo-500 to-indigo-700", bordaCor: "border-indigo-500/30", glowColor: "rgb(99, 102, 241)" },
  "DIREITO TRABALHISTA": { cor: "from-orange-500 to-orange-700", bordaCor: "border-orange-500/30", glowColor: "rgb(249, 115, 22)" },
  "DIREITO PROCESSUAL CIVIL": { cor: "from-cyan-500 to-cyan-700", bordaCor: "border-cyan-500/30", glowColor: "rgb(6, 182, 212)" },
  "DIREITO PROCESSUAL PENAL": { cor: "from-pink-500 to-pink-700", bordaCor: "border-pink-500/30", glowColor: "rgb(236, 72, 153)" }
};

const CORES_DEFAULT = { cor: "from-violet-500 to-violet-700", bordaCor: "border-violet-500/30", glowColor: "rgb(124, 58, 237)" };

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
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20 relative">
      <HeroBackground imageSrc={heroMapaMental} height="50vh" />
      
      <div className="relative z-10">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Botão Voltar */}
        <BackButton to="/" className="mb-4" />
        <div className="mb-8">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(areas || []).map((areaData, index) => {
              const cores = CORES_POR_AREA[areaData.area.toUpperCase()] || CORES_DEFAULT;
              const isLocked = !isPremium && index >= limiteGratis;
              
              return (
                <Card
                  key={areaData.area}
                  className={`cursor-pointer hover:scale-[1.02] transition-all bg-card border border-border/50 group relative overflow-hidden ${
                    isLocked ? 'opacity-80' : ''
                  }`}
                  onClick={() => handleAreaClick(areaData, index)}
                >
                  {/* Badge Premium */}
                  {isLocked && (
                    <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 bg-amber-500/90 text-white px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                      <Crown className="w-2.5 h-2.5" />
                      <span>Premium</span>
                    </div>
                  )}
                  
                  <div
                    className="h-2 w-full"
                    style={{ background: `linear-gradient(90deg, ${cores.glowColor}, ${cores.glowColor}88)` }}
                  />

                  <CardContent className="p-3">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg relative"
                        style={{ background: `linear-gradient(135deg, ${cores.glowColor}, ${cores.glowColor}cc)` }}
                      >
                        <Brain className="w-6 h-6 text-white" />
                        {isLocked && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                            <Lock className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-foreground leading-tight">
                          {areaData.area}
                        </h3>
                        <p className="text-muted-foreground text-xs mt-1">
                          {areaData.count} {areaData.count === 1 ? 'mapa' : 'mapas'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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