import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowRight, Footprints, GraduationCap, Video, Library, Brain, Target, LucideIcon } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";

// Categorias do "Primeiros Passos" com ícones temáticos - Ordem: Estudos 1 a 5
interface CategoriaIniciante {
  id: string;
  nome: string;
  descricao: string;
  icon: LucideIcon;
  route: string;
}

const CATEGORIAS_INICIANTE: CategoriaIniciante[] = [
  { 
    id: 'iniciando', 
    nome: 'Fundamentos', 
    descricao: 'Bases do Direito',
    icon: GraduationCap,
    route: '/blogger-juridico/artigos?categoria=iniciando'
  },
  { 
    id: 'videoaulas', 
    nome: 'Videoaulas', 
    descricao: 'Aulas em vídeo',
    icon: Video,
    route: '/videoaulas'
  },
  { 
    id: 'biblioteca', 
    nome: 'Biblioteca I', 
    descricao: 'Livros para iniciantes',
    icon: Library,
    route: '/biblioteca-iniciante'
  },
  { 
    id: 'flashcards', 
    nome: 'Flashcards', 
    descricao: 'Memorização ativa',
    icon: Brain,
    route: '/flashcards'
  },
  { 
    id: 'questoes', 
    nome: 'Questões', 
    descricao: 'Pratique seu conhecimento',
    icon: Target,
    route: '/questoes'
  },
];

export const BlogInicianteCarousel = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const handleCategoriaClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-xl">
            <Footprints className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-base font-semibold text-foreground">Primeiros Passos</h2>
            <p className="text-xs text-muted-foreground">Categorias para iniciantes</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => navigate('/primeiros-passos')} 
          className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-4 text-xs flex items-center gap-1.5 font-medium"
        >
          Ver mais
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 touch-pan-x">
          {CATEGORIAS_INICIANTE.map((categoria, index) => {
            const Icon = categoria.icon;
            const estudoNumero = String(index + 1).padStart(2, '0');
            
            return (
              <button
                key={categoria.id}
                onClick={() => handleCategoriaClick(categoria.route)}
                className={`flex-shrink-0 group relative overflow-hidden rounded-2xl border border-white/5 hover:border-red-500/30 transition-all duration-300 ${
                  isDesktop ? 'w-[180px] h-[220px]' : 'w-[160px] h-[200px]'
                }`}
              style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #111111 100%)' }}
              >
                {/* Borda lateral animada com shimmer */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-red-500/40 to-transparent animate-wave-shimmer" />
                </div>

                {/* Ícone centralizado no topo - estilo logo com pulsação */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] z-10">
                  <div className="relative">
                    {/* Glow atrás do ícone com pulsação leve */}
                    <div className="absolute inset-0 blur-xl bg-red-500/30 rounded-full scale-150 animate-pulse" style={{ animationDuration: '3s' }} />
                    <Icon 
                      className={`text-red-400/80 group-hover:text-red-400 transition-colors duration-300 ${
                        isDesktop ? 'w-12 h-12' : 'w-10 h-10'
                      }`} 
                      strokeWidth={1.5} 
                    />
                  </div>
                </div>

                {/* Badge Estudos no topo esquerdo */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10 z-20">
                  <span className="text-red-400 font-bold text-xs">{estudoNumero}</span>
                  <span className="text-white/70 text-[10px] font-medium">Estudos</span>
                </div>

                {/* Gradiente inferior para texto */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent" />

                {/* Conteúdo */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <h3 className="text-sm font-semibold text-white mb-0.5 group-hover:text-red-300 transition-colors">
                    {categoria.nome}
                  </h3>
                  <p className="text-[11px] text-white/50">
                    {categoria.descricao}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default BlogInicianteCarousel;
