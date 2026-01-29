import React from "react";
import { motion } from "framer-motion";
import { 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign,
  Users,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DadosIndicadores {
  taxaCongestionamento: number;
  indiceAtendimentoDemanda: number;
  taxaRecorribilidade: number;
  taxaReforma: number;
  custoPorProcesso: number;
  produtividadeMagistrado: number;
  processosPorServidor: number;
}

interface PainelIndicadoresProps {
  dados: DadosIndicadores | null;
  isLoading: boolean;
}

export function PainelIndicadores({ dados, isLoading }: PainelIndicadoresProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[180px] rounded-xl" />
        ))}
      </div>
    );
  }

  const dadosExibicao = dados || {
    taxaCongestionamento: 70.0,
    indiceAtendimentoDemanda: 103.7,
    taxaRecorribilidade: 14.2,
    taxaReforma: 21.8,
    custoPorProcesso: 1239,
    produtividadeMagistrado: 1876,
    processosPorServidor: 312,
  };

  const indicadores = [
    {
      titulo: "Taxa de Congestionamento",
      valor: dadosExibicao.taxaCongestionamento,
      sufixo: "%",
      descricao: "Processos não baixados em relação ao acervo",
      explicacao: "Indica o percentual de processos que permaneceram sem solução. Quanto menor, melhor o desempenho.",
      icon: Gauge,
      corValor: dadosExibicao.taxaCongestionamento > 75 ? "text-destructive" : dadosExibicao.taxaCongestionamento > 60 ? "text-amber-500" : "text-green-500",
      meta: 60,
      tipo: "gauge" as const,
    },
    {
      titulo: "Índice de Atend. à Demanda",
      valor: dadosExibicao.indiceAtendimentoDemanda,
      sufixo: "%",
      descricao: "Processos baixados ÷ Casos novos",
      explicacao: "IAD > 100% significa que mais processos foram baixados do que entraram. Meta: >100%",
      icon: Activity,
      corValor: dadosExibicao.indiceAtendimentoDemanda >= 100 ? "text-green-500" : "text-destructive",
      meta: 100,
      tipo: "gauge" as const,
    },
    {
      titulo: "Custo por Processo",
      valor: dadosExibicao.custoPorProcesso,
      prefixo: "R$",
      descricao: "Despesa total ÷ Processos baixados",
      explicacao: "Custo médio para tramitar cada processo no judiciário brasileiro.",
      icon: DollarSign,
      corValor: "text-primary",
      tipo: "valor" as const,
    },
    {
      titulo: "Produtividade Magistrado",
      valor: dadosExibicao.produtividadeMagistrado,
      descricao: "Processos baixados por magistrado/ano",
      explicacao: "Média de processos finalizados por cada magistrado ao longo do ano.",
      icon: Users,
      corValor: "text-primary",
      tipo: "valor" as const,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gauge className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Indicadores de Desempenho</h3>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indicadores.map((ind, index) => (
          <IndicadorCard key={ind.titulo} {...ind} delay={index * 0.1} />
        ))}
      </div>

      {/* Indicadores secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Taxa de Recorribilidade</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Percentual de decisões que são objeto de recurso
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{dadosExibicao.taxaRecorribilidade}%</span>
            <Badge variant="outline" className="mb-1">
              <TrendingDown className="w-3 h-3 mr-1" />
              -1.2%
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Taxa de Reforma</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Percentual de decisões reformadas em grau recursal
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{dadosExibicao.taxaReforma}%</span>
            <Badge variant="outline" className="mb-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +0.5%
            </Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Processos por Servidor</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Carga de trabalho média por servidor do judiciário
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{dadosExibicao.processosPorServidor}</span>
            <Badge variant="outline" className="mb-1">por ano</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface IndicadorCardProps {
  titulo: string;
  valor: number;
  prefixo?: string;
  sufixo?: string;
  descricao: string;
  explicacao: string;
  icon: React.ComponentType<{ className?: string }>;
  corValor: string;
  meta?: number;
  tipo: "gauge" | "valor";
  delay: number;
}

function IndicadorCard({ 
  titulo, 
  valor, 
  prefixo = "", 
  sufixo = "", 
  descricao, 
  explicacao,
  icon: Icon, 
  corValor, 
  meta,
  tipo,
  delay 
}: IndicadorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="p-4 h-full hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="max-w-xs text-xs">{explicacao}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <h4 className="text-xs text-muted-foreground mb-2 line-clamp-1">{titulo}</h4>

        {tipo === "gauge" && meta ? (
          <div className="mb-3">
            <GaugeMini valor={valor} meta={meta} cor={corValor} />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className={`text-2xl font-bold ${corValor} mb-2`}
          >
            {prefixo}{valor.toLocaleString('pt-BR')}{sufixo}
          </motion.div>
        )}

        <p className="text-[10px] text-muted-foreground line-clamp-2">{descricao}</p>
      </Card>
    </motion.div>
  );
}

interface GaugeMiniProps {
  valor: number;
  meta: number;
  cor: string;
}

function GaugeMini({ valor, meta, cor }: GaugeMiniProps) {
  // Para taxa de congestionamento: menor é melhor
  // Para IAD: maior que 100 é bom
  const porcentagem = meta === 100 
    ? Math.min((valor / 150) * 100, 100) // IAD
    : Math.min((valor / 100) * 100, 100); // Congestionamento

  const circunferencia = Math.PI * 40; // semicírculo, raio 40
  const offset = circunferencia - (porcentagem / 100) * circunferencia;

  return (
    <div className="relative w-full h-16">
      <svg viewBox="0 0 100 60" className="w-full h-full">
        {/* Arco de fundo */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        {/* Arco de progresso */}
        <motion.path
          d="M 10 50 A 40 40 0 0 1 90 50"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={cor}
          strokeDasharray={circunferencia}
          initial={{ strokeDashoffset: circunferencia }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Valor central */}
        <text
          x="50"
          y="45"
          textAnchor="middle"
          className="text-xl font-bold fill-foreground"
          style={{ fontSize: "16px" }}
        >
          {valor}%
        </text>
      </svg>
      {meta && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">
          Meta: {meta}%
        </div>
      )}
    </div>
  );
}
