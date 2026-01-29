import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Flame, BookOpen, Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useInstantCache, preloadImages } from "@/hooks/useInstantCache";

interface AreaFlashcard {
  id: number;
  area: string;
  url_capa: string | null;
  total_flashcards: number;
}

export const FlashcardsEmAltaCarousel = () => {
  const navigate = useNavigate();
  const [gerandoCapa, setGerandoCapa] = useState<string | null>(null);

  const { data: areas, isLoading, refresh } = useInstantCache<AreaFlashcard[]>({
    cacheKey: "flashcards-areas-carousel",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flashcards_areas")
        .select("*")
        .order("area", { ascending: true });

      if (error) throw error;
      return (data || []) as AreaFlashcard[];
    },
    preloadImages: true,
    imageExtractor: (data) => data.map(a => a.url_capa).filter(Boolean) as string[],
  });

  // Preload imagens
  useEffect(() => {
    if (areas && areas.length > 0) {
      const urls = areas.map(a => a.url_capa).filter(Boolean) as string[];
      preloadImages(urls);
    }
  }, [areas]);

  const gerarCapa = async (area: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGerandoCapa(area);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-capa-flashcard-area", {
        body: { area },
      });

      if (error) throw error;

      toast.success(`Capa gerada para ${area}!`);
      refresh();
    } catch (err) {
      console.error("Erro ao gerar capa:", err);
      toast.error("Erro ao gerar capa");
    } finally {
      setGerandoCapa(null);
    }
  };

  if (isLoading && !areas) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-base">Flashcards em Alta</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[160px] h-[180px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!areas || areas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="font-bold text-base">Flashcards em Alta</h2>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {areas.map((area, index) => (
            <div
              key={area.id}
              className="flex-shrink-0 w-[160px] cursor-pointer group"
              onClick={() => navigate(`/flashcards/temas?area=${encodeURIComponent(area.area)}`)}
            >
              <div className="bg-secondary/30 rounded-xl overflow-hidden transition-all hover:bg-secondary/50 hover:scale-[1.02]">
                <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                  {area.url_capa ? (
                    <img
                      src={area.url_capa}
                      alt={area.area}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20 cursor-pointer"
                      onClick={(e) => !gerandoCapa && gerarCapa(area.area, e)}
                    >
                      {gerandoCapa === area.area ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                          <span className="text-[10px] text-muted-foreground">Gerando...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Sparkles className="w-8 h-8 text-red-400/50" />
                          <span className="text-[10px] text-muted-foreground">Gerar capa</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                    <div className="flex items-center gap-1 text-white/90">
                      <BookOpen className="w-3 h-3" />
                      <span className="text-[10px] font-medium truncate">
                        {area.total_flashcards.toLocaleString("pt-BR")} cards
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 h-[56px] flex flex-col justify-start">
                  <h3 className="font-semibold text-sm line-clamp-2 whitespace-normal leading-tight">
                    {area.area}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};