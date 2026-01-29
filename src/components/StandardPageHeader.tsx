import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface StandardPageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  backPath?: string;
  onBack?: () => void;
  icon?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
  position?: "sticky" | "fixed";
}

export const StandardPageHeader = ({
  title,
  subtitle,
  backPath,
  onBack,
  icon,
  rightAction,
  className = "",
  position = "sticky",
}: StandardPageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={`${
        position === "fixed" ? "fixed inset-x-0 top-0" : "sticky top-0"
      } z-20 bg-background border-b border-border/30 ${className}`}
    >
      {/* Cobrir a safe-area (iOS) sem “vão” mostrando o fundo */}
      <div className="h-[env(safe-area-inset-top)] bg-background" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          
          {icon && (
            <div className="shrink-0">
              {icon}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground text-sm truncate">
                {subtitle}
              </p>
            )}
          </div>
          
          {rightAction && (
            <div className="shrink-0">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StandardPageHeader;
