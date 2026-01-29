import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface AppStatisticsCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  color: string;
  delay?: number;
  onClick?: () => void;
}

export const AppStatisticsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  color,
  delay = 0,
  onClick
}: AppStatisticsCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const duration = 1500;
      const increment = value / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return (
    <Card 
      className={`p-6 hover:shadow-lg transition-all hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <div className="text-4xl font-bold text-foreground mb-2">
            {displayValue.toLocaleString('pt-BR')}
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>
    </Card>
  );
};
