import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, ArrowRight, Lock, Crown, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGenericCache } from "@/hooks/useGenericCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import HeroBackground from "@/components/HeroBackground";
import heroCursos from "@/assets/hero-cursos.webp";
import { Button } from "@/components/ui/button";

interface Area {
  area: string;
  capa: string;
  totalModulos: number;
  totalAulas: number;
  fonte: 'CURSOS-APP' | 'CURSOS';
  cor?: string;
  primeirosTemas?: string[];
}

const CORES_AREAS: Record<string, string> = {
  "Direito Penal": "from-red-600 to-red-800",
  "Direito Civil": "from-blue-600 to-blue-800",
  "Direito Constitucional": "from-green-600 to-green-800",
  "Direito Administrativo": "from-purple-600 to-purple-800",
  "Direito Trabalhista": "from-yellow-600 to-yellow-800",
  "Direito Empresarial": "from-pink-600 to-pink-800",
  "Direito Tributário": "from-indigo-600 to-indigo-800",
  "Direito Processual Civil": "from-cyan-600 to-cyan-800",
  "Direito Processual Penal": "from-orange-600 to-orange-800",
};

const Cursos = () => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  
  const { data: areas, isLoading: loading } = useGenericCache<Area[]>({
    cacheKey: 'cursos-areas',
    fetchFn: async () => {
      const areasArray: Area[] = [];

      const { data: cursosAppData, error: cursosAppError } = await supabase
        .from("CURSOS-APP" as any)
        .select("area, tema, ordem")
        .order("area")
        .order("ordem");

      const { data: cursosData, error: cursosError } = await supabase
        .from("CURSOS" as any)
        .select("Area, Modulo, Aula, \"capa-area\"")
        .order("Area", { ascending: true });

      if (cursosAppData && !cursosAppError) {
        const areasMap = new Map<string, { temas: string[]; totalAulas: number }>();
        
        cursosAppData.forEach((item: any) => {
          if (item.area) {
            if (!areasMap.has(item.area)) {
              areasMap.set(item.area, { temas: [], totalAulas: 0 });
            }
            const areaData = areasMap.get(item.area)!;
            areaData.temas.push(item.tema);
            areaData.totalAulas++;
          }
        });

        areasMap.forEach((data, area) => {
          areasArray.push({
            area,
            capa: "",
            totalModulos: 1,
            totalAulas: data.totalAulas,
            fonte: 'CURSOS-APP',
            cor: CORES_AREAS[area] || "from-gray-600 to-gray-800",
            primeirosTemas: data.temas.slice(0, 3),
          });
        });
      }

      if (cursosData && !cursosError) {
        const areasMap = new Map<string, { capa: string; modulos: Set<number>; totalAulas: number }>();
        
        cursosData.forEach((item: any) => {
          if (item.Area) {
            if (!areasMap.has(item.Area)) {
              areasMap.set(item.Area, {
                capa: item["capa-area"] || "",
                modulos: new Set(),
                totalAulas: 0
              });
            }
            const areaData = areasMap.get(item.Area)!;
            if (item.Modulo) areaData.modulos.add(item.Modulo);
            if (item.Aula) areaData.totalAulas++;
          }
        });

        areasMap.forEach((data, area) => {
          areasArray.push({
            area,
            capa: data.capa,
            totalModulos: data.modulos.size,
            totalAulas: data.totalAulas,
            fonte: 'CURSOS',
          });
        });
      }

      return areasArray;
    },
  });

  // Calcular limite de 20% para cursos CURSOS-APP
  const areasIniciando = (areas || []).filter(a => a.fonte === 'CURSOS-APP');
  const limiteGratis = Math.max(1, Math.ceil(areasIniciando.length * 0.20));

  const handleLockedClick = () => {
    toast.error("Conteúdo Premium", {
      description: "Assine para acessar todos os cursos",
      action: {
        label: "Ver Planos",
        onClick: () => navigate('/assinatura')
      }
    });
  };

  const handleAreaClick = (area: Area, index: number) => {
    const isLocked = !isPremium && index >= limiteGratis;
    
    if (isLocked) {
      handleLockedClick();
      return;
    }
    
    navigate(`/iniciando-direito/${encodeURIComponent(area.area)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20 relative">
      <HeroBackground imageSrc={heroCursos} height="50vh" />
      
      <div className="relative z-10">
        {/* Header sticky padronizado */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-600/10">
                <BookOpen className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground">Cursos Jurídicos</h1>
                <p className="text-muted-foreground text-sm">Aprenda direito de forma estruturada</p>
              </div>
            </div>
          </div>
        </div>

      {areasIniciando.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-red-500" />
              📚 Iniciando o Direito
            </h2>
            <p className="text-muted-foreground mt-1">
              Curso completo para quem está começando no mundo jurídico
            </p>
          </div>

          <div className="relative space-y-6">
            <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />

            {areasIniciando.map((area, index) => {
              const isLocked = !isPremium && index >= limiteGratis;
              
              return (
                <div key={index} className="relative pl-8">
                  <div className={`absolute left-0 top-2 w-5 h-5 rounded-full bg-gradient-to-br ${area.cor} border-4 border-background`} />
                  
                  <button
                    onClick={() => handleAreaClick(area, index)}
                    className={`w-full text-left bg-card border border-border rounded-lg p-5 hover:border-red-500 hover:shadow-lg transition-all group relative ${
                      isLocked ? 'opacity-80' : ''
                    }`}
                  >
                    {/* Badge Premium */}
                    {isLocked && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full text-xs font-medium z-10">
                        <Crown className="w-3 h-3" />
                        Premium
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`bg-gradient-to-br ${area.cor} p-2.5 rounded-lg relative`}>
                          <GraduationCap className="w-5 h-5 text-white" />
                          {isLocked && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                              <Lock className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-red-500 transition-colors">
                            {area.area}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {area.totalAulas} {area.totalAulas === 1 ? 'tema' : 'temas'} disponíveis
                          </p>
                        </div>
                      </div>
                      <span className={`bg-gradient-to-br ${area.cor} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                        {index + 1}
                      </span>
                    </div>

                    {area.primeirosTemas && area.primeirosTemas.length > 0 && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Primeiros temas:
                        </p>
                        {area.primeirosTemas.map((tema, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-red-500 mt-1">•</span>
                            <span className="flex-1">{tema}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 text-right">
                      <span className="text-xs text-red-500 font-semibold group-hover:underline">
                        {isLocked ? 'Desbloquear →' : 'Ver todos os temas →'}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(areas || []).filter(a => a.fonte === 'CURSOS').length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-red-500" />
              🎓 Cursos Avançados
            </h2>
            <p className="text-muted-foreground mt-1">
              Aprofunde seus conhecimentos com cursos completos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(areas || []).filter(a => a.fonte === 'CURSOS').map((area, index) => (
              <div
                key={index}
                onClick={() => navigate(`/cursos/modulos?area=${encodeURIComponent(area.area)}`)}
                className="group cursor-pointer bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-red-500 transition-all duration-300"
              >
                <div className="relative h-48 bg-gradient-to-br from-red-600/20 to-orange-600/20 overflow-hidden">
                  {area.capa ? (
                    <img
                      src={area.capa}
                      alt={area.area}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <div className="bg-red-600/90 backdrop-blur-sm p-2 rounded-full">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                      {area.area}
                    </h3>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{area.totalModulos} {area.totalModulos === 1 ? 'módulo' : 'módulos'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{area.totalAulas} {area.totalAulas === 1 ? 'aula' : 'aulas'}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-red-500 group-hover:underline">
                      Acessar curso
                    </span>
                    <ArrowRight className="w-4 h-4 text-red-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Cursos;