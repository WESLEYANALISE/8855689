import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Eye, Flame, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface RankedArticle {
  id: number;
  "Número do Artigo": string;
  Artigo: string;
  visualizacoes: number;
  ultima_visualizacao: string | null;
}

interface VadeMecumRankingProps {
  tableName: string;
  codigoNome: string;
  onArticleClick: (numeroArtigo: string) => void;
}

export const VadeMecumRanking = ({ tableName, codigoNome, onArticleClick }: VadeMecumRankingProps) => {
  const { data: rankedArticles = [], isLoading } = useQuery({
    queryKey: ['ranking-artigos', tableName],
    queryFn: async () => {
      try {
        // OTIMIZAÇÃO: Buscar visualizações agregadas diretamente no servidor
        const { data: visualizacoes, error: visError } = await supabase
          .from('artigos_visualizacoes')
          .select('numero_artigo, visualizado_em')
          .eq('tabela_codigo', tableName);

        if (visError) throw visError;
        if (!visualizacoes || visualizacoes.length === 0) return [];

        // Agrupar e contar visualizações por artigo
        const contagem = visualizacoes.reduce((acc, vis) => {
          const num = vis.numero_artigo;
          if (!acc[num]) {
            acc[num] = { count: 0, ultimaVis: vis.visualizado_em };
          }
          acc[num].count++;
          if (new Date(vis.visualizado_em) > new Date(acc[num].ultimaVis)) {
            acc[num].ultimaVis = vis.visualizado_em;
          }
          return acc;
        }, {} as Record<string, { count: number; ultimaVis: string }>);

        // Ordenar por número de visualizações - LIMITAR A 20 para performance
        const artigosOrdenados = Object.entries(contagem)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 20)
          .map(([numero, data]) => ({ numero, ...data }));

        if (artigosOrdenados.length === 0) return [];

        // OTIMIZAÇÃO: Buscar dados completos dos artigos em uma única query
        const numerosArtigos = artigosOrdenados.map(a => a.numero);
        const { data: artigos, error: artError } = await supabase
          .from(tableName as any)
          .select('id, "Número do Artigo", Artigo')
          .in('Número do Artigo', numerosArtigos);

        if (artError) throw artError;
        if (!artigos) return [];

        // Combinar dados com Map para O(1) lookup
        const artigosMap = new Map((artigos as any[]).map(a => [a["Número do Artigo"], a]));
        
        const resultado = artigosOrdenados
          .map(item => {
            const artigo = artigosMap.get(item.numero);
            if (!artigo) return null;
            return {
              id: artigo.id,
              "Número do Artigo": artigo["Número do Artigo"],
              Artigo: artigo.Artigo,
              visualizacoes: item.count,
              ultima_visualizacao: item.ultimaVis
            };
          })
          .filter((item): item is RankedArticle => item !== null);

        return resultado;
      } catch (error) {
        console.error('Erro na query de ranking:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // OTIMIZADO: 10 minutos de cache
    refetchOnWindowFocus: false, // Evita re-fetch desnecessário
  });

  const getMedalIcon = (position: number) => {
    if (position === 1) return <span className="text-lg">🥇</span>;
    if (position === 2) return <span className="text-lg">🥈</span>;
    if (position === 3) return <span className="text-lg">🥉</span>;
    return null;
  };

  const isHot = (article: RankedArticle) => {
    if (!article.ultima_visualizacao) return false;
    const lastView = new Date(article.ultima_visualizacao);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return lastView > twoDaysAgo;
  };

  const getPreviewText = (content: string) => {
    const cleanText = content.replace(/\n/g, ' ').trim();
    return cleanText.length > 120 ? cleanText.substring(0, 120) + '...' : cleanText;
  };

  if (isLoading) {
    return (
      <div className="space-y-2 pb-20">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-l-4" style={{ borderLeftColor: "hsl(38, 92%, 50%)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (rankedArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Trophy className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Nenhuma visualização registrada
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Os artigos mais vistos aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-20">
      {rankedArticles.map((article, index) => {
        const position = index + 1;
        const preview = getPreviewText(article.Artigo);
        const hot = isHot(article);

        return (
          <Card
            key={article.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4"
            style={{
              borderLeftColor: "hsl(38, 92%, 50%)",
            }}
            onClick={() => onArticleClick(article["Número do Artigo"])}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {getMedalIcon(position) || (
                    <span className="text-sm font-bold text-muted-foreground">{position}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">
                    Art. {article["Número do Artigo"]}
                  </h3>
                  {hot && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-3 h-3" />
                      <span className="text-xs">Em alta</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {preview}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">{article.visualizacoes}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};