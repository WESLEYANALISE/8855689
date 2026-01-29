import { useNavigate } from "react-router-dom";
import { Video, Film, BarChart3, Landmark, Clock, Clapperboard } from "lucide-react";
import { DocumentariosCarousel } from "@/components/DocumentariosCarousel";
import { useDeviceType } from "@/hooks/use-device-type";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const Tematicas = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const tematicas = [
    { id: "audiencias", title: "Audiências dos Tribunais", description: "Sessão de julgamentos", icon: Video, route: "/ferramentas/audiencias", color: "purple" },
    { id: "juriflix", title: "JuriFlix", description: "Filmes e séries jurídicas", icon: Film, route: "/juriflix", color: "pink" },
    { id: "estatisticas", title: "Justiça em Números", description: "Dados do Poder Judiciário", icon: BarChart3, route: "/ferramentas/estatisticas", color: "blue", restricted: true },
    { id: "tres-poderes", title: "Três Poderes", description: "Executivo, Legislativo e Judiciário", icon: Landmark, route: "/tres-poderes", color: "emerald" },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    red: { bg: "bg-red-900/20", text: "text-red-400" },
    blue: { bg: "bg-blue-900/20", text: "text-blue-400" },
    purple: { bg: "bg-purple-900/20", text: "text-purple-400" },
    pink: { bg: "bg-pink-900/20", text: "text-pink-400" },
    emerald: { bg: "bg-emerald-900/20", text: "text-emerald-400" },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-red-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-red-800/30">
            <Clapperboard className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Temáticas
            </h1>
            <p className="text-muted-foreground text-sm">Conteúdo especializado em Direito</p>
          </div>
        </div>

        {/* Carrossel de Documentários */}
        <DocumentariosCarousel />

        {/* Grid de Temáticas */}
        <div className="bg-neutral-900/90 rounded-3xl p-4 md:p-4 relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-red-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-red-800/30">
              <Clapperboard className="w-6 h-6 md:w-5 md:h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
                Explore
              </h3>
              <p className="text-muted-foreground text-xs">Conteúdo especializado</p>
            </div>
          </div>
          
          <div className={`grid gap-2 relative z-10 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2 gap-3'}`}>
            {tematicas.map((item) => {
              const Icon = item.icon;
              const isRestricted = item.restricted && !isAdmin;
              
              const handleClick = () => {
                if (isRestricted) {
                  toast("🚀 Em Breve!", { description: "Esta funcionalidade estará disponível em breve. Aguarde novidades!" });
                  return;
                }
                navigate(item.route);
              };
              
              const colors = colorClasses[item.color] || colorClasses.red;
              
              return (
                <button 
                  key={item.id} 
                  onClick={handleClick} 
                  className={`group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-xl p-2.5 text-left transition-colors duration-150 flex flex-col gap-1.5 shadow-lg border border-white/5 hover:border-white/10 overflow-hidden relative ${isDesktop ? 'h-[100px]' : 'h-[130px] rounded-2xl p-3 gap-2'} ${isRestricted ? 'opacity-60' : ''}`}
                >
                  {isRestricted && (
                    <div className="absolute top-1.5 right-1.5 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-20">
                      <Clock className="w-2.5 h-2.5" />
                      Em Breve
                    </div>
                  )}
                  <div className={`${colors.bg} rounded-lg w-fit group-hover:opacity-80 transition-colors shadow-lg ${isDesktop ? 'p-1.5' : 'p-2 rounded-xl'}`}>
                    <Icon className={`${colors.text} drop-shadow-md ${isDesktop ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </div>
                  <div>
                    <h4 className={`font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors drop-shadow-sm ${isDesktop ? 'text-xs' : 'text-sm'}`}>
                      {item.title}
                    </h4>
                    <p className={`text-muted-foreground line-clamp-2 leading-snug ${isDesktop ? 'text-[10px]' : 'text-xs'}`}>
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
  );
};

export default Tematicas;