import { Card } from "@/components/ui/card";

interface Statistic {
  label: string;
  value: string;
  icon: string;
}

interface StatisticsCardProps {
  stats: Statistic[];
}

export function StatisticsCard({ stats }: StatisticsCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 bg-accent/50 border-accent">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{stat.icon}</div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase font-medium">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {stat.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
