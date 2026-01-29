import { Crown, Infinity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDailyLimitInfo } from "@/hooks/useDailyLimit";
import { cn } from "@/lib/utils";

interface DailyLimitBadgeProps {
  feature: string;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "default";
}

export const DailyLimitBadge = ({ 
  feature, 
  showIcon = true, 
  className,
  size = "default"
}: DailyLimitBadgeProps) => {
  const { usedToday, limitToday, remainingUses, isUnlimited, loading } = useDailyLimitInfo(feature);

  if (loading) {
    return (
      <Badge variant="outline" className={cn("animate-pulse", className)}>
        <span className="opacity-50">...</span>
      </Badge>
    );
  }

  // Premium com uso ilimitado
  if (isUnlimited) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "bg-accent/10 text-accent border-accent/30",
          size === "sm" && "text-xs px-2 py-0.5",
          className
        )}
      >
        {showIcon && <Crown className={cn("mr-1", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
        <Infinity className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
      </Badge>
    );
  }

  // Determinar cor baseada no uso
  const percentUsed = (usedToday / limitToday) * 100;
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let colorClass = "bg-muted/50 text-muted-foreground border-border";

  if (remainingUses === 0) {
    variant = "destructive";
    colorClass = "bg-destructive/10 text-destructive border-destructive/30";
  } else if (percentUsed >= 70) {
    colorClass = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
  } else {
    colorClass = "bg-accent/10 text-accent border-accent/30";
  }

  return (
    <Badge 
      variant="outline"
      className={cn(
        colorClass,
        size === "sm" && "text-xs px-2 py-0.5",
        className
      )}
    >
      <span className="font-medium">{remainingUses}/{limitToday}</span>
      <span className={cn("ml-1 opacity-80", size === "sm" ? "text-[10px]" : "text-xs")}>hoje</span>
    </Badge>
  );
};

// Versão inline para usar em textos
export const DailyLimitText = ({ feature }: { feature: string }) => {
  const { remainingUses, limitToday, isUnlimited, loading } = useDailyLimitInfo(feature);

  if (loading) return <span className="text-muted-foreground">...</span>;
  
  if (isUnlimited) {
    return <span className="text-accent font-medium">Ilimitado</span>;
  }

  const colorClass = remainingUses === 0 
    ? "text-destructive" 
    : remainingUses <= 2 
      ? "text-yellow-600 dark:text-yellow-400" 
      : "text-accent";

  return (
    <span className={cn("font-medium", colorClass)}>
      {remainingUses} de {limitToday} restantes hoje
    </span>
  );
};
