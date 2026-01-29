import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useCursosCache } from "@/hooks/useCursosCache";
import { cn } from "@/lib/utils";
import { preloadImages, isImagePreloaded } from "@/hooks/useInstantCache";

interface AulaPreview {
  area: string;
  tema: string;
  ordem: number;
  capaAula: string;
}

const CACHE_KEY = 'cursosAreaSelecionada';
const ONE_HOUR = 60 * 60 * 1000;

// Função para obter área persistida ou escolher nova aleatória
const getOrChooseArea = (areas: string[]): string | null => {
  if (areas.length === 0) return null;
  
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const { area, timestamp } = JSON.parse(saved);
      // Mantém área se ainda válida E se área ainda existe
      if (Date.now() - timestamp < ONE_HOUR && areas.includes(area)) {
        return area;
      }
    }
  } catch {
    // Ignora erros
  }
  
  // Escolher nova área aleatória
  const novaArea = areas[Math.floor(Math.random() * areas.length)];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      area: novaArea,
      timestamp: Date.now()
    }));
  } catch {
    // Ignora erros de storage
  }
  return novaArea;
};

// Card individual no mesmo formato do NoticiaCarouselCard
const CursoAulaCard = ({ aula, priority = false }: { aula: AulaPreview; priority?: boolean }) => {
  const navigate = useNavigate();
  
  // Verificar se imagem já está no cache de imagens para evitar skeleton desnecessário
  const [isLoading, setIsLoading] = useState(() => {
    if (!aula.capaAula) return false;
    return !isImagePreloaded(aula.capaAula);
  });

  return (
    <div 
      onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(aula.area)}/aula/${encodeURIComponent(aula.tema)}`)}
      className="flex-shrink-0 w-[240px] cursor-pointer group"
    >
      <div className="flex flex-col rounded-xl bg-card border border-border shadow-lg overflow-hidden h-full">
        {/* Imagem - proporção 16:9 com skeleton shimmer */}
        <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0">
          {/* Skeleton shimmer enquanto carrega */}
          <div 
            className={cn(
              "absolute inset-0 skeleton-shimmer transition-opacity duration-300",
              isLoading ? "opacity-100" : "opacity-0"
            )}
          />
          
          {aula.capaAula ? (
            <img 
              src={aula.capaAula} 
              alt={aula.tema}
              loading={priority ? "eager" : "lazy"}
              decoding={priority ? "sync" : "async"}
              fetchPriority={priority ? "high" : "auto"}
              className={cn(
                "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 via-background to-background">
              <GraduationCap className="w-10 h-10 text-red-400/50" />
            </div>
          )}
          
          {/* Badge do número da aula no canto inferior esquerdo */}
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium text-white bg-red-600 shadow-md z-10">
            Aula {aula.ordem}
          </span>
        </div>

        {/* Conteúdo abaixo - título = tema, subtítulo = área */}
        <div className="p-2.5 flex flex-col gap-1 flex-1 min-h-[60px]">
          <h3 className="text-xs font-semibold text-card-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1">
            {aula.tema}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-auto">
            {aula.area}
          </p>
        </div>
      </div>
    </div>
  );
};

export const CursosAreasCarousel = () => {
  const navigate = useNavigate();
  const { cursos } = useCursosCache();
  const processedRef = useRef(false);
  const cachedAulasRef = useRef<AulaPreview[]>([]);
  const cachedAreaRef = useRef<string>('');

  const { aulas, areaEscolhida } = useMemo(() => {
    if (processedRef.current && cachedAulasRef.current.length > 0) {
      return { aulas: cachedAulasRef.current, areaEscolhida: cachedAreaRef.current };
    }
    
    if (cursos.length === 0) return { aulas: [], areaEscolhida: '' };
    
    // Obter todas as áreas disponíveis
    const areas = [...new Set(cursos.map((c: any) => c.area))] as string[];
    const area = getOrChooseArea(areas);
    
    if (!area) return { aulas: [], areaEscolhida: '' };
    
    // Filtrar aulas da área escolhida
    const aulasDaArea: AulaPreview[] = cursos
      .filter((c: any) => c.area === area)
      .slice(0, 10) // Limitar a 10 aulas
      .map((c: any) => ({
        area: c.area,
        tema: c.tema,
        ordem: c.ordem,
        capaAula: c['capa-aula'] || ''
      }));
    
    if (aulasDaArea.length > 0) {
      processedRef.current = true;
      cachedAulasRef.current = aulasDaArea;
      cachedAreaRef.current = area;
    }
    
    return { aulas: aulasDaArea, areaEscolhida: area };
  }, [cursos.length > 0 ? cursos[0]?.area : null]);

  // Pré-carregar imagens das aulas quando disponíveis
  useEffect(() => {
    if (aulas.length > 0) {
      const imageUrls = aulas.map(a => a.capaAula).filter(Boolean);
      if (imageUrls.length > 0) {
        preloadImages(imageUrls);
      }
    }
  }, [aulas]);

  if (aulas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header - igual ao de Notícias Jurídicas */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-xl">
            <GraduationCap className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-base font-semibold text-foreground">Cursos</h2>
            <p className="text-xs text-muted-foreground">{areaEscolhida}</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => navigate('/iniciando-direito/todos')} 
          className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-4 text-xs flex items-center gap-1.5 font-medium"
        >
          Ver mais
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
      
      {/* Carrossel */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 touch-pan-x">
          {aulas.map((aula, index) => (
            <CursoAulaCard 
              key={`${aula.area}-${aula.ordem}`} 
              aula={aula} 
              priority={index < 3}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
