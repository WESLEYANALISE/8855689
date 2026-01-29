import { useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, Star, Film, Tv, Video, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { useInstantCache } from "@/hooks/useInstantCache";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Header } from "@/components/Header";
import { useDeviceType } from "@/hooks/use-device-type";

// Card compacto otimizado para mobile
const CompactCard = memo(({ titulo, onClick }: { titulo: JuriFlixTituloEnriquecido; onClick: () => void }) => {
  const imageUrl = titulo.poster_path || titulo.capa;
  
  return (
    <div 
      className="w-32 sm:w-36 shrink-0 cursor-pointer group" 
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card/50 mb-1.5 ring-1 ring-white/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={titulo.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-red-600/30">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Rating badge */}
        {titulo.nota && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            {titulo.nota}
          </div>
        )}
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-8 h-8 text-white fill-white" />
        </div>
      </div>
      
      <h3 className="text-xs font-medium line-clamp-2 leading-tight">{titulo.nome}</h3>
      <span className="text-[10px] text-muted-foreground">{titulo.ano}</span>
    </div>
  );
});

CompactCard.displayName = "CompactCard";

// Hero compacto
const HeroSection = memo(({ destaque, onPlay }: { destaque: JuriFlixTituloEnriquecido; onPlay: () => void }) => (
  <div className="relative h-48 sm:h-56 overflow-hidden rounded-xl mx-3 mb-4">
    <img 
      src={destaque.poster_path || destaque.capa} 
      alt={destaque.nome}
      className="absolute inset-0 w-full h-full object-cover"
      loading="eager"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <Badge variant="secondary" className="mb-1.5 text-[10px] px-2 py-0.5">{destaque.tipo}</Badge>
      <h1 className="text-lg sm:text-xl font-bold mb-1 line-clamp-1">{destaque.nome}</h1>
      <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span>{destaque.nota}</span>
        </div>
        <span>•</span>
        <span>{destaque.ano}</span>
        {destaque.plataforma && (
          <>
            <span>•</span>
            <span>{destaque.plataforma}</span>
          </>
        )}
      </div>
      <Button size="sm" onClick={onPlay} className="h-8 text-xs">
        <Play className="w-3 h-3 mr-1.5" />
        Ver Detalhes
      </Button>
    </div>
  </div>
));

HeroSection.displayName = "HeroSection";

// Seção de carrossel horizontal
const CarouselSection = memo(({ 
  title, 
  icon: Icon, 
  items, 
  onItemClick 
}: { 
  title: string; 
  icon: React.ElementType; 
  items: JuriFlixTituloEnriquecido[]; 
  onItemClick: (id: number) => void;
}) => {
  if (!items.length) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-semibold">{title}</h2>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{items.length}</Badge>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <ScrollArea className="w-full">
        <div className="flex gap-2 px-3 pb-2">
          {items.map((titulo) => (
            <CompactCard 
              key={titulo.id}
              titulo={titulo}
              onClick={() => onItemClick(titulo.id)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
});

CarouselSection.displayName = "CarouselSection";

const JuriFlix = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [activeTab, setActiveTab] = useState("todos");

  // Cache instantâneo
  const { data: titulos, isLoading } = useInstantCache<JuriFlixTituloEnriquecido[]>({
    cacheKey: "juriflix-titulos-v2",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("id, nome, tipo, ano, nota, sinopse, capa, poster_path, plataforma, tmdb_id, popularidade, duracao")
        .order("nota", { ascending: false });

      if (error) throw error;
      return data as unknown as JuriFlixTituloEnriquecido[];
    },
    preloadImages: true,
    imageExtractor: (data) => data.slice(0, 20).map(t => t.poster_path || t.capa).filter(Boolean) as string[],
  });

  // Organizar por categoria
  const { destaque, filmes, series, documentarios, filteredItems } = useMemo(() => {
    if (!titulos) return { destaque: null, filmes: [], series: [], documentarios: [], filteredItems: [] };
    
    const f = titulos.filter((t) => t.tipo?.toLowerCase().includes("filme"));
    const s = titulos.filter((t) => t.tipo?.toLowerCase().includes("série"));
    const d = titulos.filter((t) => t.tipo?.toLowerCase().includes("documentário"));
    
    let filtered = titulos;
    if (activeTab === "filmes") filtered = f;
    else if (activeTab === "series") filtered = s;
    else if (activeTab === "documentarios") filtered = d;
    
    return {
      destaque: titulos[0],
      filmes: f,
      series: s,
      documentarios: d,
      filteredItems: filtered
    };
  }, [titulos, activeTab]);

  const handleItemClick = (id: number) => navigate(`/juriflix/${id}`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950/20 via-background to-background pb-20">
      {!isDesktop && <Header />}
      
      {/* Loading skeleton compacto */}
      {isLoading && !titulos ? (
        <div className="pt-2 space-y-4">
          <div className="h-48 mx-3 rounded-xl bg-card/50 animate-pulse" />
          <div className="px-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-card/50 rounded animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-28 aspect-[2/3] bg-card/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      
      <div className="pt-2 space-y-4">
        {/* Hero */}
        {destaque && (
          <HeroSection destaque={destaque} onPlay={() => handleItemClick(destaque.id)} />
        )}

        {/* Tabs de filtro */}
        <div className="px-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-9 bg-card/50">
              <TabsTrigger value="todos" className="flex-1 text-xs gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Film className="w-3.5 h-3.5" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="filmes" className="flex-1 text-xs gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Film className="w-3.5 h-3.5" />
                Filmes
              </TabsTrigger>
              <TabsTrigger value="series" className="flex-1 text-xs gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Tv className="w-3.5 h-3.5" />
                Séries
              </TabsTrigger>
              <TabsTrigger value="documentarios" className="flex-1 text-xs gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                <Video className="w-3.5 h-3.5" />
                Docs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conteúdo baseado na aba */}
        {activeTab === "todos" ? (
          <div className="space-y-5">
            <CarouselSection 
              title="Filmes" 
              icon={Film} 
              items={filmes} 
              onItemClick={handleItemClick} 
            />
            <CarouselSection 
              title="Séries" 
              icon={Tv} 
              items={series} 
              onItemClick={handleItemClick} 
            />
            <CarouselSection 
              title="Documentários" 
              icon={Video} 
              items={documentarios} 
              onItemClick={handleItemClick} 
            />
          </div>
        ) : (
          <div className="px-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {filteredItems.map((titulo) => (
              <div 
                key={titulo.id} 
                className="cursor-pointer group"
                onClick={() => handleItemClick(titulo.id)}
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card/50 mb-1 ring-1 ring-white/10">
                  {(titulo.poster_path || titulo.capa) ? (
                    <img
                      src={titulo.poster_path || titulo.capa}
                      alt={titulo.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  {titulo.nota && (
                    <div className="absolute top-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[9px] flex items-center gap-0.5">
                      <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                      {titulo.nota}
                    </div>
                  )}
                </div>
                <h3 className="text-[11px] font-medium line-clamp-2 leading-tight">{titulo.nome}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default JuriFlix;