import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCursosCache } from "@/hooks/useCursosCache";
import { Play } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CursoPreview {
  area: string;
  tema: string;
  ordem: number;
  corHex: string;
  capaAula?: string;
}

const CORES_AREAS: Record<string, string> = {
  "Direito Penal": "#ef4444",
  "Direito Civil": "#3b82f6",
  "Direito Constitucional": "#10b981",
  "Direito Administrativo": "#a855f7",
  "Direito Trabalhista": "#f59e0b",
  "Direito Empresarial": "#ec4899",
  "Direito Tributário": "#6366f1",
  "Direito Processual Civil": "#06b6d4",
  "Direito Processual Penal": "#f97316"
};

const CACHE_KEY = 'cursosDestaqueArea';
const ONE_HOUR = 60 * 60 * 1000;

// Função para obter área persistida ou escolher nova
const getOrChooseArea = (areas: string[]): string | null => {
  if (areas.length === 0) return null;
  
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const { area, timestamp } = JSON.parse(saved);
      // Mantém área se ainda válida E se área ainda existe nos dados
      if (Date.now() - timestamp < ONE_HOUR && areas.includes(area)) {
        return area;
      }
    }
  } catch {
    // Ignora erros de parse
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

export const CursosCarousel = () => {
  const navigate = useNavigate();
  const { cursos } = useCursosCache();
  const processedRef = useRef(false);
  const cachedCursosRef = useRef<CursoPreview[]>([]);

  // Processa cursos apenas UMA VEZ quando dados chegam
  const cursosDestaque = useMemo(() => {
    // Se já processou e tem dados em cache, retorna o cache
    if (processedRef.current && cachedCursosRef.current.length > 0) {
      return cachedCursosRef.current;
    }
    
    if (cursos.length === 0) return [];
    
    const areas = [...new Set(cursos.map((c: any) => c.area))] as string[];
    const areaEscolhida = getOrChooseArea(areas);
    
    if (!areaEscolhida) return [];
    
    const resultado = cursos
      .filter((c: any) => c.area === areaEscolhida)
      .slice(0, 6)
      .map((c: any) => ({
        area: c.area,
        tema: c.tema,
        ordem: c.ordem,
        corHex: CORES_AREAS[c.area] || "#6b7280",
        capaAula: c['capa-aula']
      }));
    
    // Marca como processado e guarda em cache
    if (resultado.length > 0) {
      processedRef.current = true;
      cachedCursosRef.current = resultado;
    }
    
    return resultado;
  }, [cursos.length > 0 ? cursos[0]?.area : null]); // Só recalcula se a primeira área mudar (indicativo de dados novos reais)

  if (cursosDestaque.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 md:gap-4 pb-4 touch-pan-x">
        {cursosDestaque.map((curso, idx) => (
          <div
            key={idx}
            onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(curso.area)}/aula/${encodeURIComponent(curso.tema)}`)}
            className="flex-shrink-0 w-[320px] cursor-pointer group rounded-xl overflow-hidden shadow-lg border border-border/50 will-change-transform transform-gpu hover:scale-[1.02] transition-transform duration-200 ease-out"
          >
            {/* Container da imagem - limpo, sem texto sobreposto */}
            <div 
              className="relative overflow-hidden"
              style={{
                backgroundColor: curso.corHex + '20'
              }}
            >
              {/* Imagem da capa */}
              {curso.capaAula ? (
                <img 
                  src={curso.capaAula} 
                  alt={curso.tema}
                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div 
                  className="w-full aspect-[3/4]"
                  style={{
                    background: `linear-gradient(135deg, ${curso.corHex}30, ${curso.corHex}10)`
                  }}
                />
              )}
              
              {/* Icon de Play - centralizado */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div 
                  className="rounded-full p-4 shadow-2xl backdrop-blur-sm"
                  style={{ backgroundColor: curso.corHex + '40' }}
                >
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>

              {/* Aula número badge - apenas sobre a imagem */}
              <div className="absolute top-4 right-4 z-10">
                <div 
                  className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                  style={{ backgroundColor: curso.corHex + (curso.capaAula ? '90' : '') }}
                >
                  Aula {curso.ordem}
                </div>
              </div>

              {/* Hover overlay sutil */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(to top, ${curso.corHex}20 0%, transparent 40%)`
                }}
              />
            </div>

            {/* Informações ABAIXO da capa */}
            <div className="p-3 bg-muted">
              <p className="text-xs text-white/90 mb-1">
                {curso.area}
              </p>
              <h3 className="font-bold text-sm leading-tight line-clamp-2 text-foreground">
                {curso.tema}
              </h3>
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
