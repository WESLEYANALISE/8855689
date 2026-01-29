import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Play, Star, Calendar, Clock, TrendingUp, Users, Film, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";
import { JuriFlixCard } from "@/components/JuriFlixCard";
import { formatJuriFlixForWhatsApp } from "@/lib/formatWhatsApp";
import { toast } from "sonner";
import { useEffect } from "react";

const JuriFlixDetalhesEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: titulo, isLoading, refetch } = useQuery({
    queryKey: ["juriflix-detalhe-enhanced", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as JuriFlixTituloEnriquecido;
    },
  });

  // Sincronizar disponibilidade de streaming
  const syncStreamingMutation = useMutation({
    mutationFn: async (tituloData: JuriFlixTituloEnriquecido) => {
      if (!tituloData.tmdb_id) return null;
      
      const { data, error } = await supabase.functions.invoke('sync-disponibilidade-streaming', {
        body: {
          juriflix_id: tituloData.id,
          tmdb_id: tituloData.tmdb_id,
          tipo_tmdb: tituloData.tipo_tmdb
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Sincronizar ao carregar a página (se tiver tmdb_id e não tiver onde_assistir)
  useEffect(() => {
    if (titulo && titulo.tmdb_id && !titulo.onde_assistir?.flatrate) {
      syncStreamingMutation.mutate(titulo);
    }
  }, [titulo?.id]);

  const handleCompartilharWhatsApp = () => {
    if (!titulo) return;
    
    const mensagem = formatJuriFlixForWhatsApp({
      nome: titulo.nome,
      sinopse: titulo.sinopse,
      beneficios: titulo.beneficios,
      plataforma: titulo.plataforma,
      link: titulo.link,
      ano: titulo.ano,
      tipo: titulo.tipo,
      nota: titulo.nota,
      onde_assistir: titulo.onde_assistir
    });
    
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    
    toast.success('Abrindo WhatsApp para compartilhar!');
  };

  const { data: similares } = useQuery({
    queryKey: ["juriflix-similares", titulo?.similares],
    queryFn: async () => {
      if (!titulo?.similares || (titulo.similares as any[]).length === 0) return [];
      
      const tmdbIds = (titulo.similares as any[]).map((s: any) => s.tmdb_id).filter(Boolean);
      if (tmdbIds.length === 0) return [];

      const { data } = await supabase
        .from("JURIFLIX" as any)
        .select("*")
        .in("tmdb_id", tmdbIds)
        .limit(6);

      return data as unknown as JuriFlixTituloEnriquecido[] || [];
    },
    enabled: !!titulo?.similares,
  });

  if (isLoading) {
    return (
      <div className="pb-20">
        <Skeleton className="h-[400px] w-full" />
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!titulo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-muted-foreground mb-4">Título não encontrado</p>
        <Button onClick={() => navigate("/juriflix")}>Voltar para JuriFlix</Button>
      </div>
    );
  }

  const backdropUrl = titulo.backdrop_path || titulo.capa;
  const posterUrl = titulo.poster_path || titulo.capa;
  const hasEnrichedData = !!titulo.tmdb_id;
  const trailers = titulo.videos as any[] || [];
  const mainTrailer = trailers.find((v: any) => v.tipo === 'Trailer') || trailers[0] || { url: titulo.trailer };
  const elenco = titulo.elenco as any[] || [];
  const generos = titulo.generos as string[] || [];
  const ondeAssistir = titulo.onde_assistir as any || {};

  return (
    <div className="pb-20">
      {/* Hero Banner */}
      <div className="relative">
        <div
          className="h-[300px] md:h-[500px] bg-cover bg-center"
          style={{
            backgroundImage: `url(${backdropUrl})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 -mt-32 md:-mt-40">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Poster */}
            <div className="w-48 md:w-64 h-72 md:h-96 rounded-lg overflow-hidden shrink-0 bg-secondary shadow-2xl">
              <img
                src={posterUrl}
                alt={titulo.nome}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info Principal */}
            <div className="flex-1 space-y-4">
              <div>
                <Badge className="mb-2">{titulo.tipo}</Badge>
                {hasEnrichedData && titulo.titulo_original && (
                  <p className="text-sm text-muted-foreground mb-1">{titulo.titulo_original}</p>
                )}
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{titulo.nome}</h1>
                
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {titulo.ano && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{titulo.ano}</span>
                    </div>
                  )}
                  {titulo.duracao && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{titulo.duracao} min</span>
                    </div>
                  )}
                  {(titulo.nota || titulo.popularidade) && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{titulo.nota || (titulo.popularidade ? (titulo.popularidade / 10).toFixed(1) : 'N/A')}</span>
                      {hasEnrichedData && titulo.votos_count && (
                        <span className="text-muted-foreground">({titulo.votos_count} votos)</span>
                      )}
                    </div>
                  )}
                  {hasEnrichedData && titulo.popularidade && titulo.popularidade > 50 && (
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Popular
                    </Badge>
                  )}
                </div>

                {/* Gêneros */}
                {generos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {generos.map((genero, i) => (
                      <Badge key={i} variant="outline">{genero}</Badge>
                    ))}
                  </div>
                )}

                {/* Tagline */}
                {titulo.tagline && (
                  <p className="text-lg italic text-muted-foreground mt-3">"{titulo.tagline}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {mainTrailer?.url && (
                  <Button asChild>
                    <a href={mainTrailer.url.replace('/embed/', '/watch?v=')} target="_blank" rel="noopener noreferrer">
                      <Play className="w-4 h-4 mr-2" />
                      Ver Trailer
                    </a>
                  </Button>
                )}
                {titulo.link && (
                  <Button variant="outline" asChild>
                    <a href={titulo.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {titulo.plataforma || "Assistir"}
                    </a>
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  onClick={handleCompartilharWhatsApp}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar no WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Sinopse */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-3">Sinopse</h2>
          <p className="text-muted-foreground leading-relaxed">{titulo.sinopse}</p>
        </Card>

        {/* Diretor e Elenco */}
        {(titulo.diretor || elenco.length > 0) && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Elenco e Equipe
            </h2>
            
            {titulo.diretor && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Direção</p>
                <p className="font-semibold">{titulo.diretor}</p>
              </div>
            )}

            {elenco.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Elenco Principal</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {elenco.map((actor: any, i: number) => (
                    <div key={i} className="text-center">
                      {actor.foto ? (
                        <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-secondary">
                          <img src={actor.foto} alt={actor.nome} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm font-medium line-clamp-1">{actor.nome}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{actor.personagem}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Benefícios Acadêmicos */}
        {titulo.beneficios && (
          <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <h2 className="text-xl font-bold mb-3 text-accent">
              Por que assistir? 🎓
            </h2>
            <p className="leading-relaxed">{titulo.beneficios}</p>
          </Card>
        )}

        {/* Onde Assistir */}
        {(ondeAssistir.flatrate?.length > 0 || ondeAssistir.rent?.length > 0 || ondeAssistir.buy?.length > 0) && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Onde Assistir no Brasil</h2>
            
            {ondeAssistir.flatrate?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Streaming</p>
                <div className="flex flex-wrap gap-3">
                  {ondeAssistir.flatrate.map((provider: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-secondary rounded-lg p-2">
                      {provider.logo_path && (
                        <img src={provider.logo_path} alt={provider.provider_name} className="w-8 h-8 rounded" />
                      )}
                      <span className="text-sm font-medium">{provider.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(ondeAssistir.rent?.length > 0 || ondeAssistir.buy?.length > 0) && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Aluguel / Compra</p>
                <div className="flex flex-wrap gap-3">
                  {[...(ondeAssistir.rent || []), ...(ondeAssistir.buy || [])].map((provider: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-secondary rounded-lg p-2">
                      {provider.logo_path && (
                        <img src={provider.logo_path} alt={provider.provider_name} className="w-8 h-8 rounded" />
                      )}
                      <span className="text-sm font-medium">{provider.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Trailer */}
        {mainTrailer?.url && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Trailer</h2>
            <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
              <iframe
                width="100%"
                height="100%"
                src={mainTrailer.url}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        )}

        {/* Títulos Similares */}
        {similares && similares.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Film className="w-5 h-5" />
              Você também pode gostar
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
              {similares.map((similar) => (
                <JuriFlixCard
                  key={similar.id}
                  titulo={similar}
                  onClick={() => navigate(`/juriflix/${similar.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JuriFlixDetalhesEnhanced;