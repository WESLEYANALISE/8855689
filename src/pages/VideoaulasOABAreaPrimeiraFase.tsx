import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Video, ArrowLeft, Loader2, Layers, Play, Search, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMultipleVideoProgress } from "@/hooks/useVideoProgress";
import { Progress } from "@/components/ui/progress";
interface VideoaulaOAB {
  id: number;
  video_id: string;
  titulo: string;
  thumbnail: string | null;
  ordem: number;
  sobre_aula: string | null;
}

// Extrai apenas o título limpo da aula (remove prefixos como "Direito X | OAB - ")
const extractCleanTitle = (fullTitle: string): string => {
  // Padrão: "Direito Administrativo | OAB - Atos Administrativos I | CURSO GRATUITO"
  // Queremos: "Atos Administrativos I"
  
  // Remove "| CURSO GRATUITO" no final se existir
  let title = fullTitle.replace(/\s*\|\s*CURSO GRATUITO\s*$/i, '');
  
  // Se tem formato "X | OAB - Y", pega só o Y
  const oabMatch = title.match(/\|\s*OAB\s*-\s*(.+)$/i);
  if (oabMatch) {
    return oabMatch[1].trim();
  }
  
  // Se tem formato "X - Y", pode ser "OAB - Título", pega só depois do último hífen
  const lastDashMatch = title.match(/^[^-]+-\s*(.+)$/);
  if (lastDashMatch && !title.includes('|')) {
    return lastDashMatch[1].trim();
  }
  
  return title.trim();
};

// Função para simplificar nome da área (remove "Direito" do início)
const simplifyAreaName = (areaName: string): string => {
  const prefixesToRemove = ['Direito ', 'Legislação '];
  for (const prefix of prefixesToRemove) {
    if (areaName.startsWith(prefix)) {
      return areaName.replace(prefix, '');
    }
  }
  return areaName;
};

const VideoaulasOABAreaPrimeiraFase = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const decodedArea = decodeURIComponent(area || "");
  const [search, setSearch] = useState("");

  const { data: videoaulas, isLoading } = useQuery({
    queryKey: ["videoaulas-oab-1fase-area", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_oab_primeira_fase")
        .select("id, video_id, titulo, thumbnail, ordem, sobre_aula")
        .eq("area", decodedArea)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as VideoaulaOAB[];
    },
    enabled: !!decodedArea,
  });

  // Buscar progresso de todos os vídeos
  const registroIds = useMemo(() => videoaulas?.map(v => String(v.id)) || [], [videoaulas]);
  const { progressMap } = useMultipleVideoProgress("videoaulas_oab_primeira_fase", registroIds);

  const filteredVideos = useMemo(() => {
    if (!videoaulas) return [];
    if (!search.trim()) return videoaulas;
    return videoaulas.filter(v =>
      v.titulo.toLowerCase().includes(search.toLowerCase())
    );
  }, [videoaulas, search]);

  const totalVideos = videoaulas?.length || 0;
  const comConteudo = videoaulas?.filter(v => v.sobre_aula).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-500/5">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <button 
            onClick={() => navigate('/videoaulas-oab-1fase')}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
      </div>
      
      {/* Header da Área */}
      <div className="pt-4 pb-4 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-500/60 flex items-center justify-center shadow-lg flex-shrink-0">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                  OAB 1ª FASE
                </span>
                <h1 className="text-lg font-bold mt-1">{simplifyAreaName(decodedArea)}</h1>
              </div>
            </div>
            
            {/* Barra de progresso */}
            {totalVideos > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Videoaulas</span>
                  </div>
                  <span className="text-sm font-medium">{totalVideos} aulas</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(comConteudo / totalVideos) * 100}%` }} 
                    transition={{ duration: 0.5 }} 
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                  />
                </div>
                {comConteudo > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {comConteudo} aula(s) com conteúdo gerado por IA
                  </p>
                )}
              </div>
            )}
            
            {/* Barra de pesquisa */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar aula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lista de Vídeos */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Lista de Aulas
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVideos.map((video, index) => (
                <VideoListItem
                  key={video.id}
                  video={video}
                  index={index}
                  area={decodedArea}
                  originalIndex={videoaulas?.findIndex(v => v.id === video.id) ?? index}
                  progress={progressMap[String(video.id)]}
                />
              ))}
            </div>
          )}
          
          {!isLoading && filteredVideos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{search ? "Nenhuma aula encontrada" : "Nenhuma videoaula disponível"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de item da lista
const VideoListItem = ({ 
  video, 
  index, 
  area,
  originalIndex,
  progress
}: { 
  video: VideoaulaOAB; 
  index: number; 
  area: string;
  originalIndex: number;
  progress?: { percentual: number; assistido: boolean };
}) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const temConteudo = !!video.sobre_aula;
  const percentual = progress?.percentual || 0;
  const assistido = progress?.assistido || false;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => navigate(`/videoaulas/oab-1fase/${encodeURIComponent(area)}/${video.id}`)}
      className="w-full text-left border rounded-xl transition-all overflow-hidden bg-neutral-800/90 hover:bg-neutral-700/90 border-neutral-700/50 hover:border-red-500/30"
    >
      <div className="flex items-center">
        {/* Thumbnail */}
        <div className="relative w-24 h-16 flex-shrink-0 bg-neutral-800 rounded-l-xl overflow-hidden">
          {video.thumbnail ? (
            <>
              <div className={cn(
                "absolute inset-0 bg-neutral-700 animate-pulse transition-opacity",
                imageLoaded ? "opacity-0" : "opacity-100"
              )} />
              <img 
                src={video.thumbnail} 
                alt={video.titulo}
                className={cn(
                  "w-full h-full object-cover transition-opacity",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-800">
              <Video className="w-6 h-6 text-neutral-500" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-600/80 flex items-center justify-center">
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
          
          {/* Número */}
          <div className="absolute bottom-0 left-0 bg-red-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-tr-lg">
            {String(originalIndex + 1).padStart(2, '0')}
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 min-w-0 px-3 py-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium leading-snug text-neutral-100">
                {extractCleanTitle(video.titulo)}
              </h3>
              {/* Barra de progresso mini */}
              {percentual > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        assistido ? "bg-green-500" : "bg-red-500"
                      )}
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    assistido ? "text-green-400" : "text-red-400"
                  )}>
                    {percentual}%
                  </span>
                </div>
              )}
            </div>
            {assistido ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : temConteudo && percentual === 0 ? (
              <div className="flex items-center gap-1 text-xs text-green-400 flex-shrink-0">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            ) : null}
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0 mr-3" />
      </div>
    </motion.button>
  );
};

export default VideoaulasOABAreaPrimeiraFase;
