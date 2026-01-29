import { Card, CardContent } from "@/components/ui/card";
import { Scale } from "lucide-react";

interface AreaCardProps {
  area: string;
  temasCount: number;
  isSelected: boolean;
  onClick: () => void;
  index?: number;
}

export const AreaCard = ({ area, temasCount, isSelected, onClick, index = 0 }: AreaCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:scale-105 animate-fade-in ${
        isSelected
          ? 'border-2 border-primary shadow-lg bg-primary/10'
          : 'border-2 border-transparent hover:border-accent/50'
      }`}
      onClick={onClick}
      style={{
        animationDelay: `${index * 0.1}s`,
        animationFillMode: 'backwards'
      }}
    >
      <CardContent className="p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
          <Scale className="w-6 h-6 text-primary" />
        </div>
        <p className="font-semibold text-foreground mb-1">{area}</p>
        <p className="text-xs text-muted-foreground">{temasCount} temas disponíveis</p>
      </CardContent>
    </Card>
  );
};
