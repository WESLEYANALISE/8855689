import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, BarChart3, Building2, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DadosEstado {
  uf: string;
  nome: string;
  processos: number;
  populacao: number;
  processosPer100k: number;
  taxaCongestionamento: number;
}

interface PainelMapasProps {
  dados: DadosEstado[] | null;
  isLoading: boolean;
}

const DADOS_ESTADOS_MOCK: DadosEstado[] = [
  { uf: "SP", nome: "São Paulo", processos: 25000000, populacao: 46600000, processosPer100k: 53648, taxaCongestionamento: 72.5 },
  { uf: "RJ", nome: "Rio de Janeiro", processos: 12000000, populacao: 17400000, processosPer100k: 68966, taxaCongestionamento: 75.8 },
  { uf: "MG", nome: "Minas Gerais", processos: 8500000, populacao: 21400000, processosPer100k: 39720, taxaCongestionamento: 68.2 },
  { uf: "RS", nome: "Rio Grande do Sul", processos: 5200000, populacao: 11400000, processosPer100k: 45614, taxaCongestionamento: 65.4 },
  { uf: "PR", nome: "Paraná", processos: 4800000, populacao: 11500000, processosPer100k: 41739, taxaCongestionamento: 62.1 },
  { uf: "BA", nome: "Bahia", processos: 3200000, populacao: 14900000, processosPer100k: 21477, taxaCongestionamento: 71.3 },
  { uf: "SC", nome: "Santa Catarina", processos: 2900000, populacao: 7300000, processosPer100k: 39726, taxaCongestionamento: 58.9 },
  { uf: "GO", nome: "Goiás", processos: 2100000, populacao: 7100000, processosPer100k: 29577, taxaCongestionamento: 66.7 },
  { uf: "PE", nome: "Pernambuco", processos: 1900000, populacao: 9600000, processosPer100k: 19792, taxaCongestionamento: 73.2 },
  { uf: "CE", nome: "Ceará", processos: 1700000, populacao: 9200000, processosPer100k: 18478, taxaCongestionamento: 69.8 },
  { uf: "DF", nome: "Distrito Federal", processos: 1500000, populacao: 3100000, processosPer100k: 48387, taxaCongestionamento: 64.5 },
  { uf: "ES", nome: "Espírito Santo", processos: 1200000, populacao: 4100000, processosPer100k: 29268, taxaCongestionamento: 61.2 },
];

export function PainelMapas({ dados, isLoading }: PainelMapasProps) {
  const [ordenacao, setOrdenacao] = useState<'processos' | 'per100k' | 'congestionamento'>('processos');
  const [visualizacao, setVisualizacao] = useState<'lista' | 'mapa'>('lista');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  const dadosExibicao = dados || DADOS_ESTADOS_MOCK;

  const dadosOrdenados = [...dadosExibicao].sort((a, b) => {
    switch (ordenacao) {
      case 'per100k':
        return b.processosPer100k - a.processosPer100k;
      case 'congestionamento':
        return b.taxaCongestionamento - a.taxaCongestionamento;
      default:
        return b.processos - a.processos;
    }
  });

  const formatarNumero = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString('pt-BR');
  };

  const getCorPorProcessos = (processos: number) => {
    const max = Math.max(...dadosExibicao.map(d => d.processos));
    const intensidade = processos / max;
    if (intensidade > 0.7) return "bg-red-500";
    if (intensidade > 0.4) return "bg-amber-500";
    if (intensidade > 0.2) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Distribuição Geográfica</h3>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={visualizacao} onValueChange={(v) => setVisualizacao(v as 'lista' | 'mapa')}>
            <TabsList className="h-8">
              <TabsTrigger value="lista" className="text-xs h-7">Lista</TabsTrigger>
              <TabsTrigger value="mapa" className="text-xs h-7">Mapa</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Opções de ordenação */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={ordenacao === 'processos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOrdenacao('processos')}
          className="text-xs h-7"
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          Total de Processos
        </Button>
        <Button
          variant={ordenacao === 'per100k' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOrdenacao('per100k')}
          className="text-xs h-7"
        >
          <ArrowUpDown className="w-3 h-3 mr-1" />
          Por 100k hab.
        </Button>
        <Button
          variant={ordenacao === 'congestionamento' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOrdenacao('congestionamento')}
          className="text-xs h-7"
        >
          <Building2 className="w-3 h-3 mr-1" />
          Congestionamento
        </Button>
      </div>

      {visualizacao === 'lista' ? (
        /* Lista de estados */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dadosOrdenados.map((estado, index) => (
            <motion.div
              key={estado.uf}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  {/* Posição e badge UF */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xs text-muted-foreground">#{index + 1}</div>
                    <div className={`w-10 h-10 rounded-lg ${getCorPorProcessos(estado.processos)} flex items-center justify-center text-white font-bold text-sm`}>
                      {estado.uf}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{estado.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      Pop: {(estado.populacao / 1000000).toFixed(1)}M
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="text-right space-y-1">
                    <div className="font-bold text-sm">
                      {formatarNumero(estado.processos)}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Badge variant="outline" className="text-[10px]">
                        {estado.processosPer100k.toLocaleString('pt-BR')}/100k
                      </Badge>
                      <Badge 
                        variant={estado.taxaCongestionamento > 70 ? "destructive" : "secondary"} 
                        className="text-[10px]"
                      >
                        {estado.taxaCongestionamento}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Visualização de mapa simplificada */
        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-medium">
              Mapa de Calor - Processos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Grid simplificado representando o Brasil */}
            <div className="grid grid-cols-5 md:grid-cols-7 gap-2">
              {dadosOrdenados.map((estado, index) => {
                const intensidade = estado.processos / Math.max(...dadosExibicao.map(d => d.processos));
                return (
                  <motion.div
                    key={estado.uf}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative group"
                  >
                    <div
                      className="aspect-square rounded-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer transition-transform hover:scale-110"
                      style={{
                        backgroundColor: `rgba(234, 56, 76, ${0.3 + intensidade * 0.7})`,
                      }}
                    >
                      {estado.uf}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <div className="bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap">
                        <div className="font-medium">{estado.nome}</div>
                        <div>{formatarNumero(estado.processos)} processos</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="text-xs text-muted-foreground">Menos processos</span>
              <div className="flex gap-1">
                {[0.3, 0.5, 0.7, 0.9, 1].map((intensidade) => (
                  <div
                    key={intensidade}
                    className="w-6 h-4 rounded"
                    style={{ backgroundColor: `rgba(234, 56, 76, ${intensidade})` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Mais processos</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-primary">27</div>
          <div className="text-xs text-muted-foreground">Estados + DF</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold">
            {formatarNumero(dadosExibicao.reduce((acc, d) => acc + d.processos, 0))}
          </div>
          <div className="text-xs text-muted-foreground">Total de Processos</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-amber-500">
            {(dadosExibicao.reduce((acc, d) => acc + d.taxaCongestionamento, 0) / dadosExibicao.length).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">Congestionamento Médio</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-green-500">SP + RJ</div>
          <div className="text-xs text-muted-foreground">44% do total</div>
        </Card>
      </div>
    </div>
  );
}
