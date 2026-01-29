import { 
  Scale, 
  TrendingUp, 
  TrendingDown,
  FileText, 
  Clock,
  Flame,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KPIData {
  totalProcessos: number;
  processosNovos: number;
  processosBaixados: number;
  processosPendentes: number;
}

interface EmAltaCardsProps {
  kpis: KPIData | null;
  isLoading: boolean;
  periodo: string;
  area?: string;
  tribunal?: string;
  onExplicar: (tipo: string, dados: any) => void;
  modoExplicacao?: boolean;
}

interface CardData {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  iconeBg: string;
  tendencia?: "alta" | "baixa";
  variacao?: number;
  descricao: string;
  explicacao: string;
  key: string;
}

export function EmAltaCards({ 
  kpis, 
  isLoading, 
  periodo, 
  area,
  tribunal,
  onExplicar,
  modoExplicacao = false 
}: EmAltaCardsProps) {
  
  const formatarValor = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString("pt-BR");
  };

  const getDescricaoFiltros = (): string => {
    const partes: string[] = [];
    
    if (periodo && periodo !== 'ano') {
      const periodoLabel = {
        mes: 'último mês',
        trimestre: 'último trimestre',
        semestre: 'último semestre',
        ano: 'último ano'
      }[periodo] || periodo;
      partes.push(periodoLabel);
    }
    
    if (area) {
      const areaLabel = {
        civil: 'Direito Civil',
        consumidor: 'Consumidor',
        trabalhista: 'Trabalhista',
        penal: 'Penal',
        tributario: 'Tributário',
        familia: 'Família',
        previdenciario: 'Previdenciário',
        administrativo: 'Administrativo',
        ambiental: 'Ambiental'
      }[area] || area;
      partes.push(areaLabel);
    }
    
    if (tribunal) {
      partes.push(tribunal);
    }
    
    return partes.length > 0 ? partes.join(' • ') : 'Todos os tribunais';
  };

  const filtrosAtivos = getDescricaoFiltros();

  const getTituloTotal = (): string => {
    if (periodo && periodo !== 'ano') {
      return "Processos no Período";
    }
    return "Total de Processos";
  };

  const cards: CardData[] = [
    {
      key: "totalProcessos",
      titulo: getTituloTotal(),
      valor: kpis?.totalProcessos || 0,
      icone: <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
      iconeBg: "bg-primary/10",
      descricao: area || tribunal || (periodo && periodo !== 'ano') 
        ? `${filtrosAtivos}` 
        : "Processos em tramitação no país",
      explicacao: periodo && periodo !== 'ano' 
        ? "Este número representa os processos novos distribuídos durante o período selecionado, filtrado conforme os critérios aplicados."
        : "O total de processos representa todos os casos atualmente em andamento no sistema judiciário brasileiro. Este número inclui ações em todas as instâncias e áreas do direito."
    },
    {
      key: "processosNovos",
      titulo: "Processos Novos",
      valor: kpis?.processosNovos || 0,
      icone: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />,
      iconeBg: "bg-blue-500/10",
      tendencia: "alta",
      variacao: 5.2,
      descricao: `Novos • ${filtrosAtivos}`,
      explicacao: "Processos novos são os casos que ingressaram no Judiciário durante o período selecionado. Um aumento pode indicar maior acesso à justiça ou aumento de conflitos na sociedade."
    },
    {
      key: "processosBaixados",
      titulo: "Processos Baixados",
      valor: kpis?.processosBaixados || 0,
      icone: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />,
      iconeBg: "bg-green-500/10",
      tendencia: "alta",
      variacao: 3.8,
      descricao: `Baixados • ${filtrosAtivos}`,
      explicacao: "Processos baixados são aqueles que tiveram sua tramitação encerrada, seja por sentença, acordo, arquivamento ou outra forma de término. Quanto maior este número em relação aos novos, melhor a eficiência do Judiciário."
    },
    {
      key: "processosPendentes",
      titulo: periodo && periodo !== 'ano' ? "Pendentes no Período" : "Processos Pendentes",
      valor: kpis?.processosPendentes || 0,
      icone: <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />,
      iconeBg: "bg-yellow-500/10",
      tendencia: "baixa",
      variacao: -1.2,
      descricao: area || tribunal ? `Pendentes • ${filtrosAtivos}` : "Aguardando julgamento",
      explicacao: "Processos pendentes são casos que aguardam alguma decisão ou movimentação processual. Uma redução neste número indica que o Judiciário está conseguindo dar vazão à demanda acumulada."
    },
  ];

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Em Alta</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Em Alta</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, index) => (
          <div
            key={card.key}
            className="relative bg-card border border-border rounded-xl p-3 sm:p-4 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Gradient overlay */}
            <div 
              className={cn(
                "absolute top-0 right-0 w-16 h-16 opacity-20 blur-2xl rounded-full",
                card.iconeBg.replace('/10', '')
              )}
            />
            
            {/* Header com ícone e botão de ajuda */}
            <div className="flex items-start justify-between mb-2">
              <div className={cn("p-2 rounded-lg", card.iconeBg)}>
                {card.icone}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onExplicar("kpi", { nome: card.titulo, valor: card.valor })}
              >
                <Lightbulb className="w-4 h-4 text-yellow-500" />
              </Button>
            </div>

            {/* Conteúdo - alterna entre dados e explicação */}
            {modoExplicacao ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">{card.titulo}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-4">
                  {card.explicacao}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  {card.titulo}
                </p>
                
                {/* Valor */}
                <div className="flex items-end gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {formatarValor(card.valor)}
                  </span>
                  
                  {card.tendencia && card.variacao !== undefined && (
                    <div className={cn(
                      "flex items-center gap-0.5 text-xs mb-0.5",
                      card.tendencia === "alta" ? "text-green-500" : "text-red-500"
                    )}>
                      {card.tendencia === "alta" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{card.variacao > 0 ? "+" : ""}{card.variacao}%</span>
                    </div>
                  )}
                </div>

                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                  {card.descricao}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
