import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { JuriFlixTituloEnriquecido } from "@/types/juriflix.types";

const JuriFlixEnriquecer = () => {
  const [enriching, setEnriching] = useState<Record<number, boolean>>({});

  const { data: titulos, isLoading, refetch } = useQuery({
    queryKey: ["juriflix-enriquecer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JURIFLIX" as any)
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      return data as unknown as JuriFlixTituloEnriquecido[];
    },
  });

  const enrichTitulo = async (id: number, force = false) => {
    setEnriching(prev => ({ ...prev, [id]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('enriquecer-juriflix', {
        body: { juriflix_id: id, force }
      });

      if (error) throw error;

      toast.success(data.message || 'Título enriquecido com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao enriquecer:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enriquecer título');
    } finally {
      setEnriching(prev => ({ ...prev, [id]: false }));
    }
  };

  const enrichAll = async () => {
    if (!titulos) return;

    toast.info(`Enriquecendo ${titulos.length} títulos...`);

    for (const titulo of titulos) {
      if (!titulo.tmdb_id) {
        await enrichTitulo(titulo.id);
        // Delay para não exceder rate limits do TMDB
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    toast.success('Todos os títulos foram enriquecidos!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  const titulosEnriquecidos = titulos?.filter(t => t.tmdb_id) || [];
  const titulosPendentes = titulos?.filter(t => !t.tmdb_id) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Enriquecer JuriFlix com TMDB</h1>
        <p className="text-muted-foreground">
          Adicione dados do The Movie Database aos títulos do catálogo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{titulosEnriquecidos.length}</div>
              <div className="text-sm text-muted-foreground">Enriquecidos</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{titulosPendentes.length}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{titulos?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      {titulosPendentes.length > 0 && (
        <div className="mb-6">
          <Button 
            onClick={enrichAll}
            disabled={Object.values(enriching).some(v => v)}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Enriquecer Todos Pendentes ({titulosPendentes.length})
          </Button>
        </div>
      )}

      {/* Lista de Títulos */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Títulos</h2>
        
        {titulos?.map((titulo) => {
          const isEnriquecido = !!titulo.tmdb_id;
          const isEnriching = enriching[titulo.id];

          return (
            <Card key={titulo.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Poster */}
                <div className="w-16 h-24 rounded bg-secondary shrink-0 overflow-hidden">
                  {(titulo.poster_path || titulo.capa) ? (
                    <img 
                      src={titulo.poster_path || titulo.capa} 
                      alt={titulo.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{titulo.nome}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{titulo.ano}</span>
                        <span>•</span>
                        <span>{titulo.tipo}</span>
                        {titulo.duracao && (
                          <>
                            <span>•</span>
                            <span>{titulo.duracao} min</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Badge variant={isEnriquecido ? "default" : "outline"}>
                      {isEnriquecido ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Enriquecido</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> Pendente</>
                      )}
                    </Badge>
                  </div>

                  {isEnriquecido && titulo.generos && titulo.generos.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(titulo.generos as string[]).map((genero, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {genero}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isEnriquecido ? "outline" : "default"}
                      onClick={() => enrichTitulo(titulo.id, isEnriquecido)}
                      disabled={isEnriching}
                      className="gap-2"
                    >
                      {isEnriching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enriquecendo...
                        </>
                      ) : isEnriquecido ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Atualizar
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Enriquecer
                        </>
                      )}
                    </Button>

                    {isEnriquecido && titulo.tmdb_id && (
                      <a
                        href={`https://www.themoviedb.org/${titulo.tipo_tmdb}/${titulo.tmdb_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Ver no TMDB →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default JuriFlixEnriquecer;