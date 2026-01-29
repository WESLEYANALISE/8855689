import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Library, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useEmblaCarousel from "embla-carousel-react";
import { useInstantCache, preloadImages } from "@/hooks/useInstantCache";
import { useEffect } from "react";

interface LivroEmAlta {
  id: number;
  area: string;
  tema: string;
  capa: string;
  tabela: string;
}

export const BibliotecaEmAltaCarousel = () => {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({ 
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps"
  });

  const { data: livros, isLoading } = useInstantCache<LivroEmAlta[]>({
    cacheKey: "biblioteca-em-alta",
    queryFn: async () => {
      const livrosEmAlta: LivroEmAlta[] = [];

      // Buscar de BIBLIOTECA-ESTUDOS
      const { data: estudos } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("id, Área, Tema, \"Capa-livro\"")
        .not("Capa-livro", "is", null)
        .limit(5);

      estudos?.forEach((l: any) => {
        if (l["Capa-livro"]) {
          livrosEmAlta.push({
            id: l.id,
            area: l["Área"] || "Estudos",
            tema: l.Tema || "Livro",
            capa: l["Capa-livro"],
            tabela: "estudos"
          });
        }
      });

      // Buscar de BIBLIOTECA-CLASSICOS
      const { data: classicos } = await supabase
        .from("BIBLIOTECA-CLASSICOS")
        .select("id, area, livro, imagem")
        .not("imagem", "is", null)
        .limit(5);

      classicos?.forEach((l: any) => {
        if (l.imagem) {
          livrosEmAlta.push({
            id: l.id,
            area: l.area || "Clássicos",
            tema: l.livro || "Livro",
            capa: l.imagem,
            tabela: "classicos"
          });
        }
      });

      // Buscar de BIBILIOTECA-OAB
      const { data: oab } = await supabase
        .from("BIBILIOTECA-OAB")
        .select("id, Área, Tema, \"Capa-livro\"")
        .not("Capa-livro", "is", null)
        .limit(5);

      oab?.forEach((l: any) => {
        if (l["Capa-livro"]) {
          livrosEmAlta.push({
            id: l.id,
            area: l["Área"] || "OAB",
            tema: l.Tema || "Livro",
            capa: l["Capa-livro"],
            tabela: "oab"
          });
        }
      });

      return livrosEmAlta.sort(() => Math.random() - 0.5).slice(0, 10);
    },
    preloadImages: true,
    imageExtractor: (data) => data.map(l => l.capa).filter(Boolean),
  });

  // Preload imagens
  useEffect(() => {
    if (livros && livros.length > 0) {
      preloadImages(livros.map(l => l.capa).filter(Boolean));
    }
  }, [livros]);

  const handleClick = (livro: LivroEmAlta) => {
    if (livro.tabela === "estudos") {
      navigate("/biblioteca-estudos", { state: { selectedArea: livro.area } });
    } else if (livro.tabela === "classicos") {
      navigate("/biblioteca-classicos");
    } else {
      navigate("/biblioteca-oab");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-base">Biblioteca em Alta</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[120px] h-[170px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!livros || livros.length === 0) return null;

  return (
    <div className="space-y-3">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate('/bibliotecas')}
      >
        <Library className="w-5 h-5 text-amber-500" />
        <h2 className="font-bold text-base">Biblioteca em Alta</h2>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {livros.map((livro) => (
            <div
              key={`${livro.tabela}-${livro.id}`}
              className="flex-shrink-0 w-[120px] cursor-pointer group"
              onClick={() => handleClick(livro)}
            >
              <div className="bg-secondary/30 rounded-xl overflow-hidden transition-all hover:bg-secondary/50 hover:scale-[1.02]">
                <div className="relative aspect-[2/3] bg-secondary overflow-hidden">
                  <img
                    src={livro.capa}
                    alt={livro.tema}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-1.5 left-1.5 right-1.5">
                    <div className="flex items-center gap-1 text-white/90">
                      <BookOpen className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-medium truncate">{livro.area}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <h3 className="font-medium text-xs line-clamp-2 leading-tight">
                    {livro.tema}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};