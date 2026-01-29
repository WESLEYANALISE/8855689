import { AlertCircle, Lightbulb, CheckCircle, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

interface HighlightedBoxProps {
  type: 'warning' | 'important' | 'tip' | 'note';
  children: React.ReactNode;
}

export const HighlightedBox = ({ type, children }: HighlightedBoxProps) => {
  const config = {
    warning: {
      icon: AlertCircle,
      bgLight: "bg-amber-500/20 dark:bg-amber-600/25",
      borderLight: "border-amber-500/40 dark:border-amber-400/40",
      iconColor: "text-amber-600 dark:text-amber-300",
      textColor: "text-foreground",
      title: "⚠️ Atenção"
    },
    important: {
      icon: Lightbulb,
      bgLight: "bg-purple-500/20 dark:bg-purple-600/25",
      borderLight: "border-purple-500/40 dark:border-purple-400/40",
      iconColor: "text-purple-600 dark:text-purple-300",
      textColor: "text-foreground",
      title: "💡 Importante"
    },
    tip: {
      icon: CheckCircle,
      bgLight: "bg-emerald-500/20 dark:bg-emerald-600/25",
      borderLight: "border-emerald-500/40 dark:border-emerald-400/40",
      iconColor: "text-emerald-600 dark:text-emerald-300",
      textColor: "text-foreground",
      title: "✅ Dica"
    },
    note: {
      icon: Pin,
      bgLight: "bg-blue-500/20 dark:bg-blue-600/25",
      borderLight: "border-blue-500/40 dark:border-blue-400/40",
      iconColor: "text-blue-600 dark:text-blue-300",
      textColor: "text-foreground",
      title: "📌 Nota"
    }
  };

  const { icon: Icon, bgLight, borderLight, iconColor, textColor, title } = config[type];

  return (
    <div 
      className={cn(
        "my-4 rounded-lg border-2 p-4 shadow-sm",
        bgLight,
        borderLight
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", iconColor)} />
        <div className="flex-1 space-y-2">
          <p className={cn("font-semibold text-sm", iconColor)}>{title}</p>
          <div className={cn("text-sm leading-relaxed", textColor)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
