import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { useCursosCache } from "@/hooks/useCursosCache";
import { useImagePreload } from "@/hooks/useImagePreload";
import { TemaCardSkeleton } from "@/components/aula/TemaCardSkeleton";
interface TemaData {
  tema: string;
  ordem: number;
  'capa-aula': string;
  'aula-link': string;
}
const CORES_AREAS: Record<string, string> = {
  "Direito Penal": "bg-red-600",
  "Direito Civil": "bg-blue-600",
  "Direito Constitucional": "bg-green-600",
  "Direito Administrativo": "bg-purple-600",
  "Direito Trabalhista": "bg-yellow-600",
  "Direito Empresarial": "bg-pink-600",
  "Direito Tributário": "bg-indigo-600",
  "Direito Processual Civil": "bg-cyan-600",
  "Direito Processual Penal": "bg-orange-600"
};
export default function IniciandoDireitoTemas() {
  const navigate = useNavigate();
  const {
    area
  } = useParams<{
    area: string;
  }>();
  const [temas, setTemas] = useState<TemaData[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    cursos,
    loading: cursosLoading
  } = useCursosCache();
  const areaDecoded = area ? decodeURIComponent(area) : '';
  const corArea = CORES_AREAS[areaDecoded] || 'bg-gray-600';
  useEffect(() => {
    if (!cursosLoading && areaDecoded) {
      const temasArea = cursos.filter(c => c.area === areaDecoded).map(c => ({
        tema: c.tema,
        ordem: c.ordem,
        'capa-aula': c['capa-aula'],
        'aula-link': c['aula-link']
      })).sort((a, b) => a.ordem - b.ordem);
      setTemas(temasArea);
      setLoading(false);
    }
  }, [cursosLoading, cursos, areaDecoded]);

  // Preload das primeiras 3 capas
  const capasUrls = temas.filter(t => t['capa-aula']).map(t => t['capa-aula']);
  useImagePreload(capasUrls);
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-12 rounded ${corArea} shadow-lg animate-glow-pulse`} />
              <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold text-foreground">{areaDecoded}</h1>
                <p className="text-sm text-muted-foreground">Carregando temas...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skeletons */}
        <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-6">
          <div className="relative space-y-6">
            <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />
            
            {[...Array(5)].map((_, i) => <TemaCardSkeleton key={i} index={i} corArea={corArea} />)}
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(areaDecoded)}`)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao módulo
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-12 rounded ${corArea} shadow-lg animate-glow-pulse`} />
            <div className="animate-fade-in-up">
              <h1 className="text-2xl font-bold text-foreground">{areaDecoded}</h1>
              <p className="text-sm text-muted-foreground">
                {temas.length} {temas.length === 1 ? 'tema disponível' : 'temas disponíveis'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-6">
        {/* Timeline de Temas */}
        <div className="relative space-y-6">
          {/* Linha vertical */}
          <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />

          {temas.map((temaData, index) => <div key={index} className="relative pl-8 animate-fade-in-up" style={{
          animationDelay: `${index * 0.12}s`,
          animationFillMode: 'backwards'
        }}>
              {/* Marcador colorido com animação */}
              <div className={`absolute left-0 top-4 w-7 h-7 rounded-full ${corArea} border-4 border-background flex items-center justify-center shadow-xl animate-bounce-in`} style={{
            animationDelay: `${index * 0.12 + 0.3}s`,
            animationFillMode: 'backwards'
          }}>
                <span className="text-xs font-bold text-white">{temaData.ordem}</span>
              </div>
              
              {/* Card do tema */}
              <button 
                onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(areaDecoded)}/aula/${encodeURIComponent(temaData.tema)}`)} 
                className="w-full text-left relative overflow-hidden backdrop-blur-sm border-2 border-border/50 rounded-lg hover:border-primary hover:shadow-2xl shadow-xl transition-all duration-300 group hover:scale-[1.02]" 
                style={{
            background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 70%, ${corArea.replace('bg-', '')} 100%)`
          }}>
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500" style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`,
              backgroundSize: '200% 100%'
            }} />
                
                {/* Imagem de capa */}
                {temaData['capa-aula'] && <div className="relative h-40 overflow-hidden bg-muted">
                    <img src={temaData['capa-aula']} alt={temaData.tema} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading={index < 3 ? "eager" : "lazy"} decoding="async" fetchPriority={index === 0 ? "high" : "auto"} onError={e => {
                e.currentTarget.style.display = 'none';
              }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute top-3 right-3 animate-bounce-in" style={{
                animationDelay: `${index * 0.12 + 0.5}s`,
                animationFillMode: 'backwards'
              }}>
                      <div className={`${corArea} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg`}>
                        Aula {temaData.ordem}
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <PlayCircle className="w-10 h-10 text-white opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                    </div>
                  </div>}

                {/* Conteúdo */}
                <div className="p-5 relative z-10">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
                    {temaData.tema}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Videoaula + Conteúdo Detalhado</span>
                  </div>

                  <div className="mt-3 text-right">
                    <span className="text-xs text-primary font-semibold group-hover:underline inline-flex items-center gap-1">
                      Começar aula →
                    </span>
                  </div>
                </div>
              </button>
            </div>)}
        </div>

        {temas.length === 0 && <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum tema encontrado para esta área.</p>
          </div>}
      </div>
    </div>;
}