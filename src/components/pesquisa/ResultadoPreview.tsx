import { ChevronRight, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ResultadoItem } from "@/hooks/useBuscaGlobal";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";

interface ResultadoPreviewProps {
  item: ResultadoItem;
  iconColor?: string;
  showFullInfo?: boolean;
}

export const ResultadoPreview = ({ item, iconColor, showFullInfo = false }: ResultadoPreviewProps) => {
  const navigate = useNavigate();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleClick = () => {
    // Se o item é premium e o usuário não é premium, mostrar modal
    if (item.isPremium && !isPremium && !loadingSubscription) {
      setShowPremiumModal(true);
      return;
    }
    navigate(item.route);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full p-3 flex items-start gap-3 hover:bg-accent/5 transition-colors text-left group"
      >
        {item.imagem && (
          <div className="relative flex-shrink-0">
            <img 
              src={item.imagem} 
              alt={item.titulo}
              className="w-12 h-12 object-cover rounded-lg bg-secondary"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {item.isPremium && !isPremium && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        )}
        
        {!item.imagem && item.isPremium && !isPremium && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
            <Crown className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {item.extra && (
            <span className={cn("text-xs font-medium", iconColor || "text-primary")}>
              {item.extra}
            </span>
          )}
          <h4 className={cn(
            "font-medium text-foreground",
            showFullInfo ? "text-sm" : "text-sm line-clamp-1"
          )}>
            {item.titulo}
          </h4>
          {item.subtitulo && (
            <p className={cn(
              "text-xs text-muted-foreground mt-0.5",
              showFullInfo ? "" : "line-clamp-1"
            )}>
              {item.subtitulo}
            </p>
          )}
        </div>
        
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
      </button>
      
      <PremiumUpgradeModal
        open={showPremiumModal}
        onOpenChange={setShowPremiumModal}
        featureName="Este conteúdo"
      />
    </>
  );
};

export default ResultadoPreview;
