import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Star, 
  BookmarkPlus, 
  Highlighter, 
  StickyNote, 
  MessageCircle,
  GraduationCap,
  BookOpen,
  FileText,
  Sparkles,
  Mic,
  BrainCircuit
} from 'lucide-react';

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

const PREMIUM_FEATURES = [
  { icon: GraduationCap, text: '16 matérias de Conceitos do Direito', highlight: true },
  { icon: BookOpen, text: '+150 tópicos com aulas interativas', highlight: true },
  { icon: BrainCircuit, text: '+1.500 flashcards para revisão', highlight: false },
  { icon: FileText, text: '+2.000 questões para praticar', highlight: false },
  { icon: Sparkles, text: 'IA para explicações personalizadas', highlight: false },
  { icon: Mic, text: 'Narração de artigos e leis', highlight: false },
  { icon: Star, text: 'Favoritar artigos e leis ilimitado', highlight: false },
  { icon: StickyNote, text: 'Anotações personalizadas em tudo', highlight: false },
  { icon: Highlighter, text: 'Grifar textos importantes', highlight: false },
  { icon: MessageCircle, text: 'Evelyn no WhatsApp 24h', highlight: false },
];

export const PremiumUpgradeModal = ({
  open,
  onOpenChange,
  featureName = 'Este recurso'
}: PremiumUpgradeModalProps) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    onOpenChange(false);
    navigate('/assinatura');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {featureName} é Premium
          </DialogTitle>
          <DialogDescription className="text-center">
            Assine o Direito Premium e desbloqueie todos os recursos exclusivos!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-4">
          {PREMIUM_FEATURES.map((feature, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 p-2 rounded-lg ${
                feature.highlight 
                  ? 'bg-amber-500/10 border border-amber-500/20' 
                  : 'bg-muted/50'
              }`}
            >
              <feature.icon className={`h-5 w-5 ${feature.highlight ? 'text-amber-400' : 'text-amber-500'}`} />
              <span className={`text-sm ${feature.highlight ? 'font-medium text-foreground' : ''}`}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            <Crown className="h-4 w-4 mr-2" />
            Seja Premium
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};