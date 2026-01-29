import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Statistic {
  label: string;
  value: string;
  change?: number;
  description?: string;
}

interface LegalStatisticsProps {
  stats: Statistic[];
  title?: string;
}

export const LegalStatistics = ({ stats, title }: LegalStatisticsProps) => {
  return (
    <div className="my-6">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          📈 {title}
        </h3>
      )}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="animate-scale-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mb-2 font-medium">
                  {stat.label}
                </div>
                {stat.change !== undefined && (
                  <div className={`flex items-center justify-center gap-1 text-xs font-semibold ${
                    stat.change > 0 ? 'text-green-600 dark:text-green-500' :
                    stat.change < 0 ? 'text-red-600 dark:text-red-500' : 
                    'text-muted-foreground'
                  }`}>
                    {stat.change > 0 ? <TrendingUp size={12} /> :
                     stat.change < 0 ? <TrendingDown size={12} /> :
                     <Minus size={12} />}
                    {Math.abs(stat.change)}%
                  </div>
                )}
                {stat.description && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {stat.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
