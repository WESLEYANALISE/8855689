import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import { Play, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Video {
  id: string;
  video_id: string;
  titulo: string;
  thumbnail: string | null;
  publicado_em: string | null;
  canais_audiencias: {
    tribunal: string;
  } | null;
}

// Tribunais permitidos (excluindo TV Justiça)
const TRIBUNAIS_PERMITIDOS = ['CNJ', 'STF', 'STJ', 'TSE', 'TST'];

// Função para verificar se é uma sessão de julgamento
const isSessao = (titulo: string): boolean => {
  const tituloLower = titulo.toLowerCase();
  return (
    tituloLower.includes('sessão') ||
    tituloLower.includes('sessao') ||
    tituloLower.includes('plenária') ||
    tituloLower.includes('plenario') ||
    tituloLower.includes('julgamento') ||
    tituloLower.includes('turma') ||
    tituloLower.includes('corte especial') ||
    tituloLower.includes('órgão especial') ||
    tituloLower.includes('orgao especial') ||
    tituloLower.includes('sdi-')
  );
};

export function UltimasAudienciasCarousel() {
  const navigate = useNavigate();
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ['ultimas-sessoes-carousel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audiencias_videos')
        .select(`
          id,
          video_id,
          titulo,
          thumbnail,
          publicado_em,
          canais_audiencias!inner(tribunal)
        `)
        .in('canais_audiencias.tribunal', TRIBUNAIS_PERMITIDOS)
        .order('publicado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Filtrar apenas sessões de julgamento
      const sessoes = (data as Video[]).filter(v => isSessao(v.titulo));
      return sessoes.slice(0, 12);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Últimas Sessões</h2>
      </div>

      <div className="overflow-hidden -mx-3 px-3" ref={emblaRef}>
        <div className="flex gap-2.5">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex-shrink-0 w-[200px] sm:w-[220px] cursor-pointer group"
              onClick={() => navigate(`/ferramentas/audiencias/${video.id}`)}
            >
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Play className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Overlay com play */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground fill-current" />
                  </div>
                </div>

                {/* Badge do tribunal */}
                {video.canais_audiencias?.tribunal && (
                  <Badge 
                    className="absolute top-1.5 left-1.5 bg-black/70 text-white border-none text-[10px] px-1.5 py-0.5"
                  >
                    {video.canais_audiencias.tribunal}
                  </Badge>
                )}
              </div>

              <div className="mt-1.5 space-y-0.5">
                <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {video.titulo}
                </h3>
                {video.publicado_em && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {format(new Date(video.publicado_em), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
