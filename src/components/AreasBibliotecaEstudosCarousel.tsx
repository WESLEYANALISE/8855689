import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { Loader2, BookOpen } from "lucide-react";
import { useMemo } from "react";

interface BibliotecaItem {
  id: number;
  Área: string | null;
  "Capa-livro": string | null;
  url_capa_gerada: string | null;
}

const AreasBibliotecaEstudosCarousel = () => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    skipSnaps: true,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["biblioteca-estudos-areas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-ESTUDOS")
        .select("Área, Capa-livro, url_capa_gerada")
        .order("Área");

      if (error) throw error;
      return data as BibliotecaItem[];
    },
  });

  // Agrupar por área e pegar a primeira capa de LIVRO de cada área + contar livros
  const areas = useMemo(() => {
    if (!items) return [];
    
    const areaMap = new Map<string, { capa: string | null; count: number }>();
    items.forEach(item => {
      if (item.Área) {
        const existing = areaMap.get(item.Área);
        if (!existing) {
          // Usar a capa gerada ou a capa manual do primeiro livro
          const capaLivro = item.url_capa_gerada || item["Capa-livro"];
          areaMap.set(item.Área, { capa: capaLivro, count: 1 });
        } else {
          // Se ainda não tem capa, tentar usar deste livro
          if (!existing.capa) {
            const capaLivro = item.url_capa_gerada || item["Capa-livro"];
            if (capaLivro) {
              existing.capa = capaLivro;
            }
          }
          existing.count += 1;
        }
      }
    });

    return Array.from(areaMap.entries())
      .map(([area, data]) => ({ area, capa: data.capa, count: data.count }))
      .sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!areas.length) {
    return null;
  }

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3">
        {areas.map(({ area, capa, count }) => (
          <div
            key={area}
            onClick={() => navigate("/biblioteca-estudos", { state: { selectedArea: area } })}
            className="flex-[0_0_140px] min-w-0 cursor-pointer group"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-[0_8px_30px_rgba(0,_0,_0,_0.4)] border border-accent/20 hover:border-accent/60 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(8,_112,_184,_0.6)]">
              {capa ? (
                <img
                  src={capa}
                  alt={area}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-accent" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                  {area}
                </h3>
                <div className="flex items-center justify-between text-[9px] text-white/60">
                  <span>Atualizado 2026</span>
                  <span>{count} {count === 1 ? 'livro' : 'livros'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AreasBibliotecaEstudosCarousel;
