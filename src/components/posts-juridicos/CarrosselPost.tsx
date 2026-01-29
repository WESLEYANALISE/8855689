import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Slide {
  slideNumero: number;
  url: string | null;
  titulo: string;
  texto?: string;
  erro?: string;
}

interface CarrosselPostProps {
  slides: Slide[];
  onDownload?: (index: number, url: string) => void;
}

export const CarrosselPost = ({ slides, onDownload }: CarrosselPostProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleDownload = (slide: Slide) => {
    if (slide.url && onDownload) {
      onDownload(slide.slideNumero, slide.url);
    }
  };

  return (
    <div className="relative w-full">
      {/* Carrossel */}
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 relative aspect-square"
            >
              {slide.url ? (
                <img
                  src={slide.url}
                  alt={slide.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-card to-muted flex flex-col items-center justify-center p-6">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-bold text-foreground text-center mb-2">
                    {slide.titulo}
                  </h3>
                  {slide.texto && (
                    <p className="text-sm text-muted-foreground text-center">
                      {slide.texto}
                    </p>
                  )}
                  {slide.erro && (
                    <p className="text-xs text-destructive mt-2">{slide.erro}</p>
                  )}
                </div>
              )}

              {/* Botão de download */}
              {slide.url && onDownload && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={() => handleDownload(slide)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}

              {/* Número do slide */}
              <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
                {slide.slideNumero}/{slides.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navegação */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background rounded-full"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background rounded-full"
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Indicadores */}
      <div className="flex justify-center gap-1.5 mt-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === selectedIndex
                ? "bg-primary w-4"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default CarrosselPost;
