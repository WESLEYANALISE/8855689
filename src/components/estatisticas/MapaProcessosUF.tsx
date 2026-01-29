import { MapPin, Users, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EstadoData {
  uf: string;
  tribunal: string;
  processos: number;
  populacao: number;
  processosPerCapita: number;
}

interface MapaProcessosUFProps {
  data: EstadoData[];
  onExplicar?: (estado: EstadoData) => void;
}

const UF_NOMES: Record<string, string> = {
  'SP': 'São Paulo', 'RJ': 'Rio de Janeiro', 'MG': 'Minas Gerais',
  'RS': 'Rio Grande do Sul', 'PR': 'Paraná', 'SC': 'Santa Catarina',
  'BA': 'Bahia', 'PE': 'Pernambuco', 'CE': 'Ceará', 'GO': 'Goiás',
  'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul', 'PA': 'Pará', 'AM': 'Amazonas',
  'MA': 'Maranhão', 'PI': 'Piauí', 'RN': 'Rio Grande do Norte',
  'PB': 'Paraíba', 'SE': 'Sergipe', 'AL': 'Alagoas', 'RO': 'Rondônia',
  'AC': 'Acre', 'AP': 'Amapá', 'RR': 'Roraima', 'TO': 'Tocantins',
};

export function MapaProcessosUF({ data, onExplicar }: MapaProcessosUFProps) {
  const formatarNumero = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString("pt-BR");
  };

  const maxProcessos = Math.max(...data.map(e => e.processos));

  // Cores por intensidade
  const getCorIntensidade = (processos: number): string => {
    const porcentagem = processos / maxProcessos;
    if (porcentagem > 0.7) return 'bg-red-500';
    if (porcentagem > 0.4) return 'bg-orange-500';
    if (porcentagem > 0.2) return 'bg-yellow-500';
    if (porcentagem > 0.1) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Processos por Estado</h3>
            <p className="text-xs text-muted-foreground">Distribuição geográfica</p>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-muted-foreground">Alto</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-muted-foreground">Médio-Alto</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-muted-foreground">Médio</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Baixo</span>
        </div>
      </div>

      {/* Grid de estados */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto">
        {data.map((estado, index) => (
          <div
            key={estado.uf}
            className="group relative bg-muted/50 rounded-lg p-2 hover:bg-muted transition-colors cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 20}ms` }}
            onClick={() => onExplicar?.(estado)}
          >
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-lg ${getCorIntensidade(estado.processos)} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{estado.uf}</span>
              </div>
              {onExplicar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <HelpCircle className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="mt-1">
              <p className="text-xs font-medium text-foreground truncate">
                {UF_NOMES[estado.uf] || estado.uf}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatarNumero(estado.processos)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Estatísticas resumidas */}
      <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-foreground">
            {formatarNumero(data.reduce((acc, e) => acc + e.processos, 0))}
          </p>
          <p className="text-xs text-muted-foreground">Total Nacional</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">27</p>
          <p className="text-xs text-muted-foreground">Estados</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">
            {Math.round(data.reduce((acc, e) => acc + e.processosPerCapita, 0) / data.length)}
          </p>
          <p className="text-xs text-muted-foreground">Média per capita</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Fonte: Estimativa baseada em dados do CNJ</span>
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>Per capita = por 1000 hab.</span>
        </div>
      </div>
    </div>
  );
}