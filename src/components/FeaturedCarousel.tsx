import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeaturedItem } from "@/hooks/useFeaturedContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
interface FeaturedCarouselProps {
  items: FeaturedItem[];
}
export const FeaturedCarousel = ({
  items
}: FeaturedCarouselProps) => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    skipSnaps: false,
    dragFree: false
  });
  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();
  if (items.length === 0) {
    return null;
  }
  return <div className="relative">
      {/* Carrossel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {items.map(item => {
          const Icon = item.type === 'curso' ? Scale : Video;
          const colorClass = item.type === 'curso' ? 'from-green-600/20 to-green-900/20' : 'from-red-600/20 to-red-900/20';
          const iconBg = item.type === 'curso' ? 'bg-green-600' : 'bg-red-600';
          return <div key={item.id} className="flex-[0_0_100%] md:flex-[0_0_65%] min-w-0">
                <Card className="cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-card to-card/50 group shadow-xl overflow-hidden h-full" onClick={() => navigate(item.link)}>
                  {/* Thumbnail com aspect ratio fixo */}
                  <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" /> : <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${colorClass}`}>
                        <Icon className="w-20 h-20 text-accent/50" />
                      </div>}
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Badge do tipo */}
                    <div className="absolute top-4 left-4">
                      
                    </div>

                    {/* Conteúdo sobreposto */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                        {item.title}
                      </h3>
                      {item.subtitle && <p className="text-sm text-white/90 mb-4 drop-shadow-md">
                          {item.subtitle}
                        </p>}
                      
                      {/* Botão Começar */}
                      <Button className={`${iconBg} hover:opacity-90 text-white font-semibold px-8 shadow-lg transition-all group-hover:scale-105`} onClick={e => {
                    e.stopPropagation();
                    navigate(item.link);
                  }}>
                        Começar
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>;
        })}
        </div>
      </div>

      {/* Botões de navegação - apenas desktop */}
      {items.length > 1 && <>
          <Button variant="outline" size="icon" className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/95 border-accent/50 shadow-xl" onClick={scrollPrev}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/95 border-accent/50 shadow-xl" onClick={scrollNext}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>}
    </div>;
};