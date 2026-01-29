import { memo } from 'react';
import { useRankingPreview } from '@/hooks/useRankingCache';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, FileText, Calendar, Users, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RankingTipo = 'despesas' | 'proposicoes' | 'presenca' | 'comissoes';

interface RankingPreviewProps {
  tipo: RankingTipo;
  onClick?: () => void;
}

const CONFIG = {
  despesas: {
    titulo: 'Maiores Gastadores',
    icon: DollarSign,
    formatValue: (v: number) => `R$ ${(v / 1000).toFixed(0)}k`,
  },
  proposicoes: {
    titulo: 'Mais Proposições',
    icon: FileText,
    formatValue: (v: number) => `${v}`,
  },
  presenca: {
    titulo: 'Mais Presentes',
    icon: Calendar,
    formatValue: (v: number) => `${v}`,
  },
  comissoes: {
    titulo: 'Mais Comissões',
    icon: Users,
    formatValue: (v: number) => `${v}`,
  },
};

const MEDALS = ['🥇', '🥈', '🥉'];

export const RankingPreview = memo(({ tipo, onClick }: RankingPreviewProps) => {
  const { top3, isLoading, ultimaAtualizacao } = useRankingPreview(tipo);
  const config = CONFIG[tipo];
  const Icon = config.icon;
  
  // Amarelo para ícones, vermelho vibrante para valores

  if (isLoading) {
    return (
      <Card className="p-3 bg-card border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-6 h-6 rounded-md" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-1.5">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-7 w-full rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-3 bg-card border-border/50 hover:border-red-500/30 transition-all cursor-pointer group active:scale-[0.98]"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/20">
            <Icon className="w-4 h-4 text-red-400" />
          </div>
          <span className="font-semibold text-xs">{config.titulo}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
      </div>

      {/* Lista Top 3 */}
      <div className="space-y-2">
        {top3.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Sem dados disponíveis
          </p>
        ) : (
          top3.map((item, index) => (
            <div 
              key={item.id} 
              className="flex items-center gap-2 p-1.5 rounded-lg bg-secondary/30"
            >
              <span className="text-sm w-5 flex-shrink-0">{MEDALS[index]}</span>
              <img 
                src={item.foto_url || '/placeholder.svg'} 
                alt={item.nome}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border/50"
                loading="lazy"
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-medium truncate">
                  {item.nome.split(' ').slice(0, 2).join(' ')}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {item.partido}-{item.uf}
                </p>
              </div>
              <span className="text-xs font-bold text-red-400 flex-shrink-0 tabular-nums">
                {config.formatValue(item.valor)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer minimalista */}
      {ultimaAtualizacao && (
        <p className="text-[9px] text-muted-foreground mt-2 text-right">
          {formatDistanceToNow(new Date(ultimaAtualizacao), { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </p>
      )}
    </Card>
  );
});

RankingPreview.displayName = 'RankingPreview';
