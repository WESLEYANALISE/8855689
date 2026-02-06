import { useState, useEffect, memo } from "react";
import { X, Crown, Star, StickyNote, Highlighter, MessageCircle, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const PREMIUM_BENEFITS = [
  { icon: Star, text: "Favoritar artigos e leis", color: "text-yellow-400" },
  { icon: StickyNote, text: "Anotações personalizadas", color: "text-blue-400" },
  { icon: Highlighter, text: "Grifar textos importantes", color: "text-green-400" },
  { icon: MessageCircle, text: "Evelyn no WhatsApp 24h", color: "text-purple-400" },
  { icon: Zap, text: "Acesso ilimitado a todo conteúdo", color: "text-amber-400" },
];

const PremiumWelcomeCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, loading } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Só mostra se: usuário logado + não premium + não viu ainda nesta sessão
    if (loading) return;
    
    const hasSeenCard = sessionStorage.getItem('premiumWelcomeCardSeen');
    
    if (user && !isPremium && !hasSeenCard) {
      // Delay pequeno para não aparecer instantaneamente
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isPremium, loading]);

  const handleClose = (reason: 'later' | 'testing') => {
    setIsClosing(true);
    sessionStorage.setItem('premiumWelcomeCardSeen', 'true');
    
    setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  const handleSubscribe = () => {
    sessionStorage.setItem('premiumWelcomeCardSeen', 'true');
    setIsClosing(true);
    setTimeout(() => {
      navigate('/assinatura');
    }, 200);
  };

  if (!isVisible || loading) return null;

  return (
    <>
      {/* Overlay escuro */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={() => handleClose('later')}
      />
      
      {/* Card flutuante */}
      <div 
        className={`fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none transition-all duration-200 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto relative w-full max-w-sm bg-gradient-to-br from-card via-card to-card/95 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20"
        >
          {/* Efeito de brilho no topo */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
          
          {/* Sparkles decorativos */}
          <div className="absolute top-4 right-12 opacity-30">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div className="absolute top-16 left-6 opacity-20">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Botão fechar */}
          <button
            onClick={() => handleClose('later')}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Conteúdo */}
          <div className="p-6 pt-8">
            {/* Ícone crown central */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl" />
                <div className="relative p-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Título */}
            <h2 className="text-xl font-bold text-center text-foreground mb-2">
              Seja <span className="text-amber-400">Premium</span>
            </h2>
            <p className="text-sm text-center text-muted-foreground mb-5">
              Desbloqueie todas as funcionalidades e acelere seus estudos!
            </p>

            {/* Lista de benefícios */}
            <div className="space-y-2.5 mb-6">
              {PREMIUM_BENEFITS.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="p-1.5 rounded-lg bg-white/5">
                      <Icon className={`w-4 h-4 ${benefit.color}`} />
                    </div>
                    <span className="text-sm text-foreground/90">{benefit.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Preço */}
            <div className="text-center mb-4">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">Por apenas</span>
                <span className="text-2xl font-bold text-amber-400">R$ 89,90</span>
              </div>
              <p className="text-xs text-muted-foreground">Acesso vitalício • Pagamento único</p>
            </div>

            {/* Botões */}
            <div className="space-y-2.5">
              <Button
                onClick={handleSubscribe}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30"
              >
                <Crown className="w-4 h-4 mr-2" />
                Quero ser Premium
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => handleClose('testing')}
                className="w-full py-4 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors"
              >
                Estou só testando o app
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(PremiumWelcomeCard);
