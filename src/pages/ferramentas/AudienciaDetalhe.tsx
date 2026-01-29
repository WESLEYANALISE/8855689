import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Play, 
  ExternalLink,
  User,
  MessageSquare,
  Tag,
  FileText,
  Gavel,
  Clock,
  RefreshCw,
  Loader2,
  Calendar,
  Scale
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRef, useState, useCallback, useEffect } from "react";
import { YouTubePlayerSync, YouTubePlayerRef } from "@/components/audiencias/YouTubePlayerSync";
import { TranscricaoInterativa } from "@/components/audiencias/TranscricaoInterativa";
import { MarcadorManager } from "@/components/audiencias/MarcadorManager";

interface Participante {
  nome: string;
  cargo: string;
  tempo_estimado_fala?: string;
}

interface PontoDiscutido {
  tema: string;
  resumo: string;
}

interface Voto {
  ministro: string;
  voto: string;
  argumento?: string;
}

interface Segmento {
  texto: string;
  inicio_segundos: number;
  fim_segundos: number;
}

export default function AudienciaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerRef = useRef<YouTubePlayerRef>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  // Verificar se há timestamp na URL para ir direto
  useEffect(() => {
    const timestamp = searchParams.get('t');
    if (timestamp && playerReady) {
      const seconds = parseInt(timestamp, 10);
      if (!isNaN(seconds)) {
        playerRef.current?.seekTo(seconds);
        playerRef.current?.play();
      }
    }
  }, [searchParams, playerReady]);

  const { data: video, isLoading, refetch } = useQuery({
    queryKey: ['audiencia-video', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audiencias_videos')
        .select(`
          *,
          canais_audiencias(id, tribunal, nome),
          audiencias_analises(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Buscar transcrição separadamente
  const { data: transcricao } = useQuery({
    queryKey: ['audiencia-transcricao', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audiencias_transcricoes')
        .select('*')
        .eq('video_id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!id
  });

  const analise = video?.audiencias_analises?.[0];
  const segmentos: Segmento[] = (transcricao?.segmentos as unknown as Segmento[]) || [];

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    playerRef.current?.play();
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true);
  }, []);

  const reAnalisar = async () => {
    if (!id) return;
    
    try {
      toast.loading("Re-analisando vídeo com transcrição...", { id: 'reanalise' });
      
      const { error } = await supabase.functions.invoke('analisar-audiencia-video', {
        body: { videoDbId: id, forcarReanalise: true, gerarTranscricao: true }
      });

      if (error) throw error;

      toast.success("Análise e transcrição atualizadas!", { id: 'reanalise' });
      refetch();
    } catch (error) {
      console.error('Erro ao re-analisar:', error);
      toast.error("Erro ao re-analisar", { id: 'reanalise' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Vídeo não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/ferramentas/audiencias')}>
          Voltar
        </Button>
      </div>
    );
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${video.video_id}`;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <ScrollArea className="flex-1">
        <div className="px-3 md:px-6 py-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/ferramentas/audiencias')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground line-clamp-2">
                {video.titulo}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{video.canais_audiencias?.tribunal}</Badge>
                {video.publicado_em && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(video.publicado_em), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Player do YouTube com sincronização */}
          <YouTubePlayerSync
            ref={playerRef}
            videoId={video.video_id}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onReady={handlePlayerReady}
          />

          {/* Marcadores do usuário */}
          <MarcadorManager
            videoId={id!}
            currentTime={currentTime}
            onSeek={handleSeek}
          />

          {/* Transcrição Interativa */}
          {segmentos.length > 0 && (
            <TranscricaoInterativa
              segmentos={segmentos}
              currentTime={currentTime}
              onSeek={handleSeek}
              isPlaying={isPlaying}
            />
          )}

          {/* Ações */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" asChild>
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no YouTube
              </a>
            </Button>
            <Button variant="outline" onClick={reAnalisar}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-analisar
            </Button>
          </div>

          {/* Análise */}
          {analise ? (
            <div className="space-y-6">
              {/* Tipo de sessão */}
              {analise.tipo_sessao && (
                <Badge variant="outline" className="text-sm">
                  <Scale className="w-3 h-3 mr-1" />
                  {analise.tipo_sessao}
                </Badge>
              )}

              {/* Resumo */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Resumo da Sessão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {analise.resumo || "Resumo não disponível"}
                  </p>
                </CardContent>
              </Card>

              {/* Temas principais */}
              {analise.temas_principais && (analise.temas_principais as string[]).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Temas Discutidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(analise.temas_principais as string[]).map((tema, i) => (
                        <Badge key={i} variant="secondary">
                          {tema}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Participantes */}
              {analise.participantes && Array.isArray(analise.participantes) && (analise.participantes as unknown as Participante[]).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Participantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(analise.participantes as unknown as Participante[]).map((p, i) => (
                      <div key={i} className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.cargo}</p>
                        </div>
                        {p.tempo_estimado_fala && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {p.tempo_estimado_fala}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Pontos discutidos */}
              {analise.pontos_discutidos && Array.isArray(analise.pontos_discutidos) && (analise.pontos_discutidos as unknown as PontoDiscutido[]).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gavel className="w-4 h-4" />
                      Pontos Discutidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(analise.pontos_discutidos as unknown as PontoDiscutido[]).map((ponto, i) => (
                      <div key={i}>
                        <p className="font-medium text-sm">{ponto.tema}</p>
                        <p className="text-xs text-muted-foreground mt-1">{ponto.resumo}</p>
                        {i < (analise.pontos_discutidos as unknown as PontoDiscutido[]).length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Votos */}
              {analise.votos && Array.isArray(analise.votos) && (analise.votos as unknown as Voto[]).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      Votos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(analise.votos as unknown as Voto[]).map((voto, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Badge 
                          variant={voto.voto === 'Favorável' ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {voto.voto}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{voto.ministro}</p>
                          {voto.argumento && (
                            <p className="text-xs text-muted-foreground mt-1">{voto.argumento}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Decisão Final */}
              {analise.decisao_final && (
                <Card className="border-primary/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-primary">
                      <Gavel className="w-4 h-4" />
                      Decisão Final
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analise.decisao_final}</p>
                  </CardContent>
                </Card>
              )}

              {/* Termos-chave */}
              {analise.termos_chave && (analise.termos_chave as string[]).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Termos-Chave
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(analise.termos_chave as string[]).map((termo, i) => (
                        <Badge key={i} variant="outline">
                          {termo}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Nota sobre transcrição */}
              {segmentos.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-4 text-center">
                    <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Transcrição interativa não disponível para este vídeo.
                    </p>
                    <Button variant="link" size="sm" onClick={reAnalisar}>
                      Gerar transcrição
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Este vídeo ainda não foi analisado
                </p>
                <Button onClick={reAnalisar}>
                  Analisar com IA
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
