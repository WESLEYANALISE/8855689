import React from "react";
import { motion } from "framer-motion";
import { Clock, TrendingDown, TrendingUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DadosTempos {
  tempoMedioInicioBaixa: number; // dias
  tempoMedioPendente: number; // dias
  tempoMedioConclusao: number; // dias
  tempoMedioSentenca: number; // dias
  variacaoAnual: number; // percentual
}

interface PainelTemposProps {
  dados: DadosTempos | null;
  isLoading: boolean;
}

export function PainelTempos({ dados, isLoading }: PainelTemposProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-xl" />
        ))}
      </div>
    );
  }

  const dadosExibicao = dados || {
    tempoMedioInicioBaixa: 918,
    tempoMedioPendente: 1348,
    tempoMedioConclusao: 816,
    tempoMedioSentenca: 456,
    variacaoAnual: -3.2,
  };

  const tempos = [
    {
      titulo: "Tempo Médio até Baixa",
      valor: dadosExibicao.tempoMedioInicioBaixa,
      descricao: "Do início à primeira baixa definitiva",
      cor: "hsl(var(--primary))",
      maxDias: 1500,
    },
    {
      titulo: "Tempo Médio do Pendente",
      valor: dadosExibicao.tempoMedioPendente,
      descricao: "Processos ainda em tramitação",
      cor: "hsl(var(--destructive))",
      maxDias: 2000,
    },
    {
      titulo: "Tempo até Conclusão",
      valor: dadosExibicao.tempoMedioConclusao,
      descricao: "Do início até conclusão para sentença",
      cor: "hsl(var(--chart-2))",
      maxDias: 1200,
    },
    {
      titulo: "Tempo para Sentença",
      valor: dadosExibicao.tempoMedioSentenca,
      descricao: "Da conclusão até prolação da sentença",
      cor: "hsl(var(--chart-3))",
      maxDias: 800,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Tempos Processuais</h3>
        </div>
        <Badge variant={dadosExibicao.variacaoAnual < 0 ? "default" : "destructive"} className="gap-1">
          {dadosExibicao.variacaoAnual < 0 ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <TrendingUp className="w-3 h-3" />
          )}
          {Math.abs(dadosExibicao.variacaoAnual)}% vs ano anterior
        </Badge>
      </div>

      {/* Grid de círculos de tempo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tempos.map((tempo, index) => (
          <TempoCircular
            key={tempo.titulo}
            {...tempo}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Tabela comparativa por grau */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Comparativo por Grau de Jurisdição
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Tempo médio em dias desde o início até a baixa definitiva do processo
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <BarraTempo label="1º Grau" dias={1042} maxDias={1500} cor="hsl(var(--primary))" />
            <BarraTempo label="2º Grau" dias={654} maxDias={1500} cor="hsl(var(--chart-2))" />
            <BarraTempo label="Juizados" dias={238} maxDias={1500} cor="hsl(var(--chart-3))" />
            <BarraTempo label="Turmas Recursais" dias={186} maxDias={1500} cor="hsl(var(--chart-4))" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TempoCircularProps {
  titulo: string;
  valor: number;
  descricao: string;
  cor: string;
  maxDias: number;
  delay: number;
}

function TempoCircular({ titulo, valor, descricao, cor, maxDias, delay }: TempoCircularProps) {
  const porcentagem = Math.min((valor / maxDias) * 100, 100);
  const circunferencia = 2 * Math.PI * 45; // raio 45
  const offset = circunferencia - (porcentagem / 100) * circunferencia;

  const anos = Math.floor(valor / 365);
  const meses = Math.floor((valor % 365) / 30);
  const dias = valor % 30;

  let tempoFormatado = "";
  if (anos > 0) tempoFormatado += `${anos}a `;
  if (meses > 0) tempoFormatado += `${meses}m `;
  if (dias > 0 && anos === 0) tempoFormatado += `${dias}d`;
  tempoFormatado = tempoFormatado.trim() || `${valor}d`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="p-4 text-center hover:shadow-lg transition-shadow">
        <div className="relative w-28 h-28 mx-auto mb-3">
          <svg className="w-full h-full transform -rotate-90">
            {/* Círculo de fundo */}
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="none"
            />
            {/* Círculo de progresso */}
            <motion.circle
              cx="56"
              cy="56"
              r="45"
              stroke={cor}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              initial={{ strokeDashoffset: circunferencia }}
              animate={{ strokeDashoffset: offset }}
              transition={{ delay: delay + 0.2, duration: 1, ease: "easeOut" }}
            />
          </svg>
          {/* Valor central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5 }}
              className="text-lg font-bold"
              style={{ color: cor }}
            >
              {valor}
            </motion.span>
            <span className="text-[10px] text-muted-foreground">dias</span>
          </div>
        </div>
        
        <h4 className="text-xs font-medium text-foreground line-clamp-2 mb-1">
          {titulo}
        </h4>
        <p className="text-[10px] text-muted-foreground line-clamp-2">
          {descricao}
        </p>
        <Badge variant="outline" className="mt-2 text-[10px]">
          ≈ {tempoFormatado}
        </Badge>
      </Card>
    </motion.div>
  );
}

interface BarraTempoProps {
  label: string;
  dias: number;
  maxDias: number;
  cor: string;
}

function BarraTempo({ label, dias, maxDias, cor }: BarraTempoProps) {
  const porcentagem = Math.min((dias / maxDias) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{dias} dias</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${porcentagem}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: cor }}
        />
      </div>
    </div>
  );
}
