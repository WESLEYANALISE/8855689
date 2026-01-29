import { useNavigate } from "react-router-dom";
import { ArrowLeft, Newspaper, BookOpen, Scale, Video, BarChart3, Gavel, Headphones } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import { DocumentariosCarousel } from "@/components/DocumentariosCarousel";

const TematicaJuridica = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const conteudosTematicos = [
    { id: "audiencias", title: "Audiências", description: "Sessões dos tribunais", icon: Gavel, route: "/ferramentas/audiencias" },
    { id: "audioaulas", title: "Áudio Aulas", description: "Aprenda ouvindo", icon: Headphones, route: "/audioaulas" },
    { id: "noticias", title: "Notícias", description: "Acompanhe o mundo jurídico", icon: Newspaper, route: "/noticias-juridicas" },
    { id: "meu-brasil", title: "Meu Brasil", description: "Conheça a história do Brasil", icon: Scale, route: "/meu-brasil" },
    { id: "politica", title: "Política", description: "Entenda o cenário político", icon: BookOpen, route: "/politica" },
    { id: "tres-poderes", title: "Três Poderes", description: "Poderes da República", icon: Scale, route: "/tres-poderes" },
    { id: "justica-numeros", title: "Justiça em Números", description: "Estatísticas do judiciário", icon: BarChart3, route: "/ferramentas/estatisticas" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/?tab=iniciante')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Temática Jurídica</h1>
            <p className="text-sm text-muted-foreground">Explore o Direito de forma diferente</p>
          </div>
        </div>

        {/* Carrossel de Documentários */}
        <DocumentariosCarousel />

        {/* Conteúdos Temáticos */}
        <div className="space-y-4">
          <div className="bg-neutral-900/90 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="bg-amber-900/20 rounded-2xl p-3 shadow-lg ring-1 ring-amber-800/30">
                <Video className="w-6 h-6 md:w-5 md:h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">
                  Conteúdos Temáticos
                </h3>
                <p className="text-muted-foreground text-xs">Explore diferentes perspectivas</p>
              </div>
            </div>
            
            <div className={`grid gap-3 relative z-10 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {conteudosTematicos.map((item) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => navigate(item.route)} 
                    className="group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-2xl p-3 text-left transition-colors duration-150 flex flex-col gap-2 shadow-lg border border-white/5 hover:border-white/10 overflow-hidden h-[130px]"
                  >
                    <div className="bg-amber-900/20 rounded-xl p-2 w-fit group-hover:bg-amber-900/30 transition-colors shadow-lg">
                      <Icon className="text-amber-400 drop-shadow-md w-5 h-5" />
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

export default TematicaJuridica;
