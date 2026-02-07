import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  position?: "top-right" | "top-left" | "center";
}

export const PremiumBadge = ({ 
  className, 
  size = "md", 
  position = "top-right" 
}: PremiumBadgeProps) => {
  const sizeClasses = {
    sm: "w-5 h-5 p-1",
    md: "w-7 h-7 p-1.5",
    lg: "w-9 h-9 p-2"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const positionClasses = {
    "top-right": "absolute top-2 right-2",
    "top-left": "absolute top-2 left-2",
    "center": "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  };

  return (
    <div 
      className={cn(
        positionClasses[position],
        sizeClasses[size],
        "bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 z-20",
        className
      )}
    >
      <Crown className={cn(iconSizes[size], "text-white")} />
    </div>
  );
};
