import { useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  MessageSquare, 
  GraduationCap, 
  Lightbulb, 
  BookOpen, 
  FileQuestion,
  Layers,
  Copy,
  Check,
  Play,
  StickyNote,
  Crown,
  Lock
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { isNarrationAllowed, getNarrationBlockedMessage, isArticleFeatureAllowed, getFeatureBlockedMessage } from '@/lib/utils/premiumNarration';
import { PremiumFloatingCard } from '@/components/PremiumFloatingCard';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatTextWithUppercase } from '@/lib/textFormatter';
import { toast } from 'sonner';
import { AnotacaoDrawer } from './AnotacaoDrawer';
import { useArtigoAnotacoes } from '@/hooks/useArtigoAnotacoes';
interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração"?: string | null;
  "Comentario"?: string | null;
  "Aula"?: string | null;
}

interface VadeMecumDetailPanelProps {
  article: Article;
  codeName: string;
  tableName: string;
  onPlayAudio?: (url: string, title: string) => void;
  onOpenExplicacao?: (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => void;
  onOpenAula?: (article: Article) => void;
  onOpenTermos?: (artigo: string, numeroArtigo: string) => void;
  onOpenQuestoes?: (artigo: string, numeroArtigo: string) => void;
  onPerguntar?: (artigo: string, numeroArtigo: string) => void;
  onOpenAulaArtigo?: (artigo: string, numeroArtigo: string) => void;
  onGenerateFlashcards?: (artigo: string, numeroArtigo: string) => void;
  loadingFlashcards?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  currentIndex: number;
  totalCount: number;
}

export const VadeMecumDetailPanel = ({
  article,
  codeName,
  tableName,
  onPlayAudio,
  onOpenExplicacao,
  onOpenAula,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onOpenAulaArtigo,
  onGenerateFlashcards,
  loadingFlashcards,
  onPrevious,
  onNext,
  currentIndex,
  totalCount
}: VadeMecumDetailPanelProps) => {
  const [copied, setCopied] = useState(false);
  const [anotacaoOpen, setAnotacaoOpen] = useState(false);
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const [premiumCardMessage, setPremiumCardMessage] = useState({ title: '', description: '' });
  
  const { isPremium } = useSubscription();
  
  const numeroArtigo = article["Número do Artigo"] || '';
  const conteudo = article["Artigo"] || 'Conteúdo não disponível';
  const hasAudio = !!article["Narração"];
  const hasAula = !!article["Aula"];
  
  // Verificar se narração é permitida para este artigo
  const canPlayNarration = isNarrationAllowed(numeroArtigo, isPremium, codeName);
  const narrationBlocked = hasAudio && !canPlayNarration;
  
  // Verificar se recursos são permitidos
  const canUseFeatures = isArticleFeatureAllowed(numeroArtigo, isPremium, codeName);

  // Hook para verificar se tem anotação
  const { hasAnotacao } = useArtigoAnotacoes({
    tabelaCodigo: tableName,
    numeroArtigo,
    artigoId: article.id
  });

  const handleCopy = async () => {
    const text = `Art. ${numeroArtigo} - ${codeName}\n\n${conteudo}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Artigo copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = () => {
    // Verificar se narração está bloqueada para não-premium
    if (narrationBlocked) {
      const msg = getNarrationBlockedMessage();
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    
    if (article["Narração"] && onPlayAudio) {
      onPlayAudio(article["Narração"], `Art. ${numeroArtigo}`);
    }
  };

  const handleFeatureClick = (feature: 'anotacao' | 'recurso', callback?: () => void) => {
    if (!canUseFeatures) {
      const msg = getFeatureBlockedMessage(feature);
      setPremiumCardMessage(msg);
      setShowPremiumCard(true);
      return;
    }
    callback?.();
  };

  // Botões de ação com tooltips - ícones sempre normais, premium card aparece ao clicar
  const actionButtons = [
    {
      icon: Volume2,
      label: 'Ouvir artigo',
      onClick: handlePlayAudio,
      disabled: !hasAudio && !narrationBlocked,
      show: true,
      color: hasAudio ? 'text-green-500' : 'text-muted-foreground',
      blocked: false
    },
    {
      icon: GraduationCap,
      label: 'Aula em vídeo',
      onClick: () => handleFeatureClick('recurso', () => onOpenAula?.(article)),
      disabled: !hasAula && canUseFeatures,
      show: !!onOpenAula,
      color: hasAula ? 'text-blue-500' : 'text-muted-foreground',
      blocked: false
    },
    {
      icon: Lightbulb,
      label: 'Explicação técnica',
      onClick: () => handleFeatureClick('recurso', () => onOpenExplicacao?.(conteudo, numeroArtigo, 'explicacao', 'tecnico')),
      disabled: false,
      show: !!onOpenExplicacao,
      color: 'text-yellow-500',
      blocked: false
    },
    {
      icon: BookOpen,
      label: 'Ver termos',
      onClick: () => handleFeatureClick('recurso', () => onOpenTermos?.(conteudo, numeroArtigo)),
      disabled: false,
      show: !!onOpenTermos,
      color: 'text-purple-500',
      blocked: false
    },
    {
      icon: FileQuestion,
      label: 'Questões',
      onClick: () => handleFeatureClick('recurso', () => onOpenQuestoes?.(conteudo, numeroArtigo)),
      disabled: false,
      show: !!onOpenQuestoes,
      color: 'text-orange-500',
      blocked: false
    },
    {
      icon: Layers,
      label: 'Flashcards',
      onClick: () => handleFeatureClick('recurso', () => onGenerateFlashcards?.(conteudo, numeroArtigo)),
      disabled: loadingFlashcards,
      show: !!onGenerateFlashcards,
      color: 'text-pink-500',
      blocked: false
    },
    {
      icon: MessageSquare,
      label: 'Perguntar',
      onClick: () => handleFeatureClick('recurso', () => onPerguntar?.(conteudo, numeroArtigo)),
      disabled: false,
      show: !!onPerguntar,
      color: 'text-cyan-500',
      blocked: false
    },
    {
      icon: Play,
      label: 'Aula interativa',
      onClick: () => handleFeatureClick('recurso', () => onOpenAulaArtigo?.(conteudo, numeroArtigo)),
      disabled: false,
      show: !!onOpenAulaArtigo,
      color: 'text-red-500',
      blocked: false
    },
    {
      icon: StickyNote,
      label: hasAnotacao ? 'Ver anotações' : 'Adicionar anotação',
      onClick: () => handleFeatureClick('anotacao', () => setAnotacaoOpen(true)),
      disabled: false,
      show: true,
      color: hasAnotacao ? 'text-amber-500' : 'text-muted-foreground',
      blocked: false
    }
  ].filter(btn => btn.show);

  return (
    <div className="h-full flex flex-col">
      {/* Navegação entre artigos */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/30">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onPrevious}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Artigo anterior (↑ ou K)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="text-sm text-muted-foreground font-medium">
          {currentIndex + 1} de {totalCount}
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onNext}
                className="h-9 w-9"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Próximo artigo (↓ ou J)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Conteúdo do artigo */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Header do artigo */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">
                Art. {numeroArtigo}
              </h2>
              <span className="text-sm text-muted-foreground">{codeName}</span>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="h-10 w-10"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar artigo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Indicadores de disponibilidade */}
          <div className="flex items-center gap-3 mb-6">
            {hasAudio && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-2 font-medium">
                <Volume2 className="h-4 w-4" /> Áudio disponível
              </span>
            )}
            {hasAula && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-2 font-medium">
                <GraduationCap className="h-4 w-4" /> Videoaula
              </span>
            )}
            {!canUseFeatures && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-2 font-medium">
                <Crown className="h-4 w-4" /> Recursos Premium
              </span>
            )}
          </div>

          {/* Texto do artigo */}
          <div 
            className="prose prose-lg prose-invert max-w-none article-content leading-relaxed whitespace-pre-line"
            style={{ fontSize: '16px', lineHeight: '1.8' }}
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHtml(formatTextWithUppercase(conteudo)) 
            }}
          />

          <Separator className="my-8" />

          {/* Ações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Ferramentas de estudo
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {actionButtons.map((btn, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={btn.onClick}
                        disabled={btn.disabled}
                        className={cn(
                          "justify-start h-11 relative",
                          btn.disabled && "opacity-50 cursor-not-allowed",
                          btn.blocked && "opacity-70"
                        )}
                      >
                        {btn.blocked && (
                          <Lock className="h-3 w-3 absolute top-1 right-1 text-muted-foreground" />
                        )}
                        <btn.icon className={cn("h-4 w-4 mr-3", btn.color)} />
                        <span className="truncate">{btn.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{btn.blocked ? 'Premium - Assine para acessar' : btn.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer com info */}
      <div className="px-4 py-3 border-t border-border bg-card/30">
        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-3">
          <span>Use</span>
          <kbd className="px-2 py-1 rounded bg-muted font-mono">↑</kbd>
          <kbd className="px-2 py-1 rounded bg-muted font-mono">↓</kbd>
          <span>para navegar entre artigos</span>
        </div>
      </div>

      {/* Drawer de Anotações */}
      <AnotacaoDrawer
        open={anotacaoOpen}
        onClose={() => setAnotacaoOpen(false)}
        tabelaCodigo={tableName}
        numeroArtigo={numeroArtigo}
        artigoId={article.id}
        codeName={codeName}
      />

      {/* Card Premium para recursos bloqueados */}
      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title={premiumCardMessage.title || getNarrationBlockedMessage().title}
        description={premiumCardMessage.description || getNarrationBlockedMessage().description}
      />
    </div>
  );
};

export default VadeMecumDetailPanel;
