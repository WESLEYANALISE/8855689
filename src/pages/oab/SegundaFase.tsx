import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, ArrowRight, FileText, Brain, Target, Scale, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoaulasOABAreasCarousel } from "@/components/VideoaulasOABAreasCarousel";
import { useDeviceType } from "@/hooks/use-device-type";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const SegundaFase = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/?tab=jornada')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">OAB 2ª Fase</h1>
            <p className="text-sm text-muted-foreground">Prova Prático-Profissional</p>
          </div>
        </div>

        {/* Videoaulas */}
        <div className="space-y-4">
          <div className="bg-neutral-900/90 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-red-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-red-800/30">
                  <Video className="w-6 h-6 md:w-5 md:h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
                    Videoaulas
                  </h3>
                  <p className="text-muted-foreground text-xs">Escolha uma área de estudo</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/videoaulas-oab')} 
                className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-4 text-xs flex items-center gap-1.5 font-medium"
              >
                Ver mais
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            
            <VideoaulasOABAreasCarousel />
          </div>
        </div>

        {/* Prova Prático-Profissional */}
        <div className="space-y-4">
          <div className="bg-neutral-900/90 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="bg-red-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-red-800/30">
                <FileText className="w-6 h-6 md:w-5 md:h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
                  Prova Prático-Profissional
                </h3>
                <p className="text-muted-foreground text-xs">Ferramentas para a 2ª fase</p>
              </div>
            </div>
            
            <div className={`grid gap-3 relative z-10 ${isDesktop ? 'grid-cols-5' : 'grid-cols-2'}`}>
              {[
                { id: "modelos-pecas", title: "Modelos de Peças", description: "Estrutura de petições e recursos", icon: FileText, route: "/oab/segunda-fase/pecas", available: false },
                { id: "treinar-pecas", title: "Treinar Peças", description: "Pratique com IA", icon: Brain, route: "/oab/segunda-fase/treinar", available: false },
                { id: "questoes-discursivas", title: "Questões Discursivas", description: "Questões de provas anteriores", icon: Target, route: "/oab/segunda-fase/questoes", available: false },
                { id: "legislacao-consulta", title: "Legislação Consulta", description: "Leis para a prova", icon: Scale, route: "/oab/segunda-fase/legislacao", available: false },
                { id: "cronograma", title: "Cronograma", description: "Plano de estudos para 2ª fase", icon: Calendar, route: "/oab/segunda-fase/cronograma", available: false },
              ].map((item) => {
                const Icon = item.icon;
                const isRestricted = !item.available && !isAdmin;
                
                const handleClick = () => {
                  if (isRestricted) {
                    toast("🚀 Em Breve!", { description: "Esta funcionalidade estará disponível em breve. Aguarde novidades!" });
                    return;
                  }
                  navigate(item.route);
                };
                
                return (
                  <button 
                    key={item.id} 
                    onClick={handleClick}
                    className={`group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-2xl p-3 text-left transition-colors duration-150 flex flex-col gap-2 shadow-lg border border-white/5 hover:border-white/10 overflow-hidden relative h-[130px] ${isRestricted ? 'opacity-60' : ''}`}
                  >
                    {isRestricted && (
                      <div className="absolute top-1.5 right-1.5 bg-red-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-20">
                        <Clock className="w-2.5 h-2.5" />
                        Em Breve
                      </div>
                    )}
                    <div className="bg-red-900/20 rounded-xl p-2 w-fit group-hover:bg-red-900/30 transition-colors shadow-lg">
                      <Icon className="text-red-400 drop-shadow-md w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors drop-shadow-sm">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SegundaFase;
