import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  Loader2, 
  Play, 
  Sparkles,
  Clock,
  X
} from "lucide-react";
import { toast } from "sonner";

interface Segmento {
  id: string;
  texto: string;
  inicio_segundos: number;
  fim_segundos: number;
  similaridade: number;
}

interface ResultadoVideo {
  video_id: string;
  video_titulo: string;
  tribunal: string;
  thumbnail: string | null;
  segmentos: Segmento[];
  melhor_similaridade: number;
}

interface BuscaResponse {
  success: boolean;
  query: string;
  totalSegmentos: number;
  totalVideos: number;
  resultados: ResultadoVideo[];
  error?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function BuscaSemanticaAudiencias() {
  const navigate = useNavigate();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [query, setQuery] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoVideo[]>([]);
  const [totalSegmentos, setTotalSegmentos] = useState(0);

  const handleBuscar = async () => {
    if (query.trim().length < 3) {
      toast.error('Digite pelo menos 3 caracteres');
      return;
    }

    setBuscando(true);
    setResultados([]);

    try {
      const { data, error } = await supabase.functions.invoke<BuscaResponse>('buscar-semantico-audiencias', {
        body: { query: query.trim(), limite: 20, similaridadeMinima: 0.45 }
      });

      if (error) throw error;

      if (data?.success) {
        setResultados(data.resultados);
        setTotalSegmentos(data.totalSegmentos);
        
        if (data.totalVideos === 0) {
          toast.info('Nenhum resultado encontrado. Tente termos diferentes.');
        }
      } else {
        throw new Error(data?.error || 'Erro na busca');
      }
    } catch (error: any) {
      console.error('Erro na busca semântica:', error);
      toast.error(error.message || 'Erro ao buscar');
    } finally {
      setBuscando(false);
    }
  };

  const handleIrParaVideo = (videoId: string, timestamp: number) => {
    setDialogAberto(false);
    navigate(`/ferramentas/audiencias/${videoId}?t=${timestamp}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  return (
    <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Busca Semântica
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Busca Semântica nas Audiências
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: direitos fundamentais na extradição"
                className="pl-10"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button onClick={handleBuscar} disabled={buscando || query.trim().length < 3}>
              {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Busca por significado nas transcrições. Use termos jurídicos ou temas específicos.
          </p>

          {/* Resultados */}
          <ScrollArea className="h-[400px]">
            {buscando ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Buscando com IA...</p>
              </div>
            ) : resultados.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {totalSegmentos} trechos encontrados em {resultados.length} vídeos
                </p>

                {resultados.map((video) => (
                  <Card key={video.video_id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        {video.thumbnail && (
                          <img 
                            src={video.thumbnail} 
                            alt={video.video_titulo}
                            className="w-24 h-14 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm line-clamp-2">
                            {video.video_titulo}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {video.tribunal}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(video.melhor_similaridade * 100)}% relevância
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-2 space-y-2">
                      {video.segmentos.slice(0, 3).map((segmento) => (
                        <div
                          key={segmento.id}
                          className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => handleIrParaVideo(video.video_id, segmento.inicio_segundos)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-sm line-clamp-2">{segmento.texto}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs font-mono">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTime(segmento.inicio_segundos)}
                                </Badge>
                                <Progress 
                                  value={segmento.similaridade * 100} 
                                  className="w-16 h-1.5"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(segmento.similaridade * 100)}%
                                </span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {video.segmentos.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{video.segmentos.length - 3} trechos encontrados
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">Digite uma busca para encontrar trechos relevantes</p>
                <p className="text-xs mt-2">
                  Exemplos: "presunção de inocência", "prazo prescricional", "tutela de urgência"
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
