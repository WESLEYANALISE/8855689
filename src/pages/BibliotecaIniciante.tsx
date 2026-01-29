import { useNavigate } from "react-router-dom";
import { GraduationCap, Book, BookOpen, ChevronLeft, ChevronRight, List, LayoutGrid, ChevronRight as ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import heroBibliotecas from "@/assets/biblioteca-office-sunset.jpg";
import capaEstudos from "@/assets/capa-estudos.jpg";
import capaClassicos from "@/assets/capa-classicos.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";

interface LivroIniciante {
  id: number;
  livro_id: number;
  biblioteca_origem: string;
  titulo: string;
  autor: string | null;
  capa: string | null;
  area: string | null;
  justificativa: string | null;
  ordem: number;
}

interface BibliotecaItem {
  id: string;
  title: string;
  description: string;
  route: string;
  key: string;
  color: string;
  capa: string;
}

const bibliotecasItems: BibliotecaItem[] = [
  {
    id: "estudos",
    title: "Estudos",
    description: "Livros fundamentais para iniciar sua jornada jurídica",
    color: "#10b981",
    route: "/biblioteca-estudos",
    key: "estudos",
    capa: capaEstudos,
  },
  {
    id: "classicos",
    title: "Clássicos",
    description: "Obras atemporais que todo iniciante deve conhecer",
    color: "#f59e0b",
    route: "/biblioteca-classicos",
    key: "classicos",
    capa: capaClassicos,
  },
];

// Componente para gerenciar carregamento individual de cada capa
const BibliotecaCapa = ({ 
  capaUrl, 
  title, 
  color, 
}: {
  capaUrl: string | null;
  title: string;
  color: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  
  if (capaUrl) {
    return (
      <img
        src={capaUrl}
        alt={title}
        className={`w-full h-full object-cover transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    );
  }
  
  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${color}30, ${color}10)` }}
    >
      <Book className="w-16 h-16" style={{ color }} />
    </div>
  );
};

const BibliotecaIniciante = () => {
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

  // Verificar se a imagem já está em cache para exibição INSTANTÂNEA
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

  // Buscar livros curados para iniciantes
  const { data: livros } = useQuery({
    queryKey: ["biblioteca-iniciante"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biblioteca_iniciante")
        .select("*")
        .order("ordem");
      
      if (error) throw error;
      return data as LivroIniciante[];
    },
  });

  const livrosEstudos = livros?.filter(l => l.biblioteca_origem === "estudos") || [];
  const livrosClassicos = livros?.filter(l => l.biblioteca_origem === "classicos") || [];

  const contagens = {
    estudos: livrosEstudos.length,
    classicos: livrosClassicos.length,
  };

  const totalObras = livrosEstudos.length + livrosClassicos.length;

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

  const handleCardClick = (item: BibliotecaItem) => {
    navigate(item.route);
  };

  // Carousel de livros para a seção "Em Alta"
  const [emblaLivrosRef] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });

  const livrosAtuais = selectedIndex === 0 ? livrosEstudos : livrosClassicos;
  const currentColor = currentItem?.color || "#10b981";

  const handleLivroClick = (livro: LivroIniciante) => {
    if (livro.biblioteca_origem === "estudos") {
      navigate("/biblioteca-estudos", { state: { selectedArea: livro.area } });
    } else {
      navigate(`/biblioteca-classicos/${livro.livro_id}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 relative overflow-hidden">
      {/* Hero Background - Limited height with gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-[70vh] z-0">
        <img
          src={heroBibliotecas}
          alt="Biblioteca para Iniciantes"
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
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-amber-500/50" />
            <Sparkles className="w-4 h-4 text-amber-500/70" />
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold">
            <span className="bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent">
              Biblioteca I
            </span>
            <span className="block text-lg font-light text-white/90 tracking-widest uppercase">
              Primeiros Passos
            </span>
          </h1>

          <p className="text-xs text-white/60 mt-1">Curadoria especial para quem está começando</p>

          <div className="mt-2 flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-white/80">
                <span className="font-semibold text-amber-300">{totalObras}</span> obras selecionadas
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
            {/* Desktop/Tablet Grid - Hidden on mobile */}
            <div className="hidden md:block px-6 lg:px-12 pb-8 pt-4">
              <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                {bibliotecasItems.map((item) => {
                  const count = contagens[item.key as keyof typeof contagens] || 0;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleCardClick(item)}
                      className="group text-left transition-transform duration-150 hover:scale-[1.02]"
                    >
                      <div 
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-white/30"
                        style={{
                          boxShadow: `0 8px 24px ${item.color}25`,
                        }}
                      >
                        {/* Cover Image */}
                        <BibliotecaCapa 
                          capaUrl={item.capa} 
                          title={item.title} 
                          color={item.color} 
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        
                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          {/* Book Count Badge */}
                          <div 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                            style={{ 
                              backgroundColor: `${item.color}30`,
                              color: item.color
                            }}
                          >
                            <Book className="w-3 h-3" />
                            {count} livros
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="w-5 h-5" style={{ color: item.color }} />
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

            {/* Mobile Carousel - Hidden on desktop/tablet */}
            <div className="md:hidden flex-1 flex flex-col px-3 pb-4 overflow-hidden">
              {/* Main Carousel - Smaller */}
              <div className="relative flex-1 flex items-center">
                <div className="overflow-hidden w-full" ref={emblaRef}>
                  <div className="flex">
                  {bibliotecasItems.map((item, index) => {
                      const isActive = index === selectedIndex;
                      const count = contagens[item.key as keyof typeof contagens] || 0;
                      
                      return (
                        <div
                          key={item.id}
                          className="flex-[0_0_65%] min-w-0 px-2"
                        >
                          <button
                            onClick={() => isActive && handleCardClick(item)}
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
                              />
                              
                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                              
                              {/* Content */}
                              <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
                                {/* Book count */}
                                <div 
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-md mb-2"
                                  style={{ 
                                    backgroundColor: `${item.color}30`,
                                  }}
                                >
                                  <Book className="w-3 h-3" style={{ color: item.color }} />
                                  <span className="text-xs font-bold" style={{ color: item.color }}>
                                    {count}
                                  </span>
                                  <span className="text-[10px] text-white/70">livros</span>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-1">
                                  <GraduationCap className="w-4 h-4" style={{ color: isActive ? item.color : 'rgba(255,255,255,0.8)' }} />
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

                {/* Navigation Arrows */}
                <button
                  onClick={scrollPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors duration-100 z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors duration-100 z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
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
          </>
        ) : (
          /* List View */
          <div className="flex-1 px-4 pb-6 overflow-y-auto">
            <div className="space-y-3 max-w-lg mx-auto">
              {bibliotecasItems.map((item) => {
                const count = contagens[item.key as keyof typeof contagens] || 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors duration-100 text-left group"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                      {item.capa ? (
                        <img src={item.capa} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${item.color}40, ${item.color}20)` }}
                        >
                          <GraduationCap className="w-6 h-6" style={{ color: item.color }} />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                      <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{item.description}</p>
                      <div 
                        className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${item.color}30`, color: item.color }}
                      >
                        <Book className="w-3 h-3" />
                        {count} livros
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors duration-100 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Seção Em Alta - Livros dinâmicos baseado na categoria selecionada */}
        {viewMode === "carousel" && livrosAtuais.length > 0 && (
          <div className="md:hidden px-4 pb-6 bg-neutral-900">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4" style={{ color: currentColor }} />
              <h2 className="text-sm font-bold text-white">Livros de {currentItem?.title}</h2>
              <span className="text-xs text-white/50">({livrosAtuais.length})</span>
            </div>
            
            <div className="overflow-hidden" ref={emblaLivrosRef}>
              <div className="flex gap-3">
                {livrosAtuais.map((livro) => (
                  <button
                    key={`${livro.biblioteca_origem}-${livro.livro_id}`}
                    onClick={() => handleLivroClick(livro)}
                    className="flex-shrink-0 w-[110px] group text-left"
                  >
                    <div 
                      className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/20 group-hover:border-white/40 transition-all shadow-lg"
                      style={{ boxShadow: `0 4px 16px ${currentColor}30` }}
                    >
                      {livro.capa ? (
                        <img
                          src={livro.capa}
                          alt={livro.titulo}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 brightness-110"
                          loading="lazy"
                        />
                      ) : (
                        <img
                          src={currentItem?.capa || capaEstudos}
                          alt={livro.titulo}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 brightness-110"
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        {livro.area && (
                          <span 
                            className="inline-block text-[8px] font-semibold px-1.5 py-0.5 rounded-full mb-1"
                            style={{ backgroundColor: `${currentColor}40`, color: currentColor }}
                          >
                            {livro.area}
                          </span>
                        )}
                        <h3 className="text-[10px] text-white font-semibold line-clamp-2 leading-tight">
                          {livro.titulo}
                        </h3>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibliotecaIniciante;
