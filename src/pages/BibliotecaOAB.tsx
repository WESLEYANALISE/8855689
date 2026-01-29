import { useNavigate } from "react-router-dom";
import { Book, Scale, BookOpen, ChevronRight as ArrowRight, TrendingUp, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import heroBibliotecas from "@/assets/biblioteca-office-sunset.jpg";
import capaOabEstudos from "@/assets/capa-biblioteca-oab-estudos.jpg";
import capaOabRevisao from "@/assets/capa-biblioteca-oab-revisao.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";

interface BibliotecaOABItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  capa: string;
}

const bibliotecasItems: BibliotecaOABItem[] = [
  {
    id: "estudos",
    title: "Estudos OAB",
    description: "Materiais completos para preparação do exame da OAB",
    icon: Scale,
    color: "#3b82f6",
    route: "/biblioteca-oab/estudos",
    capa: capaOabEstudos,
  },
  {
    id: "revisao",
    title: "Revisão OAB",
    description: "Resumos e materiais de revisão para a prova",
    icon: RefreshCw,
    color: "#10b981",
    route: "/biblioteca-oab/revisao",
    capa: capaOabRevisao,
  },
];

// Componente de capa otimizado
const BibliotecaCapa = ({ 
  capaUrl, 
  title, 
  color, 
  Icon,
  priority = false
}: {
  capaUrl: string;
  title: string;
  color: string;
  Icon: React.ElementType;
  priority?: boolean;
}) => {
  const [loaded, setLoaded] = useState(() => {
    const img = new Image();
    img.src = capaUrl;
    return img.complete;
  });
  
  return (
    <img
      src={capaUrl}
      alt={title}
      className={`w-full h-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: loaded ? 'none' : 'opacity 100ms ease-out' }}
      loading="eager"
      decoding="sync"
      fetchPriority={priority ? "high" : "auto"}
      onLoad={() => setLoaded(true)}
    />
  );
};

const BibliotecaOAB = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: true,
    skipSnaps: false,
    containScroll: false,
  });

  // Hero image cache check
  const [imageLoaded, setImageLoaded] = useState(() => {
    const img = new Image();
    img.src = heroBibliotecas;
    return img.complete;
  });

  useEffect(() => {
    if (!imageLoaded) {
      const img = new Image();
      img.src = heroBibliotecas;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageLoaded]);

  // Buscar contagens
  const { data: contagens } = useQuery({
    queryKey: ["contagens-biblioteca-oab"],
    queryFn: async () => {
      const { count } = await supabase
        .from("BIBILIOTECA-OAB" as any)
        .select("*", { count: "exact", head: true });
      return {
        estudos: count || 0,
        revisao: Math.floor((count || 0) * 0.4), // Aproximação para revisão
      };
    },
    staleTime: 1000 * 60 * 30,
  });

  const totalObras = contagens?.estudos || 0;

  // Carousel controls
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[70vh] z-0">
        <img
          src={heroBibliotecas}
          alt="Biblioteca OAB"
          className={`w-full h-full object-cover object-[50%_30%] transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-neutral-900" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-3 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-blue-500/50" />
            <Scale className="w-4 h-4 text-blue-500/70" />
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-blue-500/50" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold">
            <span className="bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 bg-clip-text text-transparent">
              Biblioteca II
            </span>
            <span className="block text-lg font-light text-white/90 tracking-widest uppercase">
              OAB
            </span>
          </h1>

          <div className="mt-2 flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-xs text-white/80">
                <span className="font-semibold text-blue-300">{totalObras}</span> obras
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Carousel */}
        <div className="flex-1 flex flex-col px-3 pb-4 overflow-hidden">
          {/* Main Carousel */}
          <div className="relative flex-1 flex items-center">
            {/* Navigation Arrows */}
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <div className="overflow-hidden w-full" ref={emblaRef}>
              <div className="flex">
                {bibliotecasItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = index === selectedIndex;
                  
                  return (
                    <div
                      key={item.id}
                      className="flex-[0_0_70%] min-w-0 px-2"
                    >
                      <button
                        onClick={() => isActive && navigate(item.route)}
                        className={`
                          w-full transition-opacity duration-150
                          ${isActive ? 'opacity-100' : 'opacity-40'}
                        `}
                        style={{
                          transform: isActive ? 'scale(1)' : 'scale(0.92)'
                        }}
                      >
                        {/* Card */}
                        <div 
                          className="relative aspect-[3/4] rounded-2xl overflow-hidden"
                          style={{
                            border: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                            boxShadow: isActive ? `0 8px 24px ${item.color}40` : '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                        >
                          {/* Cover Image */}
                          <BibliotecaCapa 
                            capaUrl={item.capa} 
                            title={item.title} 
                            color={item.color} 
                            Icon={Icon}
                            priority={index <= 1}
                          />
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          
                          {/* Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
                            {/* Book count */}
                            <div 
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md mb-2"
                              style={{ backgroundColor: `${item.color}30` }}
                            >
                              <Book className="w-3 h-3" style={{ color: item.color }} />
                              <span className="text-xs font-bold" style={{ color: item.color }}>
                                {contagens?.[item.id as keyof typeof contagens] || 0}
                              </span>
                              <span className="text-[10px] text-white/70">livros</span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4" style={{ color: isActive ? item.color : 'rgba(255,255,255,0.8)' }} />
                              <h3 className="text-base font-bold text-white">
                                {item.title}
                              </h3>
                            </div>
                            
                            {isActive && (
                              <div 
                                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-full text-white text-xs font-semibold"
                                style={{ backgroundColor: item.color }}
                              >
                                Acessar
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-3">
            {bibliotecasItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`
                  h-1.5 rounded-full transition-all duration-100
                  ${index === selectedIndex 
                    ? 'w-5' 
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }
                `}
                style={{
                  backgroundColor: index === selectedIndex ? item.color : undefined
                }}
              />
            ))}
          </div>
        </div>

        {/* Em Alta Section */}
        <div className="px-4 pb-6 bg-neutral-900">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Materiais de Destaque</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibliotecaOAB;
