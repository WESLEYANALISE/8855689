import React from "react";
import { Handshake, TrendingUp, DollarSign, Users, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DadosConciliacao {
  taxaConciliacao: number;
  acordosRealizados: number;
  economiaEstimada: number;
  mediasRealizadas: number;
  taxaSucessoMediacao: number;
  cejuscAtivos: number;
}

interface PainelConciliacaoProps {
  dados: DadosConciliacao | null;
  isLoading: boolean;
}

export function PainelConciliacao({ dados, isLoading }: PainelConciliacaoProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-xl" />
        ))}
      </div>
    );
  }

  const dadosExibicao = dados || {
    taxaConciliacao: 12.5,
    acordosRealizados: 3200000,
    economiaEstimada: 15000000000,
    mediasRealizadas: 890000,
    taxaSucessoMediacao: 68.5,
    cejuscAtivos: 1247,
  };

  const formatarNumero = (num: number) => {
    if (num >= 1000000000) return `R$ ${(num / 1000000000).toFixed(1)} bi`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} mi`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)} mil`;
    return num.toString();
  };

  const cards = [
    {
      titulo: "Taxa de Conciliação",
      valor: `${dadosExibicao.taxaConciliacao}%`,
      descricao: "Processos resolvidos por acordo",
      icon: Handshake,
      cor: "bg-green-500/10 text-green-500",
      tendencia: "+1.2%",
      tendenciaPositiva: true,
    },
    {
      titulo: "Acordos Realizados",
      valor: formatarNumero(dadosExibicao.acordosRealizados),
      descricao: "Total de acordos no período",
      icon: Award,
      cor: "bg-primary/10 text-primary",
      tendencia: "+8.5%",
      tendenciaPositiva: true,
    },
    {
      titulo: "Economia Estimada",
      valor: formatarNumero(dadosExibicao.economiaEstimada),
      descricao: "Economia para o sistema judiciário",
      icon: DollarSign,
      cor: "bg-amber-500/10 text-amber-500",
      tendencia: "+12%",
      tendenciaPositiva: true,
    },
    {
      titulo: "Mediações Realizadas",
      valor: formatarNumero(dadosExibicao.mediasRealizadas),
      descricao: "Sessões de mediação",
      icon: Users,
      cor: "bg-blue-500/10 text-blue-500",
      tendencia: "+5.3%",
      tendenciaPositiva: true,
    },
    {
      titulo: "Taxa de Sucesso",
      valor: `${dadosExibicao.taxaSucessoMediacao}%`,
      descricao: "Mediações com acordo",
      icon: TrendingUp,
      cor: "bg-purple-500/10 text-purple-500",
      tendencia: "+2.1%",
      tendenciaPositiva: true,
    },
    {
      titulo: "CEJUSCs Ativos",
      valor: dadosExibicao.cejuscAtivos.toString(),
      descricao: "Centros de conciliação",
      icon: Handshake,
      cor: "bg-teal-500/10 text-teal-500",
      tendencia: "+45",
      tendenciaPositiva: true,
    },
  ];

  // Dados para gráfico de barras por área
  const conciliacaoPorArea = [
    { area: "Família", taxa: 42.5, total: 850000 },
    { area: "Cível", taxa: 15.2, total: 1200000 },
    { area: "Consumidor", taxa: 28.3, total: 680000 },
    { area: "Trabalhista", taxa: 35.8, total: 420000 },
    { area: "Fazenda Pública", taxa: 8.2, total: 50000 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Handshake className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Conciliação e Mediação</h3>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => (
          <div key={card.titulo} className="animate-fade-in">
            <Card className="p-3 h-full hover:shadow-lg transition-shadow">
              <div className={`p-2 rounded-lg w-fit ${card.cor} mb-2`}>
                <card.icon className="w-4 h-4" />
              </div>
              <h4 className="text-[11px] text-muted-foreground mb-1 line-clamp-1">
                {card.titulo}
              </h4>
              <div className="text-lg font-bold mb-1">{card.valor}</div>
              <div className="flex items-center gap-1">
                <Badge 
                  variant="outline" 
                  className={`text-[9px] ${card.tendenciaPositiva ? 'text-green-500' : 'text-red-500'}`}
                >
                  {card.tendenciaPositiva ? '↑' : '↓'} {card.tendencia}
                </Badge>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Gráfico por área */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-medium">
            Taxa de Conciliação por Área do Direito
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4">
            {conciliacaoPorArea.map((item) => (
              <div key={item.area} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.area}</span>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground text-xs">
                      {formatarNumero(item.total)} acordos
                    </span>
                    <span className="font-bold text-primary">{item.taxa}%</span>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
                    style={{ width: `${item.taxa}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Semana da Conciliação */}
      <Card className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-green-500/20">
            <Handshake className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Semana Nacional da Conciliação</h4>
            <p className="text-xs text-muted-foreground">
              Evento anual que concentra mutirões de conciliação em todo o país
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-500">345 mil</div>
            <div className="text-xs text-muted-foreground">acordos em 2024</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
