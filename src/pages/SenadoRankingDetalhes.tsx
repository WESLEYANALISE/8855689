import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FileText, Users, DollarSign, RefreshCw, ChevronRight, Search, Trophy, Mic, Vote, TrendingUp, TrendingDown, Minus, Sparkles, Filter, MapPin } from "lucide-react";
import { useRankingCacheSenado, RankingTipoSenado } from "@/hooks/useRankingCacheSenado";
import { CORES_PARTIDOS, getCorPartido } from "@/lib/partido-cores";

type ModoVisualizacao = 'geral' | 'pesquisar';

const PARTIDOS_SENADO = ['MDB', 'PL', 'PT', 'PSD', 'UNIÃO', 'PP', 'REPUBLICANOS', 'PDT', 'PSDB', 'PODE', 'PSB', 'CIDADANIA', 'PV', 'NOVO', 'REDE'];
const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

export default function SenadoRankingDetalhes() {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const [modo, setModo] = useState<ModoVisualizacao>('geral');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroPartido, setFiltroPartido] = useState<string | null>(null);
  const [filtroUf, setFiltroUf] = useState<string | null>(null);

  const tipoConfig: Record<string, { titulo: string; descricao: string; icon: any; metricaLabel: string; metricaFormat: (v: number) => string }> = {
    despesas: {
      titulo: "Gastos de Senadores",
      descricao: "Senadores que mais utilizaram recursos públicos",
      icon: DollarSign,
      metricaLabel: "gastos",
      metricaFormat: (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    materias: {
      titulo: "Produção Legislativa",
      descricao: "Senadores que mais apresentaram matérias e proposições",
      icon: FileText,
      metricaLabel: "matérias",
      metricaFormat: (valor: number) => valor.toString(),
    },
    discursos: {
      titulo: "Discursos Proferidos",
      descricao: "Senadores que mais discursaram em plenário",
      icon: Mic,
      metricaLabel: "discursos",
      metricaFormat: (valor: number) => valor.toString(),
    },
    comissoes: {
      titulo: "Atuação em Comissões",
      descricao: "Senadores mais ativos em comissões",
      icon: Users,
      metricaLabel: "comissões",
      metricaFormat: (valor: number) => valor.toString(),
    },
    votacoes: {
      titulo: "Participação em Votações",
      descricao: "Senadores que mais participaram de votações",
      icon: Vote,
      metricaLabel: "votos",
      metricaFormat: (valor: number) => valor.toString(),
    },
  };

  const config = tipoConfig[tipo as keyof typeof tipoConfig];
  
  const tipoNormalizado = tipo as RankingTipoSenado;
  const { 
    ranking, 
    isLoading, 
    isStale,
    isPopulating,
    forcarAtualizacao,
  } = useRankingCacheSenado(tipoNormalizado);

  // Filtrar ranking baseado no modo e busca
  const rankingFiltrado = useMemo(() => {
    let resultado = ranking;

    if (filtroPartido) {
      resultado = resultado.filter(r => r.partido === filtroPartido);
    }

    if (filtroUf) {
      resultado = resultado.filter(r => r.uf === filtroUf);
    }

    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase().trim();
      resultado = resultado.filter(r => 
        r.nome.toLowerCase().includes(termo) ||
        (r.partido && r.partido.toLowerCase().includes(termo)) ||
        (r.uf && r.uf.toLowerCase().includes(termo))
      );
    }

    return resultado;
  }, [ranking, termoBusca, filtroPartido, filtroUf]);

  // Função para calcular mudança de posição
  const getMudancaPosicao = (posicao: number, posicaoAnterior: number | null | undefined) => {
    if (posicaoAnterior === undefined || posicaoAnterior === null) {
      return { tipo: 'novo', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/20', texto: 'Novo' };
    }
    
    const diferenca = posicaoAnterior - posicao;
    
    if (diferenca > 0) {
      return { 
        tipo: 'subiu', 
        icon: TrendingUp, 
        color: 'text-green-400', 
        bg: 'bg-green-500/20',
        texto: `+${diferenca}`
      };
    } else if (diferenca < 0) {
      return { 
        tipo: 'desceu', 
        icon: TrendingDown, 
        color: 'text-red-400', 
        bg: 'bg-red-500/20',
        texto: `${diferenca}`
      };
    } else {
      return { 
        tipo: 'igual', 
        icon: Minus, 
        color: 'text-muted-foreground', 
        bg: 'bg-muted/20',
        texto: '—'
      };
    }
  };

  if (!config) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Card className="p-4 text-center">
          <p className="text-muted-foreground text-sm">Tipo de ranking inválido</p>
          <Button onClick={() => navigate('/politica/rankings?tipo=senadores')} size="sm" className="mt-3">
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const Icon = config.icon;
  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <Card className="p-4 mb-4 bg-gradient-to-r from-blue-500/20 to-blue-500/5 border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-blue-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-tight">{config.titulo}</h1>
            <p className="text-xs text-muted-foreground line-clamp-2">{config.descricao}</p>
          </div>
          {isStale && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={forcarAtualizacao}
              className="flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </Card>

      {/* Menu de Alternância */}
      <div className="flex gap-2 mb-3">
        <Button
          variant={modo === 'geral' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setModo('geral'); setTermoBusca(''); }}
          className={modo === 'geral' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
        >
          <Trophy className="w-4 h-4 mr-1.5" />
          Ranking
        </Button>
        <Button
          variant={modo === 'pesquisar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModo('pesquisar')}
          className={modo === 'pesquisar' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
        >
          <Search className="w-4 h-4 mr-1.5" />
          Pesquisar
        </Button>
      </div>

      {/* Campo de Busca */}
      {modo === 'pesquisar' && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar senador por nome, partido ou estado..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Filtros por Partido e Estado */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="w-3 h-3" />
          <span>Filtrar por partido:</span>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-2">
            <button 
              onClick={() => setFiltroPartido(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                !filtroPartido 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              Todos
            </button>
            {PARTIDOS_SENADO.map(partido => {
              const cor = getCorPartido(partido);
              return (
                <button
                  key={partido}
                  onClick={() => setFiltroPartido(partido === filtroPartido ? null : partido)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    partido === filtroPartido 
                      ? `${cor.bg} ${cor.text} ring-1 ring-current` 
                      : `${cor.bg} ${cor.text} opacity-70 hover:opacity-100`
                  }`}
                >
                  {partido}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>Filtrar por estado:</span>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5 pb-2">
            <button 
              onClick={() => setFiltroUf(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                !filtroUf 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              Todos
            </button>
            {UFS.map(uf => (
              <button
                key={uf}
                onClick={() => setFiltroUf(uf === filtroUf ? null : uf)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  uf === filtroUf 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {uf}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Info */}
      <p className="text-[10px] text-muted-foreground mb-3">
        {isLoading ? 'Carregando...' : 
          modo === 'pesquisar' && termoBusca ? `${rankingFiltrado.length} resultados para "${termoBusca}"` :
          `${rankingFiltrado.length} senadores`
        }
        {isStale && !isLoading && ' (atualizando...)'}
      </p>

      {/* Lista de rankings com animação slideDown */}
      <div className="space-y-2">
        {rankingFiltrado.map((senador, index) => {
          const mudanca = getMudancaPosicao(index + 1, senador.posicao_anterior);
          const MudancaIcon = mudanca.icon;
          
          return (
            <div key={senador.id} className="animate-fade-in">
              <Card
                className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/50"
                onClick={() => navigate(`/ferramentas/senado/senador/${senador.senador_codigo}`)}
              >
                <div className="flex items-center gap-3">
                  {/* Posição */}
                  <div className="w-8 text-center flex-shrink-0">
                    {index < 3 ? (
                      <span className="text-lg">{MEDALS[index]}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {index + 1}º
                      </span>
                    )}
                  </div>

                  {/* Foto */}
                  <img
                    src={senador.foto_url || '/placeholder.svg'}
                    alt={senador.nome}
                    className="w-10 h-10 rounded-full object-cover bg-muted flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate">{senador.nome}</p>
                      
                      {/* Indicador de mudança */}
                      {mudanca && (
                        <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded ${mudanca.bg}`}>
                          <MudancaIcon className={`w-2.5 h-2.5 ${mudanca.color}`} />
                          <span className={`text-[9px] font-semibold ${mudanca.color}`}>
                            {mudanca.texto}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {senador.partido}/{senador.uf}
                    </p>
                  </div>

                  {/* Valor */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-blue-400">
                      {config.metricaFormat(senador.valor)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {config.metricaLabel}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {rankingFiltrado.length === 0 && !isLoading && (
        <Card className="p-4 text-center">
          {isPopulating ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                <p className="text-blue-500 font-medium">Populando dados...</p>
              </div>
              <p className="text-muted-foreground text-sm">
                Estamos buscando os dados do Senado Federal. Isso pode levar alguns minutos.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                {modo === 'pesquisar' && termoBusca 
                  ? `Nenhum senador encontrado para "${termoBusca}"`
                  : 'Nenhum dado disponível para este ranking'
                }
              </p>
              {modo === 'geral' && (
                <Button onClick={forcarAtualizacao} size="sm" className="mt-3">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Ranking
                </Button>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}
