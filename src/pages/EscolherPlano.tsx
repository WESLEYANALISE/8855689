import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Crown, Gift, MessageCircle, Play, Loader2, Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMercadoPagoPix } from '@/hooks/use-mercadopago-pix';
import PixPaymentScreen from '@/components/assinatura/PixPaymentScreen';
import themisFaceCloseup from '@/assets/themis-face-closeup.webp';

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
  { label: 'Resumos inteligentes', included: false },
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
  { label: 'Notícias + Análise', included: true },
  { label: 'Todas as videoaulas', included: true },
  { label: '+30.000 questões OAB', included: true },
  { label: 'Mapas mentais', included: true },
  { label: 'Resumos inteligentes', included: true },
  { label: 'Simulados OAB', included: true },
  { label: 'Petições e contratos', included: true },
  { label: 'Audioaulas', included: true },
  { label: 'Súmulas vinculantes', included: true },
  { label: 'Trilhas OAB completas', included: true },
  { label: 'Biblioteca completa', included: true },
  { label: 'Sem anúncios', included: true },
  { label: 'Suporte prioritário', included: true },
];

const INITIAL_VISIBLE = 8;

export const markPlanChosen = (userId: string) => {
  localStorage.setItem(`${PLAN_CHOSEN_KEY}_${userId}`, 'true');
};

export const hasPlanChosen = (userId: string): boolean => {
  return localStorage.getItem(`${PLAN_CHOSEN_KEY}_${userId}`) === 'true';
};

const FeatureList = ({ features, amber }: { features: typeof FREE_FEATURES; amber?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? features : features.slice(0, INITIAL_VISIBLE);
  const hasMore = features.length > INITIAL_VISIBLE;

  return (
    <div className="px-3 sm:px-4 py-3">
      <div className="space-y-1.5 sm:space-y-2">
        {visible.map((f, i) => (
          <div key={i} className="flex items-start gap-1.5 sm:gap-2 text-[11px] sm:text-sm">
            {f.included ? (
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-700 flex-shrink-0 mt-0.5" />
            )}
            <span className={f.included ? 'text-zinc-300' : 'text-zinc-600 line-through'}>
              {f.label}
            </span>
          </div>
        ))}
      </div>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className={`mt-2 flex items-center gap-1 text-[11px] sm:text-xs font-medium ${
            amber ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-400 hover:text-zinc-300'
          } transition-colors`}
        >
          <ChevronDown className="w-3 h-3" />
          Ver mais ({features.length - INITIAL_VISIBLE})
        </button>
      )}

      {hasMore && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className={`mt-2 flex items-center gap-1 text-[11px] sm:text-xs font-medium ${
            amber ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-400 hover:text-zinc-300'
          } transition-colors`}
        >
          <ChevronDown className="w-3 h-3 rotate-180" />
          Ver menos
        </button>
      )}
    </div>
  );
};

const EscolherPlano: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBonusVideo, setShowBonusVideo] = useState(false);
  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();

  const handleFree = () => {
    if (user?.id) markPlanChosen(user.id);
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-foreground overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-3 py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-10"
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            Como você quer começar?
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
            Escolha a melhor forma de iniciar sua jornada no Direito
          </p>
        </motion.div>

        {/* Cards */}
        <div className="flex flex-col gap-4 max-w-md mx-auto mb-6 sm:mb-8">
          {/* Free Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-zinc-700/60 overflow-hidden flex flex-col bg-zinc-900/80"
          >
            {/* Cover image */}
            <div className="h-32 w-full relative overflow-hidden">
              <img src={themisFaceCloseup} alt="" className="w-full h-full object-cover object-[30%_center] brightness-50 saturate-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <p className="text-[10px] sm:text-xs text-zinc-300 uppercase tracking-wider font-medium">Plano</p>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Gratuito</h2>
              </div>
            </div>

            <div className="text-center py-3 sm:py-4 border-b border-zinc-800">
              <span className="text-xl sm:text-4xl font-bold text-white">R$ 0</span>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">Para sempre</p>
            </div>

            <div className="flex-1">
              <FeatureList features={FREE_FEATURES} />
            </div>

            <div className="p-3 sm:p-4">
              <Button
                variant="outline"
                onClick={handleFree}
                className="w-full h-10 sm:h-12 text-xs sm:text-base border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Começar Grátis
              </Button>
            </div>
          </motion.div>

          {/* Lifetime Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-amber-500/70 overflow-hidden flex flex-col relative bg-zinc-900/80 shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]"
          >
            <div className="absolute top-0 right-0 z-10">
              <span className="bg-amber-500 text-black text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-bl-lg flex items-center gap-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                MELHOR
              </span>
            </div>

            {/* Cover image */}
            <div className="h-32 w-full relative overflow-hidden">
              <img src={themisFaceCloseup} alt="" className="w-full h-full object-cover object-[30%_center]" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-amber-500/20" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-[10px] sm:text-xs text-amber-300/80 uppercase tracking-wider font-medium">Acesso</p>
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Vitalício + Bônus</h2>
                </div>
              </div>
            </div>

            <div className="text-center py-3 sm:py-4 border-b border-amber-500/20 bg-amber-500/5">
              <span className="text-xl sm:text-4xl font-bold text-amber-400">R$ 89,90</span>
              <p className="text-[10px] sm:text-xs text-amber-300/60 mt-1">Pagamento único</p>
            </div>

            <div className="flex-1">
              <FeatureList features={LIFETIME_FEATURES} amber />
            </div>

            <div className="p-3 sm:p-4">
              <Button
                onClick={handleLifetime}
                disabled={pixLoading}
                className="w-full h-10 sm:h-12 text-xs sm:text-base bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold shadow-lg shadow-amber-500/25 animate-pulse"
              >
                {pixLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    Assinar Vitalício
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bonus Evelyn */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-full">
              <Gift className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-lg">Bônus exclusivo — R$ 89,90</h3>
              <p className="text-emerald-300/80 text-[10px] sm:text-sm">Incluso no plano Vitalício</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-zinc-300 text-xs sm:text-sm">
              <strong className="text-white">Evelyn</strong> — Sua assistente jurídica no WhatsApp, 24h
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowBonusVideo(true)}
            className="gap-2 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 text-xs sm:text-sm"
          >
            <Play className="w-4 h-4" />
            Ver bônus
          </Button>
        </motion.div>

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
