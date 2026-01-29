import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clapperboard, ArrowRight, Clock, Play } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getFromInstantCache, preloadImages, isImagePreloaded } from "@/hooks/useInstantCache";

interface Documentario {
  id: string;
  video_id: string;
  titulo: string;
  thumbnail: string | null;
  capa_webp: string | null;
  duracao: string | null;
  visualizacoes: number | null;
  canal_nome: string | null;
  categoria: string | null;
}

const CACHE_KEY = 'documentarios-juridicos-cache';

// Função para extrair apenas o nome do documentário, removendo prefixos
const cleanDocumentaryTitle = (titulo: string): string => {
  // Remover prefixos comuns como "Audiodescrição | 🎬 Documentário -"
  let cleaned = titulo
    .replace(/^Audiodescrição\s*\|\s*/i, '')
    .replace(/^🎬\s*Documentário\s*[-–]\s*/i, '')
    .replace(/^Documentário\s*[-–]\s*/i, '')
    .replace(/^🎬\s*/i, '')
    .trim();
  
  return cleaned || titulo;
};

// Card individual no mesmo formato do NoticiaCarouselCard
const DocumentarioCard = ({ doc, priority = false }: { doc: Documentario; priority?: boolean }) => {
  const navigate = useNavigate();
  const imageUrl = doc.capa_webp || doc.thumbnail;
  
  // Verificar se imagem já está no cache de imagens para evitar skeleton desnecessário
  const [isLoading, setIsLoading] = useState(() => {
    if (!imageUrl) return false;
    return !isImagePreloaded(imageUrl);
  });

  return (
    <div 
      onClick={() => navigate(`/ferramentas/documentarios-juridicos/${doc.id}`)}
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
          
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={doc.titulo}
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
              <Clapperboard className="w-10 h-10 text-red-400/50" />
            </div>
          )}
          
          {/* Play button no centro - levemente transparente */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-black/70 group-hover:scale-110 transition-all duration-300">
              <Play className="w-6 h-6 text-white/90 ml-0.5" fill="currentColor" />
            </div>
          </div>
          
          {/* Badge de duração no canto inferior direito */}
          {doc.duracao && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white bg-black/80 shadow-md z-10">
              <Clock className="w-2.5 h-2.5" />
              {doc.duracao}
            </span>
          )}
        </div>

        {/* Conteúdo abaixo - altura fixa para consistência */}
        <div className="p-2.5 flex flex-col gap-1.5 flex-1 min-h-[60px]">
          <h3 className="text-xs font-semibold text-card-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors flex-1">
            {cleanDocumentaryTitle(doc.titulo)}
          </h3>
          
          <p className="text-[10px] text-muted-foreground mt-auto">
            Documentário
          </p>
        </div>
      </div>
    </div>
  );
};

export const DocumentariosCarousel = () => {
  const navigate = useNavigate();
  const [documentarios, setDocumentarios] = useState<Documentario[]>([]);

  // Carregar dados do cache instantâneo (pré-carregado no useHomePreloader)
  useEffect(() => {
    const loadData = async () => {
      // Tentar obter do cache primeiro
      const cached = await getFromInstantCache<Documentario[]>(CACHE_KEY);
      
      if (cached?.data && cached.data.length > 0) {
        // Filtrar por categoria 'destaque'
        const destaques = cached.data.filter(d => d.categoria === 'destaque').slice(0, 15);
        setDocumentarios(destaques);
        
        // Pré-carregar imagens dos destaques
        const imageUrls = destaques.map(d => d.capa_webp || d.thumbnail).filter(Boolean) as string[];
        preloadImages(imageUrls);
        return;
      }
      
      // Se não tem cache, buscar do Supabase
      const { data, error } = await supabase
        .from('documentarios_juridicos')
        .select('id, video_id, titulo, thumbnail, capa_webp, duracao, visualizacoes, canal_nome, categoria')
        .eq('categoria', 'destaque')
        .limit(15);
      
      if (!error && data) {
        setDocumentarios(data as Documentario[]);
        
        // Pré-carregar imagens
        const imageUrls = data.map((d: any) => d.capa_webp || d.thumbnail).filter(Boolean);
        preloadImages(imageUrls);
      }
    };
    
    loadData();
  }, []);

  // Ordenação: por visualizações se a maioria tem > 0, senão alfabético
  const documentariosOrdenados = useMemo(() => {
    if (documentarios.length === 0) return [];
    
    const comVisualizacoes = documentarios.filter(d => (d.visualizacoes || 0) > 0);
    const usarPopularidade = comVisualizacoes.length >= documentarios.length / 2;
    
    if (usarPopularidade) {
      return [...documentarios].sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0));
    } else {
      return [...documentarios].sort((a, b) => a.titulo.localeCompare(b.titulo));
    }
  }, [documentarios]);

  if (documentariosOrdenados.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header - igual ao de Notícias Jurídicas */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-xl">
            <Clapperboard className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg md:text-base font-semibold text-foreground">Documentários</h2>
            <p className="text-xs text-muted-foreground">Os mais assistidos</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => navigate('/ferramentas/documentarios-juridicos')} 
          className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-full px-4 text-xs flex items-center gap-1.5 font-medium"
        >
          Ver mais
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
      
      {/* Carrossel */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4 touch-pan-x">
          {documentariosOrdenados.map((doc, index) => (
            <DocumentarioCard 
              key={doc.id} 
              doc={doc} 
              priority={index < 3}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
