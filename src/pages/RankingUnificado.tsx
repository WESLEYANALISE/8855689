import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, 
  Medal, 
  Award, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Filter,
  ChevronRight,
  Star,
  Info,
  RefreshCw,
  Building2,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RankingItem {
  id: string;
  politico_id: number;
  tipo: 'deputado' | 'senador';
  nome: string;
  partido: string | null;
  uf: string | null;
  foto_url: string | null;
  nota_votacoes: number;
  nota_gastos: number;
  nota_presenca: number;
  nota_proposicoes: number;
  nota_processos: number;
  nota_outros: number;
  nota_final: number;
  posicao: number;
  posicao_anterior: number;
  variacao_posicao: number;
  updated_at: string;
}

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", 
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", 
  "SP", "SE", "TO"
];

const RankingUnificado = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'deputado' | 'senador'>('todos');
  const [ufFiltro, setUfFiltro] = useState<string>('todos');
  const [partidoFiltro, setPartidoFiltro] = useState<string>('todos');
  const [isAtualizando, setIsAtualizando] = useState(false);

  const { data: ranking, isLoading, refetch } = useQuery({
    queryKey: ['ranking-unificado'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranking_nota_final')
        .select('*')
        .order('nota_final', { ascending: false });
      
      if (error) throw error;
      return data as RankingItem[];
    }
  });

  const partidos = useMemo(() => {
    if (!ranking) return [];
    const partidosSet = new Set(ranking.map(r => r.partido).filter(Boolean));
    return Array.from(partidosSet).sort();
  }, [ranking]);

  const rankingFiltrado = useMemo(() => {
    if (!ranking) return [];
    
    return ranking.filter(item => {
      const matchBusca = !busca || 
        item.nome.toLowerCase().includes(busca.toLowerCase()) ||
        item.partido?.toLowerCase().includes(busca.toLowerCase());
      
      const matchTipo = tipoFiltro === 'todos' || item.tipo === tipoFiltro;
      const matchUf = ufFiltro === 'todos' || item.uf === ufFiltro;
      const matchPartido = partidoFiltro === 'todos' || item.partido === partidoFiltro;
      
      return matchBusca && matchTipo && matchUf && matchPartido;
    });
  }, [ranking, busca, tipoFiltro, ufFiltro, partidoFiltro]);

  const handleAtualizarRanking = async () => {
    setIsAtualizando(true);
    try {
      const { data, error } = await supabase.functions.invoke('calcular-ranking-unificado', {
        body: { tipo: 'todos' }
      });
      
      if (error) throw error;
      
      toast.success(`Ranking atualizado! ${data.total_processados} políticos processados.`);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar ranking:', error);
      toast.error('Erro ao atualizar ranking');
    } finally {
      setIsAtualizando(false);
    }
  };

  const getMedalIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getVariacaoIcon = (variacao: number) => {
    if (variacao > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (variacao < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 8) return "text-green-500";
    if (nota >= 6) return "text-yellow-500";
    if (nota >= 4) return "text-orange-500";
    return "text-red-500";
  };

  const getNotaBg = (nota: number) => {
    if (nota >= 8) return "bg-green-500/10 border-green-500/30";
    if (nota >= 6) return "bg-yellow-500/10 border-yellow-500/30";
    if (nota >= 4) return "bg-orange-500/10 border-orange-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const handleNavigateToPolitico = (item: RankingItem) => {
    if (item.tipo === 'deputado') {
      navigate(`/camara-deputados/deputado/${item.politico_id}`);
    } else {
      navigate(`/senado/senador/${item.politico_id}`);
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Ranking Unificado</h1>
            <p className="text-xs text-muted-foreground">
              Avaliação geral dos parlamentares
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/politica/rankings/metodologia')}
                >
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver metodologia</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAtualizarRanking}
            disabled={isAtualizando}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isAtualizando ? 'animate-spin' : ''}`} />
            {isAtualizando ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 mb-4"
      >
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou partido..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs de tipo */}
        <Tabs value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todos" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="deputado" className="text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              Deputados
            </TabsTrigger>
            <TabsTrigger value="senador" className="text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              Senadores
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtros de UF e Partido */}
        <div className="flex gap-2">
          <Select value={ufFiltro} onValueChange={setUfFiltro}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos UFs</SelectItem>
              {ESTADOS_BRASIL.map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={partidoFiltro} onValueChange={setPartidoFiltro}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Partido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Partidos</SelectItem>
              {partidos.map(partido => (
                <SelectItem key={partido} value={partido!}>{partido}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Estatísticas rápidas */}
      {ranking && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-2 mb-4"
        >
          <Card className="p-3 text-center bg-green-500/10 border-green-500/30">
            <div className="text-lg font-bold text-green-500">
              {ranking.filter(r => r.nota_final >= 7).length}
            </div>
            <div className="text-[10px] text-muted-foreground">Nota ≥ 7</div>
          </Card>
          <Card className="p-3 text-center bg-yellow-500/10 border-yellow-500/30">
            <div className="text-lg font-bold text-yellow-500">
              {ranking.filter(r => r.nota_final >= 5 && r.nota_final < 7).length}
            </div>
            <div className="text-[10px] text-muted-foreground">Nota 5-7</div>
          </Card>
          <Card className="p-3 text-center bg-red-500/10 border-red-500/30">
            <div className="text-lg font-bold text-red-500">
              {ranking.filter(r => r.nota_final < 5).length}
            </div>
            <div className="text-[10px] text-muted-foreground">Nota &lt; 5</div>
          </Card>
        </motion.div>
      )}

      {/* Lista de ranking */}
      <div className="space-y-2">
        {isLoading ? (
          Array(10).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))
        ) : rankingFiltrado.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {ranking?.length === 0 
                ? "Nenhum ranking calculado ainda. Clique em 'Atualizar' para calcular."
                : "Nenhum político encontrado com os filtros selecionados."}
            </p>
          </Card>
        ) : (
          rankingFiltrado.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card
                className="p-3 cursor-pointer hover:border-primary/50 transition-all group active:scale-[0.99]"
                onClick={() => handleNavigateToPolitico(item)}
              >
                <div className="flex items-center gap-3">
                  {/* Posição e Medalha */}
                  <div className="flex flex-col items-center min-w-[40px]">
                    {getMedalIcon(item.posicao) || (
                      <span className="text-lg font-bold text-muted-foreground">
                        {item.posicao}º
                      </span>
                    )}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {getVariacaoIcon(item.variacao_posicao)}
                      {item.variacao_posicao !== 0 && (
                        <span className={`text-[10px] ${item.variacao_posicao > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {Math.abs(item.variacao_posicao)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Foto */}
                  <div className="relative">
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt={item.nome}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      variant="secondary"
                      className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0"
                    >
                      {item.tipo === 'deputado' ? 'DEP' : 'SEN'}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.nome}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.partido || 'S/P'}</span>
                      <span>•</span>
                      <span>{item.uf || 'N/A'}</span>
                    </div>
                    
                    {/* Mini breakdown */}
                    <div className="flex items-center gap-1 mt-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-0.5">
                              <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${item.nota_gastos * 10}%` }}
                                />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gastos: {item.nota_gastos.toFixed(1)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-0.5">
                              <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${item.nota_presenca * 10}%` }}
                                />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Presença: {item.nota_presenca.toFixed(1)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-0.5">
                              <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${item.nota_proposicoes * 10}%` }}
                                />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Produtividade: {item.nota_proposicoes.toFixed(1)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Nota Final */}
                  <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border ${getNotaBg(item.nota_final)}`}>
                    <Star className={`w-4 h-4 ${getNotaColor(item.nota_final)} mb-0.5`} />
                    <span className={`text-xl font-bold ${getNotaColor(item.nota_final)}`}>
                      {item.nota_final.toFixed(1)}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Rodapé informativo */}
      {ranking && ranking.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-muted/50 rounded-lg"
        >
          <p className="text-xs text-muted-foreground text-center">
            Ranking baseado em: gastos, presença, produtividade legislativa e atuação em comissões.
            <Button
              variant="link"
              className="text-xs px-1 h-auto"
              onClick={() => navigate('/politica/rankings/metodologia')}
            >
              Ver metodologia completa
            </Button>
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default RankingUnificado;
