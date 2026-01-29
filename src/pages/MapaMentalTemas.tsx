import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Brain, ArrowLeft, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoadingIndicator } from "@/components/chat/SmartLoadingIndicator";
import PDFViewerModal from "@/components/PDFViewerModal";
interface TemaData {
  id: number;
  tema: string;
  link: string;
  sequencia: number;
}
const CORES_AREAS: Record<string, {
  cor: string;
  glowColor: string;
}> = {
  "DIREITO CIVIL": {
    cor: "bg-red-600",
    glowColor: "rgb(239, 68, 68)"
  },
  "DIREITO CONSTITUCIONAL": {
    cor: "bg-blue-600",
    glowColor: "rgb(59, 130, 246)"
  },
  "DIREITO EMPRESARIAL": {
    cor: "bg-green-600",
    glowColor: "rgb(34, 197, 94)"
  },
  "DIREITO PENAL": {
    cor: "bg-purple-600",
    glowColor: "rgb(168, 85, 247)"
  },
  "DIREITO TRIBUTÁRIO": {
    cor: "bg-yellow-600",
    glowColor: "rgb(234, 179, 8)"
  },
  "DIREITO ADMINISTRATIVO": {
    cor: "bg-indigo-600",
    glowColor: "rgb(99, 102, 241)"
  },
  "DIREITO TRABALHISTA": {
    cor: "bg-orange-600",
    glowColor: "rgb(249, 115, 22)"
  },
  "DIREITO PROCESSUAL CIVIL": {
    cor: "bg-cyan-600",
    glowColor: "rgb(6, 182, 212)"
  },
  "DIREITO PROCESSUAL PENAL": {
    cor: "bg-pink-600",
    glowColor: "rgb(236, 72, 153)"
  }
};
export default function MapaMentalTemas() {
  const navigate = useNavigate();
  const {
    area
  } = useParams<{
    area: string;
  }>();
  const [temas, setTemas] = useState<TemaData[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para visualização de PDF
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedTema, setSelectedTema] = useState<TemaData | null>(null);
  const areaDecoded = area ? decodeURIComponent(area) : '';
  const areaConfig = CORES_AREAS[areaDecoded.toUpperCase()] || {
    cor: 'bg-violet-600',
    glowColor: 'rgb(124, 58, 237)'
  };
  useEffect(() => {
    if (areaDecoded) {
      fetchTemas();
    }
  }, [areaDecoded]);
  const fetchTemas = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('MAPA MENTAL' as any).select('id, tema, link, sequencia, area').eq('area', areaDecoded).order('sequencia', {
        ascending: true
      });
      if (error) throw error;
      
      // Ordenar numericamente por sequencia
      const temasOrdenados = (data as any[] || []).sort((a, b) => 
        Number(a.sequencia) - Number(b.sequencia)
      );
      setTemas(temasOrdenados);
    } catch (error) {
      console.error('Erro ao buscar temas:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleVerClick = (tema: TemaData) => {
    setSelectedTema(tema);
    setShowPDFViewer(true);
  };
  const handleDownloadClick = (link: string) => {
    window.open(link, '_blank');
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
        <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-6">
          <SmartLoadingIndicator nome="Mapas Mentais" />
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[600px] lg:max-w-4xl mx-auto px-4 py-4">
          
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-12 rounded ${areaConfig.cor} shadow-lg`} style={{
            boxShadow: `0 0 20px ${areaConfig.glowColor}`
          }} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{areaDecoded}</h1>
              <p className="text-sm text-muted-foreground">
                {temas.length} {temas.length === 1 ? 'mapa disponível' : 'mapas disponíveis'}
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

          {temas.map((temaData, index) => <div key={temaData.id} className="relative pl-8 animate-fade-in-up" style={{
          animationDelay: `${index * 0.1}s`,
          animationFillMode: 'backwards'
        }}>
              {/* Marcador colorido */}
              <div className={`absolute left-0 top-4 w-7 h-7 rounded-full ${areaConfig.cor} border-4 border-background flex items-center justify-center shadow-xl`} style={{
            boxShadow: `0 0 15px ${areaConfig.glowColor}`
          }}>
                <span className="text-xs font-bold text-white">{temaData.sequencia}</span>
              </div>
              
              {/* Card do tema */}
              <div className="w-full backdrop-blur-sm border-2 border-border/50 rounded-lg shadow-xl transition-all duration-300 hover:shadow-2xl overflow-hidden" style={{
            background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 85%, ${areaConfig.glowColor.replace('rgb', 'rgba').replace(')', ', 0.1)')} 100%)`
          }}>
                {/* Conteúdo */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {temaData.tema}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Mapa Mental #{temaData.sequencia}
                      </p>
                    </div>
                    <Brain className={`w-6 h-6 ${areaConfig.cor.replace('bg-', 'text-')}`} />
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleVerClick(temaData)} 
                      className="flex-1 text-white hover:text-white" 
                      size="sm"
                      style={{
                        backgroundColor: areaConfig.glowColor.replace('rgb', 'rgba').replace(')', ', 0.2)'),
                        borderColor: areaConfig.glowColor.replace('rgb', 'rgba').replace(')', ', 0.3)')
                      }}
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button onClick={() => handleDownloadClick(temaData.link)} variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>)}
        </div>

        {temas.length === 0 && <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum mapa mental encontrado para esta área.</p>
          </div>}
      </div>

      {/* Modal de visualização em modo vertical */}
      {selectedTema && <PDFViewerModal isOpen={showPDFViewer} onClose={() => setShowPDFViewer(false)} normalModeUrl={selectedTema.link} verticalModeUrl={selectedTema.link} title={selectedTema.tema} viewMode="vertical" />}
    </div>;
}