import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Flame, 
  BookOpen, 
  Trophy, 
  TrendingUp,
  Clock
} from "lucide-react";

interface JornadaEstatisticasProps {
  diasCompletos: number;
  totalDias: number;
  streakAtual: number;
  maiorStreak: number;
  artigosPorDia: number;
  area: string;
}

export const JornadaEstatisticas = ({
  diasCompletos,
  totalDias,
  streakAtual,
  maiorStreak,
  artigosPorDia,
  area,
}: JornadaEstatisticasProps) => {
  const progressoPercent = Math.round((diasCompletos / totalDias) * 100);
  const diasRestantes = totalDias - diasCompletos;
  const tempoEstimado = diasRestantes * 15; // 15 min por dia

  const stats = [
    {
      icon: Calendar,
      label: "Dias Completos",
      value: diasCompletos,
      subtext: `de ${totalDias}`,
      color: "text-blue-500",
    },
    {
      icon: Flame,
      label: "Streak Atual",
      value: streakAtual,
      subtext: "dias seguidos",
      color: "text-orange-500",
    },
    {
      icon: Trophy,
      label: "Maior Streak",
      value: maiorStreak,
      subtext: "seu recorde",
      color: "text-yellow-500",
    },
    {
      icon: BookOpen,
      label: "Artigos/Dia",
      value: artigosPorDia,
      subtext: area,
      color: "text-green-500",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Progresso geral */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Conclusão</span>
            <span className="font-bold">{progressoPercent}%</span>
          </div>
          <Progress value={progressoPercent} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{diasCompletos} dias feitos</span>
            <span>{diasRestantes} dias restantes</span>
          </div>
        </CardContent>
      </Card>

      {/* Grid de stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/60">{stat.subtext}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tempo estimado */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Tempo restante estimado</p>
              <p className="text-xs text-muted-foreground">~15 min/dia</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">{Math.round(tempoEstimado / 60)}h</p>
            <p className="text-xs text-muted-foreground">{diasRestantes} dias</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
