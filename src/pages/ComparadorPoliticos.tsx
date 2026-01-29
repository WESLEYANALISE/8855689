import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, X, Users, DollarSign, FileText, Calendar, Building2,
  TrendingUp, TrendingDown, Minus, Plus, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComparadorPoliticos, PoliticoComparacao } from "@/hooks/useComparadorPoliticos";
import { getCorPartido } from "@/lib/partido-cores";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CORES_GRAFICOS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

export default function ComparadorPoliticos() {
  const navigate = useNavigate();
  const [tipoPolitico, setTipoPolitico] = useState<'deputado' | 'senador'>('deputado');
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);

  const {
    politicosSelecionados,
    isLoading,
    adicionarPolitico,
    removerPolitico,
    limparTodos,
    buscarPoliticos
  } = useComparadorPoliticos();

  const handleBusca = useCallback(async (termo: string) => {
    setTermoBusca(termo);
    if (termo.length < 2) {
      setResultadosBusca([]);
      return;
    }

    setBuscando(true);
    const resultados = await buscarPoliticos(termo, tipoPolitico);
    setResultadosBusca(resultados.filter(r => 
      !politicosSelecionados.find(p => p.id === r.id && p.tipo === r.tipo)
    ));
    setBuscando(false);
  }, [buscarPoliticos, tipoPolitico, politicosSelecionados]);

  const handleAdicionarPolitico = async (politico: any) => {
    await adicionarPolitico(politico.id, tipoPolitico);
    setTermoBusca('');
    setResultadosBusca([]);
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Preparar dados para gráfico comparativo
  const dadosGraficoComparativo = () => {
    if (politicosSelecionados.length === 0) return [];
    
    const maxMeses = Math.max(...politicosSelecionados.map(p => p.evolucaoGastos.length));
    const dados: any[] = [];
    
    for (let i = 0; i < maxMeses; i++) {
      const ponto: any = { mes: politicosSelecionados[0]?.evolucaoGastos[i]?.mes || '' };
      politicosSelecionados.forEach((p, idx) => {
        ponto[p.nome] = p.evolucaoGastos[i]?.valor || 0;
      });
      dados.push(ponto);
    }
    
    return dados;
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Comparador de Políticos</h1>
          <p className="text-xs text-muted-foreground">Compare até 4 políticos lado a lado</p>
        </div>
      </div>

      {/* Seletor de tipo */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={tipoPolitico === 'deputado' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTipoPolitico('deputado')}
          className={tipoPolitico === 'deputado' ? 'bg-amber-500 hover:bg-amber-600 text-black' : ''}
        >
          Deputados
        </Button>
        <Button
          variant={tipoPolitico === 'senador' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTipoPolitico('senador')}
          className={tipoPolitico === 'senador' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
        >
          Senadores
        </Button>
        {politicosSelecionados.length > 0 && (
          <Button variant="ghost" size="sm" onClick={limparTodos} className="ml-auto text-red-400">
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Campo de busca */}
      {politicosSelecionados.length < 4 && (
        <Card className="mb-4 bg-card border-border">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${tipoPolitico === 'deputado' ? 'deputado' : 'senador'} por nome...`}
                value={termoBusca}
                onChange={(e) => handleBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Resultados da busca */}
            {resultadosBusca.length > 0 && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {resultadosBusca.map((politico) => {
                  const cor = getCorPartido(politico.partido);
                  return (
                    <button
                      key={`${politico.tipo}-${politico.id}`}
                      onClick={() => handleAdicionarPolitico(politico)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      {politico.foto_url ? (
                        <img src={politico.foto_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{politico.nome}</p>
                        <div className="flex items-center gap-1">
                          <span className={`px-1 py-0.5 rounded text-[10px] ${cor.bg} ${cor.text}`}>
                            {politico.partido}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{politico.uf}</span>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}

            {buscando && (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cards dos políticos selecionados */}
      {politicosSelecionados.length > 0 && (
        <>
          <ScrollArea className="w-full whitespace-nowrap mb-4">
            <div className="flex gap-3 pb-2">
              {politicosSelecionados.map((politico, index) => {
                const cor = getCorPartido(politico.partido);
                return (
                  <Card 
                    key={`${politico.tipo}-${politico.id}`} 
                    className="w-40 flex-shrink-0 bg-card border-border relative"
                    style={{ borderColor: CORES_GRAFICOS[index] }}
                  >
                    <button
                      onClick={() => removerPolitico(politico.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                    <CardContent className="p-3 text-center">
                      {politico.foto_url ? (
                        <img 
                          src={politico.foto_url} 
                          alt={politico.nome} 
                          className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2"
                          style={{ borderColor: CORES_GRAFICOS[index] }}
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full mx-auto mb-2 bg-muted flex items-center justify-center border-2"
                          style={{ borderColor: CORES_GRAFICOS[index] }}
                        >
                          <Users className="w-8 h-8" />
                        </div>
                      )}
                      <p className="font-medium text-xs truncate">{politico.nome}</p>
                      <div className="flex justify-center gap-1 mt-1">
                        <span className={`px-1 py-0.5 rounded text-[9px] ${cor.bg} ${cor.text}`}>
                          {politico.partido}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{politico.uf}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Métricas comparativas */}
          <Card className="mb-4 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Comparativo de Métricas</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Despesas */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    Total Despesas
                  </div>
                  {politicosSelecionados.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES_GRAFICOS[i] }} />
                      <span className="text-xs truncate flex-1">{p.nome.split(' ')[0]}</span>
                      <span className="text-xs font-medium">{formatarValor(p.totalDespesas)}</span>
                    </div>
                  ))}
                </div>

                {/* Proposições */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    Proposições
                  </div>
                  {politicosSelecionados.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES_GRAFICOS[i] }} />
                      <span className="text-xs truncate flex-1">{p.nome.split(' ')[0]}</span>
                      <span className="text-xs font-medium">{p.totalProposicoes}</span>
                    </div>
                  ))}
                </div>

                {/* Presença */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Presença/Eventos
                  </div>
                  {politicosSelecionados.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES_GRAFICOS[i] }} />
                      <span className="text-xs truncate flex-1">{p.nome.split(' ')[0]}</span>
                      <span className="text-xs font-medium">{p.presenca}</span>
                    </div>
                  ))}
                </div>

                {/* Comissões */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    Comissões
                  </div>
                  {politicosSelecionados.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES_GRAFICOS[i] }} />
                      <span className="text-xs truncate flex-1">{p.nome.split(' ')[0]}</span>
                      <span className="text-xs font-medium">{p.comissoes}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico comparativo de gastos */}
          {politicosSelecionados.some(p => p.evolucaoGastos.length > 0) && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Evolução Comparativa de Gastos</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosGraficoComparativo()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => formatarValor(value)}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '10px' }}
                        iconSize={8}
                      />
                      {politicosSelecionados.map((p, i) => (
                        <Line
                          key={p.id}
                          type="monotone"
                          dataKey={p.nome}
                          stroke={CORES_GRAFICOS[i]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Estado vazio */}
      {politicosSelecionados.length === 0 && !buscando && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Nenhum político selecionado</h3>
            <p className="text-sm text-muted-foreground">
              Use a busca acima para adicionar até 4 políticos para comparar
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      )}
    </div>
  );
}
