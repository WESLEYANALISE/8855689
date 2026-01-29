import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { VotacaoSenadoCard, GraficoVotacaoSenado } from "@/components/senado";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { Vote, ArrowLeft, Calendar, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const MESES = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

// Anos disponíveis (de 2019 até o ano atual)
const anoAtual = new Date().getFullYear();
const ANOS = Array.from({ length: anoAtual - 2018 }, (_, i) => ({
  value: String(anoAtual - i),
  label: String(anoAtual - i),
}));

const SenadoVotacoes = () => {
  const navigate = useNavigate();
  const [votacoes, setVotacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Filtros por mês e ano
  const [mesSelecionado, setMesSelecionado] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [anoSelecionado, setAnoSelecionado] = useState(String(new Date().getFullYear()));
  const [filtroResultado, setFiltroResultado] = useState("todos");

  useEffect(() => {
    fetchVotacoes();
  }, [mesSelecionado, anoSelecionado, filtroResultado]);

  const fetchVotacoes = async () => {
    setLoading(true);
    try {
      // Calcular intervalo do mês
      const inicioMes = `${anoSelecionado}-${mesSelecionado}-01`;
      const ultimoDia = new Date(parseInt(anoSelecionado), parseInt(mesSelecionado), 0).getDate();
      const fimMes = `${anoSelecionado}-${mesSelecionado}-${String(ultimoDia).padStart(2, '0')}`;
      
      // Buscar do cache (histórico)
      let query = supabase
        .from('senado_votacoes')
        .select('*')
        .gte('data_sessao', inicioMes)
        .lte('data_sessao', fimMes)
        .order('data_sessao', { ascending: false })
        .limit(100);
      
      if (filtroResultado !== 'todos') {
        query = query.ilike('resultado', `%${filtroResultado}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Formatar dados do cache para o componente
      const votacoesFormatadas = (data || []).map(v => ({
        codigoVotacao: v.codigo_votacao,
        codigoSessao: v.codigo_sessao,
        dataSessao: v.data_sessao,
        descricaoVotacao: v.descricao_votacao,
        descricaoSessao: v.descricao_sessao,
        resultado: v.resultado,
        totalSim: v.total_sim,
        totalNao: v.total_nao,
        totalAbstencao: v.total_abstencao,
        materia: {
          codigo: v.materia_codigo,
          sigla: v.materia_sigla,
          numero: v.materia_numero,
          ano: v.materia_ano,
        },
        votos: v.votos,
      }));
      
      setVotacoes(votacoesFormatadas);
    } catch (error) {
      console.error('Erro ao buscar votações:', error);
      toast.error('Erro ao carregar votações');
    } finally {
      setLoading(false);
    }
  };

  const syncVotacoes = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-senado-data', {
        body: { tipo: 'votacoes', dias: 60 }
      });

      if (error) throw error;
      
      toast.success(`${data?.totalVotacoes || 0} votações sincronizadas`);
      await fetchVotacoes();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar votações');
    } finally {
      setSyncing(false);
    }
  };

  const getMesLabel = () => {
    const mes = MESES.find(m => m.value === mesSelecionado);
    return mes?.label || '';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/ferramentas/senado')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="bg-green-500/20 rounded-xl p-2">
              <Vote className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Votações do Senado</h1>
              <p className="text-xs text-muted-foreground">
                {loading ? 'Carregando...' : `${votacoes.length} votações em ${getMesLabel()}/${anoSelecionado}`}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={syncVotacoes}
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Atualizar'}
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MESES.map(mes => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Seletor de Ano */}
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {ANOS.map(ano => (
                <SelectItem key={ano.value} value={ano.value}>
                  {ano.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Filtro de Resultado */}
          <Select value={filtroResultado} onValueChange={setFiltroResultado}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="aprovad">Aprovadas</SelectItem>
              <SelectItem value="rejeitad">Rejeitadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {loading ? (
          <SkeletonList count={5} />
        ) : votacoes.length === 0 ? (
          <div className="text-center py-12">
            <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma votação encontrada em {getMesLabel()}/{anoSelecionado}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Atualizar" para sincronizar as votações recentes
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={syncVotacoes}
              disabled={syncing}
              className="mt-4"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar Votações
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {votacoes.map((votacao, index) => (
              <div key={votacao.codigoVotacao || index} className="animate-fade-in">
                <VotacaoSenadoCard votacao={votacao} index={index} />
                
                {/* Gráfico para votações com dados */}
                {(votacao.totalSim || votacao.totalNao) && (
                  <div className="mt-2 p-4 bg-card rounded-lg border border-border">
                    <GraficoVotacaoSenado
                      totalSim={Number(votacao.totalSim) || 0}
                      totalNao={Number(votacao.totalNao) || 0}
                      totalAbstencao={Number(votacao.totalAbstencao) || 0}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SenadoVotacoes;
