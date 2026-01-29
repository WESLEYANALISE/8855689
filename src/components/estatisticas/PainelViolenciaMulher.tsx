import { ShieldAlert, AlertTriangle, FileText, Clock, CheckCircle2 } from "lucide-react";

// Dados oficiais do Painel de Violência contra a Mulher
const DADOS_VIOLENCIA = {
  medidasProtetivas: 650000,
  inqueritosPoliciais: 380000,
  acoesProcessadas: 420000,
  feminicidios: 1400,
  tempoMedioMedida: 48, // horas
  taxaCumprimento: 72,
  processosAtivos: 1200000,
  percentualTotal: 3.5,
  distribuicaoTipos: [
    { tipo: "Violência física", quantidade: 480000, percentual: 40 },
    { tipo: "Violência psicológica", quantidade: 360000, percentual: 30 },
    { tipo: "Ameaça", quantidade: 240000, percentual: 20 },
    { tipo: "Violência patrimonial", quantidade: 72000, percentual: 6 },
    { tipo: "Violência sexual", quantidade: 48000, percentual: 4 },
  ],
};

export function PainelViolenciaMulher() {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString("pt-BR");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-pink-500" />
        <div>
          <h3 className="font-semibold text-foreground">Violência Contra a Mulher</h3>
          <p className="text-xs text-muted-foreground">Lei Maria da Penha - 11.340/2006</p>
        </div>
      </div>

      {/* Alerta destaque */}
      <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 text-pink-500 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Feminicídios em 2024</span>
        </div>
        <div className="text-3xl font-bold text-foreground">{DADOS_VIOLENCIA.feminicidios.toLocaleString("pt-BR")}</div>
        <p className="text-xs text-muted-foreground mt-1">Casos julgados pelo Tribunal do Júri</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <FileText className="w-4 h-4 text-pink-500 mb-1" />
          <div className="text-xl font-bold text-foreground">{formatNumber(DADOS_VIOLENCIA.medidasProtetivas)}</div>
          <div className="text-xs text-muted-foreground">Medidas protetivas</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <Clock className="w-4 h-4 text-blue-500 mb-1" />
          <div className="text-xl font-bold text-foreground">{DADOS_VIOLENCIA.tempoMedioMedida}h</div>
          <div className="text-xs text-muted-foreground">Tempo médio expedição</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-green-500 mb-1" />
          <div className="text-xl font-bold text-foreground">{DADOS_VIOLENCIA.taxaCumprimento}%</div>
          <div className="text-xs text-muted-foreground">Taxa de cumprimento</div>
        </div>
      </div>

      {/* Tipos de violência */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Tipos de violência</h4>
        {DADOS_VIOLENCIA.distribuicaoTipos.map((item, index) => (
          <div
            key={item.tipo}
            className="space-y-1 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.tipo}</span>
              <span className="font-medium text-foreground">{item.percentual}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full transition-all duration-700"
                style={{ width: `${item.percentual}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm pt-2 border-t border-border">
        <div>
          <span className="text-muted-foreground">Processos ativos:</span>
          <span className="font-bold text-foreground ml-1">{formatNumber(DADOS_VIOLENCIA.processosAtivos)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Do total:</span>
          <span className="font-bold text-foreground ml-1">{DADOS_VIOLENCIA.percentualTotal}%</span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Fonte: CNJ - Painel de Monitoramento da Política Judiciária de Enfrentamento à Violência contra a Mulher
      </div>
    </div>
  );
}
