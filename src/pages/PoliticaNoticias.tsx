import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Newspaper, 
  ChevronRight,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useInstantCache } from "@/hooks/useInstantCache";
import { format, subDays, isToday, isYesterday, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ResumosDisponiveisCarousel from "@/components/ResumosDisponiveisCarousel";
import { toast } from "sonner";

interface NoticiaPolitica {
  id: number;
  titulo: string;
  descricao: string | null;
  url: string;
  fonte: string;
  espectro: string | null;
  imagem_url: string | null;
  imagem_url_webp: string | null;
  data_publicacao: string | null;
}

const PoliticaNoticias = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [buscandoNoticias, setBuscandoNoticias] = useState(false);

  // Gerar últimos 14 dias para o menu
  const dateOptions = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 14; i++) {
      dates.push(subDays(new Date(), i));
    }
    return dates;
  }, []);

  const getDateLabel = useCallback((date: Date): string => {
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "dd/MM", { locale: ptBR });
  }, []);

  // Cache instantâneo - carrega TODAS as notícias de uma vez
  const { data: noticias, isLoading, refresh } = useInstantCache<NoticiaPolitica[]>({
    cacheKey: 'noticias-politicas-lista',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias_politicas_cache')
        .select('id, titulo, descricao, url, fonte, espectro, imagem_url, imagem_url_webp, data_publicacao')
        .eq('processado', true)
        .not('data_publicacao', 'is', null)
        .order('data_publicacao', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data || [];
    },
    cacheDuration: 15 * 60 * 1000, // 15 minutos
  });

  const buscarNoticiasDaData = async () => {
    setBuscandoNoticias(true);
    try {
      const dataFormatada = format(selectedDate, 'yyyy-MM-dd');
      await supabase.functions.invoke('buscar-noticias-politicas', {
        body: { dataEspecifica: dataFormatada }
      });
      
      refresh();
      toast.success('Notícias atualizadas!');
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      toast.error('Erro ao buscar notícias');
    } finally {
      setBuscandoNoticias(false);
    }
  };

  // Filtrar notícias pela data selecionada (rápido - client-side)
  const filteredNoticias = useMemo(() => {
    if (!noticias) return [];
    return noticias.filter(noticia => {
      if (!noticia.data_publicacao) return false;
      const noticiaDate = parseISO(noticia.data_publicacao);
      return isSameDay(noticiaDate, selectedDate);
    });
  }, [noticias, selectedDate]);

  const abrirNoticia = useCallback((noticia: NoticiaPolitica) => {
    navigate(`/politica/noticias/${noticia.id}`);
  }, [navigate]);

  const getFonteBadgeColor = useCallback((fonte: string) => {
    const cores: Record<string, string> = {
      'G1': 'bg-red-500/20 text-red-400',
      'Estadão': 'bg-blue-500/20 text-blue-400',
      'Folha': 'bg-orange-500/20 text-orange-400',
      'Gazeta do Povo': 'bg-green-500/20 text-green-400',
      'Terra': 'bg-teal-500/20 text-teal-400',
      'Poder360': 'bg-indigo-500/20 text-indigo-400',
      'R7': 'bg-orange-600/20 text-orange-500',
      'Brasil de Fato': 'bg-red-600/20 text-red-500',
      'CartaCapital': 'bg-rose-500/20 text-rose-400',
    };
    return cores[fonte] || 'bg-gray-500/20 text-gray-400';
  }, []);

  const formatDateTime = useCallback((dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM às HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  }, []);

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Notícias Políticas</h1>
            <p className="text-sm text-muted-foreground">
              De fontes diversas
            </p>
          </div>
        </div>

        {/* Menu de datas - sem animação */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {dateOptions.map((date, index) => (
              <Button
                key={index}
                variant={isSameDay(date, selectedDate) ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 transition-colors ${isToday(date) ? 'px-6' : ''}`}
              >
                {getDateLabel(date)}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Carrossel de Resumos Disponíveis */}
      <div className="mb-4">
        <ResumosDisponiveisCarousel tipo="politica" />
      </div>

      {/* Contador de notícias */}
      <p className="text-sm text-muted-foreground mb-3">
        {filteredNoticias.length} notícia{filteredNoticias.length !== 1 ? 's' : ''} em {getDateLabel(selectedDate).toLowerCase()}
      </p>

      {isLoading && !noticias?.length ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        </div>
      ) : filteredNoticias.length > 0 ? (
        <div className="space-y-3">
          {filteredNoticias.map((noticia) => (
            <Card
              key={noticia.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
              onClick={() => abrirNoticia(noticia)}
            >
              <CardContent className="p-0">
                <div className="flex">
                  {(noticia.imagem_url_webp || noticia.imagem_url) && (
                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                      <img 
                        src={noticia.imagem_url_webp || noticia.imagem_url || ''} 
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getFonteBadgeColor(noticia.fonte)}`}>
                          {noticia.fonte}
                        </span>
                        {noticia.data_publicacao && (
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(noticia.data_publicacao)}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-sm md:text-base line-clamp-2 text-foreground">
                        {noticia.titulo}
                      </h3>
                      
                      {noticia.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {noticia.descricao}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-primary mt-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Ver notícia</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/30">
          <CardContent className="p-8 text-center">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Nenhuma notícia encontrada para {getDateLabel(selectedDate).toLowerCase()}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isToday(selectedDate) 
                ? "Clique abaixo para buscar as notícias de hoje"
                : "Tente selecionar outra data ou buscar novas notícias"}
            </p>
            <Button 
              onClick={buscarNoticiasDaData}
              disabled={buscandoNoticias}
              className="gap-2"
            >
              {buscandoNoticias ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Buscar Notícias
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PoliticaNoticias;
