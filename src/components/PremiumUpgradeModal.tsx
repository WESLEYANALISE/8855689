import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Crown, Star, BookmarkPlus, Highlighter, StickyNote, MessageCircle } from 'lucide-react';

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

const PREMIUM_FEATURES = [
  { icon: Star, text: 'Favoritar artigos e leis' },
  { icon: StickyNote, text: 'Anotações personalizadas' },
  { icon: Highlighter, text: 'Grifar textos importantes' },
  { icon: MessageCircle, text: 'Evelyn no WhatsApp 24h' },
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
      <DialogContent className="sm:max-w-md">
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

        <div className="space-y-3 my-4">
          {PREMIUM_FEATURES.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <feature.icon className="h-5 w-5 text-amber-500" />
              <span className="text-sm">{feature.text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            <Crown className="h-4 w-4 mr-2" />
            Assinar por R$ 89,90 (acesso vitalício)
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
