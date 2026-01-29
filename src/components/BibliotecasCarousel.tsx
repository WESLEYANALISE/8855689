import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Loader2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInstantCache, preloadImages } from "@/hooks/useInstantCache";
import { UniversalImage } from "@/components/ui/universal-image";

interface CapaBiblioteca {
  Biblioteca: string | null;
  capa: string | null;
}

const BibliotecasCarousel = () => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const { data: capas, isLoading } = useInstantCache<CapaBiblioteca[]>({
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

  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

  const bibliotecas = useMemo(() => [
    {
      title: "Biblioteca III",
      subtitle: "Faculdade",
      path: "/biblioteca-faculdade",
      bibliotecaName: "Biblioteca de Estudos",
    },
    {
      title: "Biblioteca da OAB",
      path: "/biblioteca-oab",
      bibliotecaName: "Biblioteca da OAB",
    },
    {
      title: "Biblioteca de Liderança",
      path: "/biblioteca-lideranca",
      bibliotecaName: "Biblioteca de Liderança",
    },
    {
      title: "Biblioteca Fora da Toga",
      path: "/biblioteca-fora-da-toga",
      bibliotecaName: "Biblioteca Fora da Toga",
    }
  ], []);

  // Preload das imagens
  useEffect(() => {
    if (capas && capas.length > 0) {
      const urls = capas.map(c => c.capa).filter(Boolean) as string[];
      preloadImages(urls);
    }
  }, [capas]);

  const getCapaUrl = useCallback((bibliotecaName: string) => {
    const target = normalize(bibliotecaName);
    const match = capas?.find(
      (c) => c.Biblioteca && normalize(c.Biblioteca) === target
    ) || capas?.find(
      (c) => c.Biblioteca && normalize(c.Biblioteca).includes(target)
    ) || capas?.find(
      (c) => c.Biblioteca && target.includes(normalize(c.Biblioteca))
    );
    return match?.capa || null;
  }, [capas]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 md:w-5 md:h-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      {canScrollPrev && (
        <button
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition-all -ml-2"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollNext && (
        <button
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition-all -mr-2"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 md:gap-5">
        {bibliotecas.map((biblioteca) => {
          const capaUrl = getCapaUrl(biblioteca.bibliotecaName);
          
          return (
            <button
              key={biblioteca.path}
              onClick={() => navigate(biblioteca.path)}
              className="flex-[0_0_80%] md:flex-[0_0_40%] lg:flex-[0_0_25%] min-w-0 bg-card rounded-2xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] group shadow-xl shadow-accent/20 ring-1 ring-accent/30 hover:ring-accent/50 hover:shadow-2xl hover:shadow-accent/40"
            >
              <div className="aspect-[16/10] relative bg-gradient-to-br from-accent/20 to-accent/5">
                {capaUrl ? (
                  <UniversalImage
                    src={capaUrl}
                    alt={biblioteca.title}
                    priority
                    blurCategory="library"
                    containerClassName="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                    <span className="text-5xl">📚</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                <div className="absolute top-4 right-4 bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold text-sm shadow-lg group-hover:bg-white/30 transition-colors border border-white/30">
                  Acessar
                  <ArrowRight className="w-4 h-4" />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-4">
                  <h3 className="text-xl md:text-lg font-bold text-white drop-shadow-2xl leading-tight">
                    {biblioteca.title}
                  </h3>
                  {biblioteca.subtitle && (
                    <p className="text-xs text-white/80 mt-1">{biblioteca.subtitle}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default BibliotecasCarousel;