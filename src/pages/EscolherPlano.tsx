import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Crown, Gift, MessageCircle, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMercadoPagoPix } from '@/hooks/use-mercadopago-pix';
import PixPaymentScreen from '@/components/assinatura/PixPaymentScreen';

const PLAN_CHOSEN_KEY = 'plan_chosen';

const FREE_FEATURES = [
  { label: 'Chat Jurídico (limitado)', included: true },
  { label: 'Flashcards (3 por dia)', included: true },
  { label: 'Dicionário Jurídico', included: true },
  { label: 'Constituição Federal', included: true },
  { label: 'Código Civil e Penal', included: true },
  { label: 'Notícias Jurídicas', included: true },
  { label: 'Videoaulas (2 grátis)', included: true },
  { label: '+30.000 questões OAB', included: false },
  { label: 'Mapas mentais', included: false },
  { label: 'Resumos com IA', included: false },
  { label: 'Simulados OAB', included: false },
  { label: 'Petições e contratos', included: false },
  { label: 'Audioaulas', included: false },
  { label: 'Súmulas vinculantes', included: false },
  { label: 'Trilhas OAB completas', included: false },
  { label: 'Biblioteca completa', included: false },
  { label: 'Sem anúncios', included: false },
  { label: 'Suporte prioritário', included: false },
];

const LIFETIME_FEATURES = [
  { label: 'Chat Jurídico (ilimitado)', included: true },
  { label: 'Flashcards ilimitados', included: true },
  { label: 'Dicionário Jurídico', included: true },
  { label: 'Vade Mecum completo (+50 leis)', included: true },
  { label: 'Todos os códigos e estatutos', included: true },
  { label: 'Notícias + Análise IA', included: true },
  { label: 'Todas as videoaulas', included: true },
  { label: '+30.000 questões OAB', included: true },
  { label: 'Mapas mentais', included: true },
  { label: 'Resumos com IA', included: true },
  { label: 'Simulados OAB', included: true },
  { label: 'Petições e contratos', included: true },
  { label: 'Audioaulas', included: true },
  { label: 'Súmulas vinculantes', included: true },
  { label: 'Trilhas OAB completas', included: true },
  { label: 'Biblioteca completa', included: true },
  { label: 'Sem anúncios', included: true },
  { label: 'Suporte prioritário', included: true },
];

export const markPlanChosen = (userId: string) => {
  localStorage.setItem(`${PLAN_CHOSEN_KEY}_${userId}`, 'true');
};

export const hasPlanChosen = (userId: string): boolean => {
  return localStorage.getItem(`${PLAN_CHOSEN_KEY}_${userId}`) === 'true';
};

const EscolherPlano: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBonusVideo, setShowBonusVideo] = useState(false);
  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();

  const handleFree = () => {
    if (user?.id) {
      markPlanChosen(user.id);
    }
    navigate('/onboarding', { replace: true });
  };

  const handleLifetime = async () => {
    if (!user) return;
    await createPix(user.id, user.email || '', 'vitalicio');
  };

  const handlePaymentApproved = () => {
    if (user?.id) {
      markPlanChosen(user.id);
      localStorage.setItem(`just_subscribed_${user.id}`, 'true');
    }
    navigate('/onboarding', { replace: true });
  };

  // Show PIX payment screen
  if (pixData && user) {
    return (
      <PixPaymentScreen
        userId={user.id}
        planType={pixData.planType}
        qrCodeBase64={pixData.qrCodeBase64}
        qrCode={pixData.qrCode}
        amount={pixData.amount}
        expiresAt={pixData.expiresAt}
        onCancel={resetPix}
        onCopyCode={copyPixCode}
        onPaymentApproved={handlePaymentApproved}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Escolha seu plano
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base">
            Comece grátis ou desbloqueie tudo com acesso vitalício
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Free Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/95 backdrop-blur-sm rounded-2xl border border-border/50 p-5 flex flex-col"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white">Gratuito</h2>
              <div className="mt-2">
                <span className="text-3xl font-bold text-white">R$ 0</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-5">
              {FREE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {f.included ? (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  )}
                  <span className={f.included ? 'text-zinc-300' : 'text-zinc-600'}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleFree}
              className="w-full h-12 text-base"
            >
              Começar Grátis
            </Button>
          </motion.div>

          {/* Lifetime Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/95 backdrop-blur-sm rounded-2xl border-2 border-amber-500/60 p-5 flex flex-col relative"
          >
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                RECOMENDADO
              </span>
            </div>

            <div className="text-center mb-4 mt-2">
              <h2 className="text-xl font-bold text-amber-400">Vitalício</h2>
              <div className="mt-2">
                <span className="text-3xl font-bold text-white">R$ 89,90</span>
                <p className="text-xs text-zinc-400 mt-1">Pagamento único</p>
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-5">
              {LIFETIME_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-zinc-300">{f.label}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleLifetime}
              disabled={pixLoading}
              className="w-full h-12 text-base bg-amber-500 hover:bg-amber-600 text-black font-bold animate-pulse"
            >
              {pixLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                'Assinar Vitalício'
              )}
            </Button>
          </motion.div>
        </div>

        {/* Bonus Evelyn */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-500/30 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-full">
              <Gift className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Bônus exclusivo</h3>
              <p className="text-emerald-300/80 text-sm">Incluso no plano Vitalício</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-zinc-300 text-sm">
              <strong className="text-white">Evelyn</strong> — Sua assistente jurídica no WhatsApp, disponível 24h
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowBonusVideo(true)}
            className="gap-2 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
          >
            <Play className="w-4 h-4" />
            Ver bônus
          </Button>
        </motion.div>

        {/* Video Modal */}
        <Dialog open={showBonusVideo} onOpenChange={setShowBonusVideo}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black border-zinc-800">
            <DialogTitle className="sr-only">Bônus Evelyn</DialogTitle>
            <div className="aspect-video">
              <iframe
                src="https://www.youtube.com/embed/HlE9u1c_MPQ?autoplay=1"
                title="Evelyn - Assistente Jurídica"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EscolherPlano;
