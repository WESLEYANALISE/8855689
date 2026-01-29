import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { HelpCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileTooltipSheet } from "./MobileTooltipSheet";

interface BarChartData {
  nome: string;
  valor: number;
  cor?: string;
  sigla?: string;
}

interface AnimatedBarChartProps {
  data: BarChartData[];
  titulo?: string;
  subtitulo?: string;
  onItemClick?: (item: BarChartData) => void;
  onExplicar?: (item: BarChartData) => void;
  horizontal?: boolean;
  altura?: number;
}

const CORES_PADRAO = [
  "#ea384c",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

export function AnimatedBarChart({
  data,
  titulo,
  subtitulo,
  onItemClick,
  onExplicar,
  horizontal = false,
  altura = 300,
}: AnimatedBarChartProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BarChartData | null>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const formatarValor = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString("pt-BR");
  };

  const handleBarClick = (data: BarChartData) => {
    if (isTouchDevice) {
      setSelectedItem(data);
    } else {
      onItemClick?.(data);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    // No tooltip on touch devices - use bottom sheet instead
    if (isTouchDevice) return null;
    
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-foreground">{item.nome}</p>
          <p className="text-primary font-bold text-lg">
            {formatarValor(item.valor)} processos
          </p>
          {onExplicar && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onExplicar(item);
              }}
            >
              <Lightbulb className="w-3 h-3 text-yellow-500" />
              Entender
            </Button>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg animate-fade-in">
      {(titulo || subtitulo) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {titulo && (
              <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
            )}
            {subtitulo && (
              <p className="text-sm text-muted-foreground">{subtitulo}</p>
            )}
          </div>
          {onExplicar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-yellow-500 hover:text-yellow-400"
              onClick={() => onExplicar(data[0])}
              title="Explicar gráfico"
            >
              <Lightbulb className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Indicador para mobile */}
      {isTouchDevice && (
        <p className="text-xs text-muted-foreground text-center mb-2">
          👆 Toque nas barras para ver detalhes
        </p>
      )}

      <ResponsiveContainer width="100%" height={altura}>
        {horizontal ? (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              type="number" 
              tickFormatter={formatarValor}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis 
              type="category" 
              dataKey="sigla" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="valor"
              radius={[0, 4, 4, 0]}
              onClick={(data) => handleBarClick(data)}
              cursor="pointer"
              style={{ minHeight: 44 }} // Touch-friendly size
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.cor || CORES_PADRAO[index % CORES_PADRAO.length]}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="sigla" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis 
              tickFormatter={formatarValor}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="valor"
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleBarClick(data)}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.cor || CORES_PADRAO[index % CORES_PADRAO.length]}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Mobile Bottom Sheet */}
      {selectedItem && (
        <MobileTooltipSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onExplicar={onExplicar}
        />
      )}
    </div>
  );
}
