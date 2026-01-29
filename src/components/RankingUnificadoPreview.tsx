import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star, ChevronRight, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RankingItem {
  id: string;
  politico_id: number;
  tipo: 'deputado' | 'senador';
  nome: string;
  partido: string | null;
  uf: string | null;
  foto_url: string | null;
  nota_final: number;
  posicao: number;
  updated_at: string;
}

interface RankingUnificadoPreviewProps {
  onClick?: () => void;
  tipo?: 'todos' | 'deputado' | 'senador';
}

const MEDALS = ['🥇', '🥈', '🥉'];

export const RankingUnificadoPreview = memo(({ onClick, tipo = 'todos' }: RankingUnificadoPreviewProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['ranking-unificado-preview', tipo],
    queryFn: async () => {
      let query = supabase
        .from('ranking_nota_final')
        .select('*')
        .order('nota_final', { ascending: false })
        .limit(5);
      
      if (tipo !== 'todos') {
        query = query.eq('tipo', tipo);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RankingItem[];
    },
    staleTime: 1000 * 60 * 5 // 5 minutos
  });

  const getNotaColor = (nota: number) => {
    if (nota >= 8) return "text-green-500";
    if (nota >= 6) return "text-yellow-500";
    if (nota >= 4) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:border-primary/50 transition-all group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Ranking Unificado</h3>
            <p className="text-[10px] text-muted-foreground">
              Top 5 parlamentares
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Ranking ainda não calculado
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 5).map((item, idx) => (
            <div 
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-lg w-6 text-center">
                {idx < 3 ? MEDALS[idx] : `${idx + 1}º`}
              </span>
              
              {item.foto_url ? (
                <img
                  src={item.foto_url}
                  alt={item.nome}
                  className="w-8 h-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.nome}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.partido} • {item.uf}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Star className={`w-3 h-3 ${getNotaColor(item.nota_final)}`} />
                <span className={`text-sm font-bold ${getNotaColor(item.nota_final)}`}>
                  {item.nota_final.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Atualizado {formatDistanceToNow(new Date(data[0].updated_at), {
            addSuffix: true,
            locale: ptBR
          })}
        </p>
      )}
    </Card>
  );
});

RankingUnificadoPreview.displayName = 'RankingUnificadoPreview';
