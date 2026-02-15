import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { GraduationCap, Library, MessageCircle, Brain, ChevronRight } from "lucide-react";
import cardAulasThumb from "@/assets/card-aulas-thumb.jpg";
import bibliotecaThumb from "@/assets/biblioteca-office-sunset.webp";
import evelynThumb from "@/assets/landing/evelyn-ai-section.webp";
import heroFlashcardsThumb from "@/assets/hero-flashcards.webp";

interface EmAltaCarouselProps {
  navigate: (path: string) => void;
}

const items = [
  {
    label: "Aulas",
    subtitle: "Jornada de estudos",
    icon: GraduationCap,
    thumb: cardAulasThumb,
    path: "/aulas",
    iconColor: "text-amber-500",
  },
  {
    label: "Biblioteca",
    subtitle: "Acervo completo",
    icon: Library,
    thumb: bibliotecaThumb,
    path: "/bibliotecas",
    iconColor: "text-amber-500",
  },
  {
    label: "Evelyn IA",
    subtitle: "Assistente jurídica",
    icon: MessageCircle,
    thumb: evelynThumb,
    path: "/evelyn",
    iconColor: "text-violet-400",
  },
  {
    label: "Flashcards",
    subtitle: "Revisão rápida",
    icon: Brain,
    thumb: heroFlashcardsThumb,
    path: "/flashcards/areas",
    iconColor: "text-emerald-400",
  },
];

export const EmAltaCarousel = ({ navigate }: EmAltaCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex-[0_0_47%] min-w-0 overflow-hidden rounded-2xl text-left border border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.6)] transition-all group bg-card"
            >
              <div className="relative h-[70px] overflow-hidden">
                <img src={item.thumb} alt="" className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    <h3 className="text-sm font-bold text-foreground">{item.label}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3">
        {scrollSnaps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === selectedIndex ? "bg-foreground w-4" : "bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
