// RadarTab - Mostra apenas boletins jurídicos gerados
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, Loader2, Radio, ExternalLink, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useImagePreload } from "@/hooks/useImagePreload";

interface RadarCapa {
  id: string;
  data: string;
  tipo: 'juridico' | 'politico';
  url_capa: string | null;
  titulo_capa: string;
  subtitulo_capa: string;
  total_noticias: number;
}

interface Boletim {
  id: string;
  tipo: string;
  data: string;
}

interface RadarTabProps {
  onClose?: () => void;
}

export const RadarTab = ({ onClose }: RadarTabProps) => {
  const navigate = useNavigate();
  const [capas, setCapas] = useState<RadarCapa[]>([]);
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCapas, setGeneratingCapas] = useState<Set<string>>(new Set());

  // Preload das capas para exibição instantânea
  const capasUrls = useMemo(() => 
    capas.filter(c => c.url_capa).map(c => c.url_capa as string),
    [capas]
  );
  useImagePreload(capasUrls);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar somente boletins jurídicos gerados (ordenados por data mais recente)
      const { data: boletinsData, error: boletinsError } = await supabase
        .from('resumos_diarios')
        .select('id, tipo, data')
        .eq('tipo', 'juridica')
        .order('data', { ascending: false })
        .limit(30);

      if (boletinsError) throw boletinsError;

      setBoletins(boletinsData || []);

      if (boletinsData && boletinsData.length > 0) {
        // Buscar capas para as datas dos boletins existentes
        const datas = [...new Set(boletinsData.map(b => b.data))];
        
        const { data: capasData, error: capasError } = await supabase
          .from('radar_capas_diarias')
          .select('*')
          .in('data', datas)
          .eq('tipo', 'juridico');

        if (capasError) throw capasError;
        
        const typedData = (capasData || []).map(item => ({
          ...item,
          tipo: item.tipo as 'juridico' | 'politico'
        }));
        setCapas(typedData);

        // Auto-generate missing covers para boletins sem capa
        for (const boletim of boletinsData) {
          const temCapa = typedData.some(c => c.data === boletim.data && c.tipo === 'juridico' && c.url_capa);
          
          if (!temCapa) {
            generateCapa('juridico', boletim.data);
          }
        }
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCapa = async (tipo: 'juridico' | 'politico', data: string) => {
    const key = `${tipo}-${data}`;
    if (generatingCapas.has(key)) return;
    
    setGeneratingCapas(prev => new Set(prev).add(key));

    try {
      const { data: result, error } = await supabase.functions.invoke('gerar-capa-radar', {
        body: { tipo, data }
      });

      if (error) throw error;

      if (result?.capa) {
        setCapas(prev => {
          const filtered = prev.filter(c => !(c.tipo === tipo && c.data === data));
          return [...filtered, result.capa];
        });
      }
    } catch (error) {
      console.error(`Erro ao gerar capa ${tipo} para ${data}:`, error);
    } finally {
      setGeneratingCapas(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleCardClick = (tipo: string, data: string) => {
    navigate(`/resumo-do-dia/juridica?data=${data}`);
    onClose?.();
  };

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return 'Hoje';
    if (dateStr === yesterday) return 'Ontem';
    
    return format(parseISO(dateStr), "dd/MM", { locale: ptBR });
  };

  // Renderizar card normal com capa
  const renderCard = (boletim: Boletim) => {
    const capa = capas.find(c => c.data === boletim.data && c.tipo === 'juridico');
    const isGenerating = generatingCapas.has(`juridico-${boletim.data}`);
    
    return (
      <button
        key={boletim.id}
        onClick={() => handleCardClick(boletim.tipo, boletim.data)}
        className="w-full rounded-xl overflow-hidden bg-secondary/50 border border-border hover:border-primary/50 transition-all group"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Gerando capa...</span>
            </div>
          ) : capa?.url_capa ? (
            <img
              src={capa.url_capa}
              alt="Radar Jurídico"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Newspaper className="w-12 h-12 text-primary/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Badge de data */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-black/60 text-white text-[10px] font-medium rounded">
              {formatDateLabel(boletim.data)}
            </span>
          </div>
          
          {/* Ícone de áudio pulsando */}
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
                JURÍDICO
              </span>
              {capa?.total_noticias > 0 && (
                <span className="text-[10px] text-white/70">
                  {capa.total_noticias} notícias
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-white leading-tight">
              {capa?.titulo_capa || 'Notícias Jurídicas'}
            </h4>
            <p className="text-[10px] text-white/80 line-clamp-2 mt-0.5">
              {capa?.subtitulo_capa || 'Resumo das principais notícias jurídicas'}
            </p>
          </div>
        </div>
      </button>
    );
  };

  // Ordenar boletins por data (mais recente primeiro)
  const boletinsOrdenados = [...boletins].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="flex-1 overflow-y-auto py-4 px-4">
      <div className="flex items-center gap-2 mb-1">
        <Radio className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-base font-semibold">Boletins Jurídicos</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Fique atualizado sobre Direito, Concursos e Política
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : boletinsOrdenados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum boletim gerado ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {boletinsOrdenados.map(boletim => renderCard(boletim))}

          {/* Link para ver mais */}
          <button
            onClick={() => {
              navigate('/em-alta');
              onClose?.();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Ver todas as notícias</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
