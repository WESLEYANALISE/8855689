import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileTooltipSheet } from "./MobileTooltipSheet";

interface PieChartData {
  nome: string;
  quantidade: number;
  percentual?: number;
  cor?: string;
}

interface AnimatedPieChartProps {
  data: PieChartData[];
  titulo?: string;
  subtitulo?: string;
  onItemClick?: (item: PieChartData) => void;
  onExplicar?: (item: PieChartData) => void;
  altura?: number;
  mostrarLegenda?: boolean;
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

export function AnimatedPieChart({
  data,
  titulo,
  subtitulo,
  onItemClick,
  onExplicar,
  altura = 300,
  mostrarLegenda = true,
}: AnimatedPieChartProps) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PieChartData | null>(null);

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

  // Calcular percentuais se não existirem
  const total = data.reduce((acc, item) => acc + item.quantidade, 0);
  const dataComPercentual = data.map((item) => ({
    ...item,
    percentual: item.percentual ?? Math.round((item.quantidade / total) * 100),
  }));

  const handlePieClick = (data: PieChartData) => {
    if (isTouchDevice) {
      setSelectedItem(data);
    } else {
      onItemClick?.(data);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    // No tooltip on touch devices - use bottom sheet instead
    if (isTouchDevice) return null;

    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-foreground">{item.nome}</p>
          <p className="text-primary font-bold text-lg">
            {formatarValor(item.quantidade)}
          </p>
          <p className="text-sm text-muted-foreground">
            {item.percentual}% do total
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

  const CustomLegend = ({ payload }: any) => {
    if (!mostrarLegenda) return null;
    
    return (
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 px-1">
        {payload?.map((entry: any, index: number) => (
          <button
            key={`legend-${index}`}
            className="flex items-center gap-1 py-1 px-1 rounded hover:bg-muted/50 transition-colors text-left min-h-[44px]"
            onClick={() => {
              if (isTouchDevice) {
                setSelectedItem(dataComPercentual[index]);
              } else {
                onItemClick?.(dataComPercentual[index]);
              }
            }}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
              {entry.value}
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-xl p-4 shadow-lg relative"
    >
      {(titulo || subtitulo) && (
        <div className="mb-2 flex items-start justify-between">
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
          👆 Toque nas fatias ou legendas para ver detalhes
        </p>
      )}

      <ResponsiveContainer width="100%" height={altura}>
        <PieChart>
          <Pie
            data={dataComPercentual}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="quantidade"
            nameKey="nome"
            onClick={(data) => handlePieClick(data)}
            cursor="pointer"
            animationBegin={0}
            animationDuration={1000}
          >
            {dataComPercentual.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.cor || CORES_PADRAO[index % CORES_PADRAO.length]}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Mobile Bottom Sheet */}
      {selectedItem && (
        <MobileTooltipSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onExplicar={onExplicar}
        />
      )}
    </motion.div>
  );
}
