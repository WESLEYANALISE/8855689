import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { RankingCard } from "@/components/RankingCard";
import { FileText, Calendar, Users, DollarSign, RefreshCw, ChevronRight, Search, Trophy, Star, Mic, Handshake, TrendingDown, Wallet, Filter } from "lucide-react";
import { useRankingCache } from "@/hooks/useRankingCache";
import { useDeputadosPopulares } from "@/hooks/useDeputadosPopulares";
import { RankingExplicacaoModal } from "@/components/RankingExplicacaoModal";
import { PARTIDOS_LISTA, UFS_LISTA, getCorPartido } from "@/lib/partido-cores";
type RankingTipo = 'despesas' | 'proposicoes' | 'presenca' | 'comissoes' | 'discursos' | 'frentes' | 'menos-despesas' | 'mandato';
type ModoVisualizacao = 'geral' | 'popular' | 'pesquisar';

// Gerar últimos 12 meses
const gerarUltimos12Meses = () => {
  const meses = [];
  const hoje = new Date();
  
  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const nomeMes = data.toLocaleDateString('pt-BR', { month: 'long' });
    meses.push({
      mes: data.getMonth() + 1,
      ano: data.getFullYear(),
      label: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
      labelCompleto: data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    });
  }
  
  return meses;
};

const MESES_DISPONIVEIS = gerarUltimos12Meses();

// Tipos que suportam filtro por mês
const TIPOS_COM_FILTRO_MES = ['despesas', 'menos-despesas'];

export default function CamaraRankingDeputados() {
  const { tipo } = useParams();
  const navigate = useNavigate();
  const [showExplicacao, setShowExplicacao] = useState(false);
  const [modo, setModo] = useState<ModoVisualizacao>('geral');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroPartido, setFiltroPartido] = useState<string | null>(null);
  const [filtroUf, setFiltroUf] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const tipoConfig: Record<string, { titulo: string; descricao: string; icon: any; metricaLabel: string; metricaFormat: (v: number) => string }> = {
    despesas: {
      titulo: "Gastos Parlamentares",
      descricao: "Deputados que mais gastaram cota parlamentar",
      icon: DollarSign,
      metricaLabel: "gastos",
      metricaFormat: (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    'menos-despesas': {
      titulo: "Deputados Mais Econômicos",
      descricao: "Deputados que menos gastaram da cota parlamentar",
      icon: TrendingDown,
      metricaLabel: "economia",
      metricaFormat: (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    mandato: {
      titulo: "Gastos do Mandato",
      descricao: "Total gasto desde fevereiro de 2023 (início do mandato atual)",
      icon: Wallet,
      metricaLabel: "total mandato",
      metricaFormat: (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    proposicoes: {
      titulo: "Produtividade Legislativa",
      descricao: "Deputados que mais apresentaram proposições no ano atual",
      icon: FileText,
      metricaLabel: "proposições",
      metricaFormat: (valor: number) => valor.toString(),
    },
    presenca: {
      titulo: "Presença e Assiduidade",
      descricao: "Deputados com maior participação em eventos nos últimos 30 dias",
      icon: Calendar,
      metricaLabel: "eventos",
      metricaFormat: (valor: number) => valor.toString(),
    },
    comissoes: {
      titulo: "Atuação em Comissões",
      descricao: "Deputados mais ativos em órgãos e comissões",
      icon: Users,
      metricaLabel: "comissões",
      metricaFormat: (valor: number) => valor.toString(),
    },
    discursos: {
      titulo: "Discursos Proferidos",
      descricao: "Deputados que mais discursaram em plenário",
      icon: Mic,
      metricaLabel: "discursos",
      metricaFormat: (valor: number) => valor.toString(),
    },
    frentes: {
      titulo: "Frentes Parlamentares",
      descricao: "Deputados em mais frentes suprapartidárias",
      icon: Handshake,
      metricaLabel: "frentes",
      metricaFormat: (valor: number) => valor.toString(),
    },
  };

  const config = tipoConfig[tipo as keyof typeof tipoConfig];
  
  // Usar os hooks
  const tipoNormalizado = tipo as RankingTipo;
  const { 
    ranking, 
    isLoading, 
    isStale,
    isPopulating,
    forcarAtualizacao,
    mesSelecionado,
    anoSelecionado,
    setMesSelecionado,
    setAnoSelecionado
  } = useRankingCache(tipoNormalizado);
  
  const { deputados: deputadosPopulares, isLoading: loadingPopulares } = useDeputadosPopulares();

  const suportaFiltroMes = TIPOS_COM_FILTRO_MES.includes(tipo || '');

  // Handler para selecionar mês
  const handleSelectMes = (mes: number, ano: number) => {
    setMesSelecionado(mes);
    setAnoSelecionado(ano);
  };

  // Filtrar ranking baseado no modo e busca
  const rankingFiltrado = useMemo(() => {
    let resultado = ranking;

    if (modo === 'popular') {
      const idsPopulares = deputadosPopulares.map(d => d.deputado_id);
      resultado = ranking.filter(r => idsPopulares.includes(r.deputado_id));
    }

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
  }, [ranking, modo, termoBusca, deputadosPopulares, filtroPartido, filtroUf]);

  // Obter mês/ano selecionado para exibição
  const mesAtualLabel = useMemo(() => {
    const mesInfo = MESES_DISPONIVEIS.find(m => m.mes === mesSelecionado && m.ano === anoSelecionado);
    return mesInfo?.labelCompleto || `${mesSelecionado}/${anoSelecionado}`;
  }, [mesSelecionado, anoSelecionado]);

  if (!config) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
        <Card className="p-4 text-center">
          <p className="text-muted-foreground text-sm">Tipo de ranking inválido</p>
          <Button onClick={() => navigate('/politica')} size="sm" className="mt-3">
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/40 via-neutral-950/80 to-neutral-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent" />
        
        <div className="relative z-10 px-4 pt-6 pb-6">
          <div className="max-w-4xl mx-auto">
            <Card className="p-4 bg-neutral-900/80 backdrop-blur-sm border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold leading-tight text-white">{config.titulo}</h1>
                  <p className="text-xs text-neutral-400 line-clamp-2">{config.descricao}</p>
                </div>
                {isStale && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={forcarAtualizacao}
                    className="flex-shrink-0 text-amber-400 hover:text-amber-300"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>

              {/* Botão Ver Mais destacado */}
              <button 
                onClick={() => setShowExplicacao(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-400 font-medium text-sm transition-colors border border-amber-500/20"
              >
                Ver mais detalhes sobre este ranking
                <ChevronRight className="w-4 h-4" />
              </button>
            </Card>
          </div>
        </div>
      </div>

      <div className="px-4 pb-24 max-w-4xl mx-auto">

      {/* Seletor de Mês - apenas para tipos que suportam */}
      {suportaFiltroMes && (
        <div className="mb-4">
          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Selecione o mês:
          </p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {MESES_DISPONIVEIS.map((mesItem, index) => {
                const isSelected = mesItem.mes === mesSelecionado && mesItem.ano === anoSelecionado;
                return (
                  <button
                    key={`${mesItem.ano}-${mesItem.mes}`}
                    onClick={() => handleSelectMes(mesItem.mes, mesItem.ano)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                      ${isSelected 
                        ? 'bg-amber-500 text-black' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }
                    `}
                  >
                    {mesItem.label}
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Menu de Alternância */}
      <div className="flex gap-2 mb-3">
        <Button
          variant={modo === 'geral' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setModo('geral'); setTermoBusca(''); }}
          className={modo === 'geral' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}
        >
          <Trophy className="w-4 h-4 mr-1.5" />
          Geral
        </Button>
        <Button
          variant={modo === 'popular' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setModo('popular'); setTermoBusca(''); }}
          className={modo === 'popular' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}
        >
          <Star className="w-4 h-4 mr-1.5" />
          Popular
        </Button>
        <Button
          variant={modo === 'pesquisar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setModo('pesquisar')}
          className={modo === 'pesquisar' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}
        >
          <Search className="w-4 h-4 mr-1.5" />
          Pesquisar
        </Button>
        <Button
          variant={mostrarFiltros ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={mostrarFiltros ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}
        >
          <Filter className="w-4 h-4 mr-1.5" />
          Filtros
        </Button>
      </div>

      {/* Filtros por Partido e UF */}
      {mostrarFiltros && (
        <div className="mb-4 space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Partido:</p>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 pb-2">
                <button
                  onClick={() => setFiltroPartido(null)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${!filtroPartido ? 'bg-amber-500 text-black' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                >
                  Todos
                </button>
                {PARTIDOS_LISTA.map(partido => {
                  const cor = getCorPartido(partido);
                  return (
                    <button
                      key={partido}
                      onClick={() => setFiltroPartido(partido)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${filtroPartido === partido ? `${cor.bg} ${cor.text} ring-1 ${cor.border}` : `${cor.bg} ${cor.text} opacity-70 hover:opacity-100`}`}
                    >
                      {partido}
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Estado:</p>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 pb-2">
                <button
                  onClick={() => setFiltroUf(null)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${!filtroUf ? 'bg-amber-500 text-black' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                >
                  Todos
                </button>
                {UFS_LISTA.map(uf => (
                  <button
                    key={uf}
                    onClick={() => setFiltroUf(uf)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${filtroUf === uf ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                  >
                    {uf}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Campo de Busca (sempre visível no modo pesquisar) */}
      {modo === 'pesquisar' && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar deputado por nome, partido ou estado..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Info do modo atual */}
      <p className="text-[10px] text-muted-foreground mb-3">
        {isLoading ? 'Carregando...' : 
          modo === 'popular' ? `${rankingFiltrado.length} deputados populares` :
          modo === 'pesquisar' && termoBusca ? `${rankingFiltrado.length} resultados para "${termoBusca}"` :
          `${rankingFiltrado.length} deputados`
        }
        {suportaFiltroMes && ` • ${mesAtualLabel}`}
        {isStale && !isLoading && ' (atualizando...)'}
      </p>

      {/* Modal de explicação */}
      <RankingExplicacaoModal
        tipo={tipoNormalizado}
        titulo={config.titulo}
        open={showExplicacao}
        onOpenChange={setShowExplicacao}
      />

      {/* Lista de rankings com animação slideDown */}
      <div className="space-y-2">
        {rankingFiltrado.map((deputado, index) => (
          <RankingCard
            key={deputado.id}
            posicao={deputado.posicao || index + 1}
            posicaoAnterior={deputado.posicao_anterior}
            deputado={{
              id: deputado.deputado_id,
              nome: deputado.nome,
              siglaPartido: deputado.partido || '',
              siglaUf: deputado.uf || '',
              urlFoto: deputado.foto_url || '',
            }}
            metrica={deputado.valor}
            metricaLabel={config.metricaFormat(deputado.valor)}
            onClick={() => navigate(`/camara-deputados/deputado/${deputado.deputado_id}`)}
            animationDelay={index * 0.03}
          />
        ))}
      </div>

      {rankingFiltrado.length === 0 && !isLoading && (
        <Card className="p-6 text-center bg-neutral-900/80 border-white/5">
          {isPopulating ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                <p className="text-amber-400 font-medium">Populando dados...</p>
              </div>
              <p className="text-neutral-400 text-sm">
                Estamos buscando os dados da Câmara dos Deputados. Isso pode levar alguns minutos.
                <br />
                Recarregue a página em breve para ver os resultados.
              </p>
            </>
          ) : (
            <>
              <p className="text-neutral-400 text-sm">
                {modo === 'pesquisar' && termoBusca 
                  ? `Nenhum deputado encontrado para "${termoBusca}"`
                  : modo === 'popular'
                  ? 'Nenhum deputado popular encontrado neste ranking'
                  : 'Nenhum dado disponível para este ranking'
                }
              </p>
              {modo === 'geral' && (
                <Button onClick={forcarAtualizacao} size="sm" className="mt-3 bg-amber-500 hover:bg-amber-600 text-black">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Ranking
                </Button>
              )}
            </>
          )}
        </Card>
      )}
      </div>
    </div>
  );
}
