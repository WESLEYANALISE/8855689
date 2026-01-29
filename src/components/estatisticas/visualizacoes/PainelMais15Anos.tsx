import React from "react";
import { motion } from "framer-motion";
import { Calendar, AlertTriangle, TrendingDown, Target, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface DadosMais15Anos {
  totalProcessos: number;
  percentualAcervo: number;
  metaReducao: number;
  reducaoAlcancada: number;
  tribunaisMaiores: Array<{
    tribunal: string;
    quantidade: number;
    percentual: number;
  }>;
}

interface PainelMais15AnosProps {
  dados: DadosMais15Anos | null;
  isLoading: boolean;
}

export function PainelMais15Anos({ dados, isLoading }: PainelMais15AnosProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[150px] rounded-xl" />
          <Skeleton className="h-[150px] rounded-xl" />
        </div>
      </div>
    );
  }

  const dadosExibicao = dados || {
    totalProcessos: 890000,
    percentualAcervo: 1.1,
    metaReducao: 30,
    reducaoAlcancada: 22.5,
    tribunaisMaiores: [
      { tribunal: "TJSP", quantidade: 180000, percentual: 20.2 },
      { tribunal: "TJRJ", quantidade: 95000, percentual: 10.7 },
      { tribunal: "TJMG", quantidade: 78000, percentual: 8.8 },
      { tribunal: "TJRS", quantidade: 65000, percentual: 7.3 },
      { tribunal: "TJBA", quantidade: 52000, percentual: 5.8 },
      { tribunal: "TRF1", quantidade: 48000, percentual: 5.4 },
      { tribunal: "TJPR", quantidade: 42000, percentual: 4.7 },
      { tribunal: "TRT2", quantidade: 38000, percentual: 4.3 },
    ],
  };

  const formatarNumero = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} mi`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)} mil`;
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-semibold">Processos com Mais de 15 Anos</h3>
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Atenção Especial
        </Badge>
      </div>

      {/* Card principal */}
      <Card className="p-6 bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Número grande */}
          <div className="flex-shrink-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center md:text-left"
            >
              <div className="text-4xl md:text-5xl font-bold text-destructive">
                {formatarNumero(dadosExibicao.totalProcessos)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                processos muito antigos
              </div>
            </motion.div>
          </div>

          {/* Indicadores */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold">{dadosExibicao.percentualAcervo}%</div>
              <div className="text-xs text-muted-foreground">do acervo total</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-green-500">
                -{dadosExibicao.reducaoAlcancada}%
              </div>
              <div className="text-xs text-muted-foreground">redução no ano</div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex-shrink-0">
            <div className="text-center p-4 rounded-lg border border-border">
              <Target className="w-6 h-6 mx-auto text-primary mb-2" />
              <div className="text-sm font-medium">Meta Nacional</div>
              <div className="text-2xl font-bold text-primary">-{dadosExibicao.metaReducao}%</div>
              <Progress 
                value={(dadosExibicao.reducaoAlcancada / dadosExibicao.metaReducao) * 100} 
                className="mt-2 h-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {((dadosExibicao.reducaoAlcancada / dadosExibicao.metaReducao) * 100).toFixed(0)}% alcançado
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ranking de tribunais */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Distribuição por Tribunal
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dadosExibicao.tribunaisMaiores.map((item, index) => (
              <motion.div
                key={item.tribunal}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
                  {index + 1}º
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{item.tribunal}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatarNumero(item.quantidade)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentual}%` }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                      className="h-full bg-destructive/60 rounded-full"
                    />
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.percentual}%
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolução temporal */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-500" />
            Evolução da Redução
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-end gap-2 h-32">
            {[
              { ano: "2020", valor: 1250000, reducao: 0 },
              { ano: "2021", valor: 1180000, reducao: 5.6 },
              { ano: "2022", valor: 1050000, reducao: 16 },
              { ano: "2023", valor: 960000, reducao: 23.2 },
              { ano: "2024", valor: 890000, reducao: 28.8 },
            ].map((item, index) => {
              const altura = (item.valor / 1250000) * 100;
              return (
                <motion.div
                  key={item.ano}
                  initial={{ height: 0 }}
                  animate={{ height: `${altura}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex-1 relative group"
                >
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-destructive/60 to-destructive/30 rounded-t-md" style={{ height: '100%' }} />
                  <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-muted-foreground">
                    {item.ano}
                  </div>
                  <div className="absolute -top-5 left-0 right-0 text-center text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatarNumero(item.valor)}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="text-xs text-center text-muted-foreground mt-8">
            Quantidade de processos com mais de 15 anos por ano
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
