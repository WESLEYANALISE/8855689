import { 
  MessageSquare, 
  GraduationCap, 
  Bookmark, 
  FileQuestion, 
  Sparkles,
  X,
  Crown,
  Lock,
  BookOpen,
  HelpCircle
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isArticleFeatureAllowed, getFeatureBlockedMessage } from "@/lib/utils/premiumNarration";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

interface Article {
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

interface ArtigoActionsMenuProps {
  article: Article;
  codigoNome: string;
  onPlayNarration?: (audioUrl: string) => void;
  onPlayComment?: (audioUrl: string, title: string) => void;
  onOpenAula?: () => void;
  onOpenExplicacao?: (tipo: "explicacao" | "exemplo") => void;
  onGenerateFlashcards?: () => void;
  onOpenTermos?: () => void;
  onOpenQuestoes?: () => void;
  onPerguntar?: () => void;
  onOpenAulaArtigo?: () => void;
  loadingFlashcards?: boolean;
  isCommentPlaying?: boolean;
  isEmbedded?: boolean;
  onShowPremiumCard?: () => void;
}

export const ArtigoActionsMenu = ({
  article,
  codigoNome,
  onPlayComment,
  onOpenAula,
  onOpenExplicacao,
  onGenerateFlashcards,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onOpenAulaArtigo,
  loadingFlashcards = false,
  isEmbedded = false,
  onShowPremiumCard,
}: ArtigoActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const { isPremium } = useSubscription();
  const numeroArtigo = article["Número do Artigo"] || "";
  const canUseResources = isArticleFeatureAllowed(numeroArtigo, isPremium, codigoNome);

  const handleAction = (action: () => void) => {
    if (!canUseResources) {
      onShowPremiumCard?.();
      if (!isEmbedded) {
        setIsOpen(false);
      }
      return;
    }
    action();
    if (!isEmbedded) {
      setIsOpen(false);
    }
  };

  const recursos = [
    {
      icon: BookOpen,
      label: "Leitura",
      description: "Leia e estude o artigo com explicações detalhadas",
      action: onOpenExplicacao ? () => onOpenExplicacao("explicacao") : undefined,
      show: !!onOpenExplicacao,
      highlight: false
    },
    {
      icon: GraduationCap,
      label: "Aula Interativa",
      description: "Aprenda tudo sobre este artigo com aula completa",
      action: onOpenAulaArtigo,
      show: !!onOpenAulaArtigo,
      highlight: true
    },
    {
      icon: Bookmark,
      label: "Flashcards",
      description: loadingFlashcards ? "Gerando flashcards..." : "Crie flashcards para memorização",
      action: onGenerateFlashcards,
      show: !!onGenerateFlashcards,
      disabled: loadingFlashcards
    },
    {
      icon: HelpCircle,
      label: "Questões",
      description: "Pratique com questões sobre o artigo",
      action: onOpenQuestoes,
      show: !!onOpenQuestoes
    },
    {
      icon: MessageSquare,
      label: "Perguntar",
      description: "Converse com a professora sobre este artigo",
      action: onPerguntar,
      show: !!onPerguntar
    },
  ].filter(item => item.show);

  const RecursosContent = () => (
    <div className="space-y-2">
      {!canUseResources && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-3">
          <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-amber-500">Recursos Premium</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disponível para artigos 1-5. Assine para acesso completo.
            </p>
          </div>
        </div>
      )}
      {recursos.map((recurso, index) => {
        const Icon = recurso.icon;
        const isHighlight = 'highlight' in recurso && recurso.highlight;
        const isBlocked = !canUseResources;
        return (
          <button
            key={index}
            onClick={() => recurso.action && handleAction(recurso.action)}
            disabled={recurso.disabled}
            className={`action-button w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:scale-100 text-left ${
              isBlocked
                ? 'bg-muted/50 border border-border/50 opacity-60'
                : isHighlight 
                  ? 'bg-gradient-to-r from-[hsl(45,93%,58%)] to-[hsl(45,88%,52%)] text-black border-none'
                  : 'bg-gradient-to-r from-[hsl(45,93%,58%)]/10 to-[hsl(45,93%,58%)]/20 hover:from-[hsl(45,93%,58%)]/20 hover:to-[hsl(45,93%,58%)]/30 text-foreground border border-[hsl(45,93%,58%)]/40'
            }`}
          >
            {isBlocked ? (
              <Lock className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
            ) : (
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isHighlight ? 'text-black' : 'text-[hsl(45,93%,58%)]'}`} />
            )}
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${isBlocked ? 'text-muted-foreground' : isHighlight ? 'text-black' : 'text-foreground'}`}>{recurso.label}</div>
              <div className={`text-xs mt-0.5 ${isBlocked ? 'text-muted-foreground/70' : isHighlight ? 'text-black/70' : 'text-muted-foreground'}`}>{recurso.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );

  // Modo embedded: apenas renderiza os botões sem Dialog
  if (isEmbedded) {
    return <RecursosContent />;
  }

  // Modo normal: com Dialog
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-[hsl(45,93%,58%)]/10 to-[hsl(45,93%,58%)]/20 hover:from-[hsl(45,93%,58%)]/20 hover:to-[hsl(45,93%,58%)]/30 text-foreground border-[hsl(45,93%,58%)]/40 font-semibold transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
          variant="outline"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          <span className="text-sm">Recursos do Artigo</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px] animate-scale-in max-h-[80vh] overflow-y-auto">
        <DialogHeader className="relative pr-8">
          <DialogTitle className="flex items-start gap-2 text-lg leading-tight">
            <Sparkles className="w-5 h-5 text-[hsl(45,93%,58%)] mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold">Recursos do Art. {article["Número do Artigo"]}</div>
              <div className="text-sm font-normal text-muted-foreground mt-0.5">{codigoNome}</div>
            </div>
          </DialogTitle>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-0 top-0 rounded-full p-1.5 hover:bg-accent/20 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </DialogHeader>
        
        <div className="py-4">
          <RecursosContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};
