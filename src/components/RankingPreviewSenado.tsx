import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Mic, Users, Vote, FileText, ArrowRight } from 'lucide-react';
import { useRankingPreviewSenado, RankingTipoSenado } from '@/hooks/useRankingCacheSenado';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RankingPreviewSenadoProps {
  tipo: RankingTipoSenado;
  onClick?: () => void;
}

const CONFIG: Record<RankingTipoSenado, {
  title: string;
  icon: typeof DollarSign;
  formatValue: (v: number) => string;
  color: string;
}> = {
  despesas: {
    title: 'Maiores Gastadores',
    icon: DollarSign,
    formatValue: (v) => `R$ ${(v / 1000).toFixed(0)}k`,
    color: 'text-red-400',
  },
  discursos: {
    title: 'Mais Discursos',
    icon: Mic,
    formatValue: (v) => `${v} discursos`,
    color: 'text-pink-400',
  },
  comissoes: {
    title: 'Mais Comissões',
    icon: Users,
    formatValue: (v) => `${v} comissões`,
    color: 'text-amber-400',
  },
  votacoes: {
    title: 'Mais Votações',
    icon: Vote,
    formatValue: (v) => `${v} votos`,
    color: 'text-purple-400',
  },
  materias: {
    title: 'Mais Proposições',
    icon: FileText,
    formatValue: (v) => `${v} matérias`,
    color: 'text-blue-400',
  },
};

const MEDALS = ['🥇', '🥈', '🥉'];

export const RankingPreviewSenado = memo(({ tipo, onClick }: RankingPreviewSenadoProps) => {
  const { top3, isLoading, ultimaAtualizacao } = useRankingPreviewSenado(tipo);
  const config = CONFIG[tipo];
  const Icon = config.icon;

  return (
    <Card 
      className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <h3 className="text-sm font-medium text-foreground">{config.title}</h3>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : top3.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Sem dados disponíveis
        </p>
      ) : (
        <div className="space-y-2">
          {top3.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-sm">{MEDALS[index]}</span>
              <img
                src={item.foto_url || '/placeholder.svg'}
                alt={item.nome}
                className="w-6 h-6 rounded-full object-cover bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {item.nome}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {item.partido}/{item.uf} • {config.formatValue(item.valor)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {ultimaAtualizacao && (
        <p className="text-[10px] text-muted-foreground mt-2 text-right">
          Atualizado {formatDistanceToNow(ultimaAtualizacao, { addSuffix: true, locale: ptBR })}
        </p>
      )}
    </Card>
  );
});

RankingPreviewSenado.displayName = 'RankingPreviewSenado';
