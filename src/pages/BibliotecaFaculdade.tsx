import { useNavigate } from "react-router-dom";
import { GraduationCap, Book, Languages, FileSearch, Mic, ChevronLeft, ChevronRight, List, LayoutGrid, ChevronRight as ArrowRight, BookOpen } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstantCache } from "@/hooks/useInstantCache";
import useEmblaCarousel from "embla-carousel-react";
import heroFaculdade from "@/assets/capa-estudos.jpg";
import capaEstudos from "@/assets/capa-estudos.jpg";
import capaClassicos from "@/assets/capa-classicos.jpg";
import capaPortugues from "@/assets/capa-portugues.jpg";
import capaPesquisa from "@/assets/capa-pesquisa-cientifica.jpg";
import capaOratoria from "@/assets/capa-oratoria.jpg";

interface CapaBiblioteca {
  Biblioteca: string | null;
  capa: string | null;
}

interface BibliotecaItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  bibliotecaName: string;
  key: string;
  color: string;
}

const bibliotecasItems: BibliotecaItem[] = [
  {
    id: "estudos",
    title: "Estudos",
    description: "Materiais de estudo organizados por área do Direito",
    icon: GraduationCap,
    color: "#10b981",
    route: "/biblioteca-estudos",
    bibliotecaName: "Biblioteca de Estudos",
    key: "estudos",
  },
  {
    id: "classicos",
    title: "Clássicos",
    description: "Clássicos da literatura jurídica",
    icon: Book,
    color: "#f59e0b",
    route: "/biblioteca-classicos",
    bibliotecaName: "Biblioteca Clássicos",
    key: "classicos",
  },
  {
    id: "portugues",
    title: "Português",
    description: "Gramática e redação jurídica",
    icon: Languages,
    color: "#3b82f6",
    route: "/biblioteca-portugues",
    bibliotecaName: "Biblioteca de Português",
    key: "portugues",
  },
  {
    id: "pesquisa",
    title: "Pesquisa Científica",
    description: "Metodologia e produção acadêmica",
    icon: FileSearch,
    color: "#a855f7",
    route: "/biblioteca-pesquisa-cientifica",
    bibliotecaName: "Biblioteca de Pesquisa Científica",
    key: "pesquisa",
  },
  {
    id: "oratoria",
    title: "Oratória",
    description: "Comunicação e persuasão",
    icon: Mic,
    color: "#ec4899",
    route: "/biblioteca-oratoria",
    bibliotecaName: "Biblioteca de Oratória",
    key: "oratoria",
  }
];

// Componente para gerenciar carregamento individual de cada capa
const BibliotecaCapa = ({ 
  capaUrl, 
  title, 
  color, 
  Icon,
  priority = false
}: {
  capaUrl: string | null;
  title: string;
  color: string;
  Icon: React.ElementType;
  priority?: boolean;
}) => {
  const [loaded, setLoaded] = useState(() => {
    if (capaUrl) {
      const img = new Image();
      img.src = capaUrl;
      return img.complete;
    }
    return false;
  });
  
  if (capaUrl) {
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
  }
  
  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}
    >
      <Icon className="w-16 h-16" style={{ color }} />
    </div>
  );
};

const BibliotecaFaculdade = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel");
  
  // Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: true,
    skipSnaps: false,
    containScroll: false,
  });

  // Verificar se a imagem já está em cache
  const [imageLoaded, setImageLoaded] = useState(() => {
    const img = new Image();
    img.src = heroFaculdade;
    return img.complete;
  });

  useEffect(() => {
    if (!imageLoaded) {
      const img = new Image();
      img.src = heroFaculdade;
      img.onload = () => setImageLoaded(true);
    }
  }, [imageLoaded]);

  // Buscar capas das bibliotecas
  const { data: capas } = useInstantCache<CapaBiblioteca[]>({
    cacheKey: "capas-biblioteca-v2",
    cacheDuration: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*");
      if (error) throw error;
      return data as CapaBiblioteca[];
    },
    preloadImages: true,
    imageExtractor: (data) => data.map(c => c.capa).filter(Boolean) as string[],
  });

  // Buscar contagens
  const { data: contagens } = useQuery({
    queryKey: ["contagens-bibliotecas-faculdade"],
    queryFn: async () => {
      const [estudos, classicos, portugues, pesquisa, oratoria] = await Promise.all([
        supabase.from("BIBLIOTECA-ESTUDOS" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-CLASSICOS" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-PORTUGUES" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-PESQUISA-CIENTIFICA" as any).select("*", { count: "exact", head: true }),
        supabase.from("BIBLIOTECA-ORATORIA" as any).select("*", { count: "exact", head: true }),
      ]);
      return {
        estudos: estudos.count || 0,
        classicos: classicos.count || 0,
        portugues: portugues.count || 0,
        pesquisa: pesquisa.count || 0,
        oratoria: oratoria.count || 0,
      };
    },
    staleTime: 1000 * 60 * 30,
  });

  const totalObras = contagens 
    ? Object.values(contagens).reduce((a, b) => a + b, 0) 
    : 0;

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

  const getCapaUrl = (bibliotecaName: string) => {
    const target = normalize(bibliotecaName);
    
    // Usar capas locais para bibliotecas específicas
    if (target.includes("estudo")) return capaEstudos;
    if (target.includes("classico")) return capaClassicos;
    if (target.includes("portugues")) return capaPortugues;
    if (target.includes("pesquisa")) return capaPesquisa;
    if (target.includes("oratoria")) return capaOratoria;
    
    // Fallback para capas do banco de dados
    const match = capas?.find((c) => c.Biblioteca && normalize(c.Biblioteca) === target) 
      || capas?.find((c) => c.Biblioteca && normalize(c.Biblioteca).includes(target)) 
      || capas?.find((c) => c.Biblioteca && target.includes(normalize(c.Biblioteca)));
    return match?.capa || null;
  };

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

  const currentItem = bibliotecasItems[selectedIndex];

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[70vh] z-0">
        <img
          src={heroFaculdade}
          alt="Biblioteca Faculdade"
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
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-emerald-500/50" />
            <BookOpen className="w-4 h-4 text-emerald-500/70" />
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-emerald-500/50" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold">
            <span className="bg-gradient-to-br from-emerald-200 via-green-100 to-emerald-300 bg-clip-text text-transparent">
              Biblioteca III
            </span>
            <span className="block text-lg font-light text-white/90 tracking-widest uppercase">
              Faculdade
            </span>
          </h1>

          <div className="mt-2 flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-white/80">
                <span className="font-semibold text-emerald-300">{totalObras}</span> obras
              </span>
            </div>
            
            {/* Toggle View Button */}
            <button
              onClick={() => setViewMode(v => v === "carousel" ? "list" : "carousel")}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              title={viewMode === "carousel" ? "Ver em lista" : "Ver carrossel"}
            >
              {viewMode === "carousel" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {viewMode === "carousel" ? (
          <>
            {/* Desktop Grid */}
            <div className="hidden md:block px-6 lg:px-12 pb-8 pt-4">
              <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
                {bibliotecasItems.map((item) => {
                  const Icon = item.icon;
                  const capaUrl = getCapaUrl(item.bibliotecaName);
                  const count = contagens?.[item.key as keyof typeof contagens] || 0;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.route)}
                      className="group text-left transition-transform duration-150 hover:scale-[1.02]"
                    >
                      <div 
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-white/30"
                        style={{ boxShadow: `0 8px 24px ${item.color}25` }}
                      >
                        <BibliotecaCapa 
                          capaUrl={capaUrl} 
                          title={item.title} 
                          color={item.color} 
                          Icon={Icon}
                          priority={true}
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                            style={{ backgroundColor: `${item.color}30`, color: item.color }}
                          >
                            <Book className="w-3 h-3" />
                            {count} livros
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-5 h-5" style={{ color: item.color }} />
                            <h3 className="text-xl font-bold text-white drop-shadow-lg">
                              {item.title}
                            </h3>
                          </div>
                          
                          <div 
                            className="inline-flex items-center justify-center gap-2 w-full max-w-[180px] py-2.5 rounded-full text-white text-sm font-semibold"
                            style={{ backgroundColor: item.color }}
                          >
                            Acessar
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden flex-1 flex flex-col px-3 pb-4 overflow-hidden">
              <div className="relative flex-1 flex items-center">
                {/* Navigation Button Left */}
                <button
                  onClick={scrollPrev}
                  className="absolute left-0 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="overflow-hidden w-full" ref={emblaRef}>
                  <div className="flex">
                    {bibliotecasItems.map((item, index) => {
                      const Icon = item.icon;
                      const capaUrl = getCapaUrl(item.bibliotecaName);
                      const isActive = index === selectedIndex;
                      
                      return (
                        <div key={item.id} className="flex-[0_0_60%] min-w-0 px-2">
                          <button
                            onClick={() => isActive && navigate(item.route)}
                            className={`w-full transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-40'}`}
                            style={{ transform: isActive ? 'scale(1)' : 'scale(0.92)' }}
                          >
                            <div 
                              className="relative aspect-[3/4] rounded-2xl overflow-hidden"
                              style={{
                                border: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                                boxShadow: isActive ? `0 8px 24px ${item.color}40` : '0 4px 12px rgba(0,0,0,0.2)'
                              }}
                            >
                              <BibliotecaCapa 
                                capaUrl={capaUrl} 
                                title={item.title} 
                                color={item.color} 
                                Icon={Icon}
                                priority={index <= 2}
                              />
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                              
                              <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
                                <div 
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-md mb-2"
                                  style={{ backgroundColor: `${item.color}30` }}
                                >
                                  <Book className="w-3 h-3" style={{ color: item.color }} />
                                  <span className="text-xs font-bold" style={{ color: item.color }}>
                                    {contagens?.[item.key as keyof typeof contagens] || 0}
                                  </span>
                                  <span className="text-[10px] text-white/70">livros</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-3">
                                  <Icon className="w-4 h-4" style={{ color: isActive ? item.color : 'rgba(255,255,255,0.8)' }} />
                                  <h3 className="text-lg font-bold text-white drop-shadow-lg">
                                    {item.title}
                                  </h3>
                                </div>

                                {/* Botão Acessar dentro da capa */}
                                <div 
                                  className="inline-flex items-center justify-center gap-2 w-full py-2 rounded-full text-white text-xs font-semibold"
                                  style={{ backgroundColor: item.color }}
                                >
                                  Acessar
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Button Right */}
                <button
                  onClick={scrollNext}
                  className="absolute right-0 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation dots */}
              <div className="flex justify-center gap-1.5 mt-4">
                {bibliotecasItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className="w-2 h-2 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: index === selectedIndex ? item.color : 'rgba(255,255,255,0.3)',
                      transform: index === selectedIndex ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          /* List View */
          <div className="px-4 pb-8 pt-4 max-w-2xl mx-auto w-full">
            <div className="space-y-3">
              {bibliotecasItems.map((item) => {
                const Icon = item.icon;
                const count = contagens?.[item.key as keyof typeof contagens] || 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.route)}
                    className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <p className="text-xs text-white/60">{item.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: item.color }}>
                        {count}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/40" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibliotecaFaculdade;
