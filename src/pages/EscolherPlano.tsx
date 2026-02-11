import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Crown, Gift, MessageCircle, Play, Loader2, Star, ChevronDown, Eye } from 'lucide-react';
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
const COMPACT_VISIBLE = 4;

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
  const [detailPlan, setDetailPlan] = useState<'free' | 'lifetime' | null>(null);
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
        <div className="flex flex-col gap-4 max-w-lg mx-auto mb-6 sm:mb-8">
          {/* Free Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-zinc-700/60 overflow-hidden bg-zinc-900/80"
          >
            <div className="flex">
              {/* Cover image */}
              <div className="w-28 sm:w-36 relative overflow-hidden flex-shrink-0">
                <img src={themisFaceCloseup} alt="" className="w-full h-full object-cover object-[30%_center] brightness-50 saturate-50" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/80" />
              </div>
              {/* Features + actions */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2">
                <div className="space-y-1.5">
                  {FREE_FEATURES.slice(0, COMPACT_VISIBLE).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-zinc-300">{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-white">R$ 0</span>
                  <span className="text-[10px] text-zinc-500">Para sempre</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleFree}
                    className="flex-1 h-9 text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                  >
                    Começar Grátis
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setDetailPlan('free')}
                    className="h-9 text-xs text-zinc-400 hover:text-zinc-200 px-3"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Ver mais
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lifetime Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-amber-500/70 overflow-hidden relative bg-zinc-900/80 shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]"
          >
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" />
                MELHOR
              </span>
            </div>

            <div className="flex">
              {/* Cover image */}
              <div className="w-28 sm:w-36 relative overflow-hidden flex-shrink-0">
                <img src={themisFaceCloseup} alt="" className="w-full h-full object-cover object-[30%_center]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/60" />
              </div>
              {/* Features + actions */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2">
                <div className="space-y-1.5">
                  {LIFETIME_FEATURES.slice(0, COMPACT_VISIBLE).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-zinc-300">{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-lg font-bold text-amber-400">R$ 89,90</span>
                  <span className="text-[10px] text-amber-300/60">Pagamento único</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleLifetime}
                    disabled={pixLoading}
                    className="flex-1 h-9 text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold shadow-lg shadow-amber-500/25 animate-pulse"
                  >
                    {pixLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Crown className="w-3.5 h-3.5 mr-1" />
                        Assinar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setDetailPlan('lifetime')}
                    className="h-9 text-xs text-amber-400 hover:text-amber-300 px-3"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Ver mais
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detail Dialog */}
        <Dialog open={detailPlan !== null} onOpenChange={(open) => !open && setDetailPlan(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-900 border-zinc-700 max-h-[85vh] overflow-y-auto">
            <DialogTitle className="sr-only">
              {detailPlan === 'free' ? 'Plano Gratuito' : 'Plano Vitalício'}
            </DialogTitle>
            {/* Extended cover */}
            <div className="h-40 w-full relative overflow-hidden">
              <img
                src={themisFaceCloseup}
                alt=""
                className={`w-full h-full object-cover object-[30%_center] ${detailPlan === 'free' ? 'brightness-50 saturate-50' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              <div className="absolute bottom-4 left-4">
                {detailPlan === 'lifetime' && <Crown className="w-5 h-5 text-amber-400 mb-1" />}
                <h2 className="text-xl font-bold text-white">
                  {detailPlan === 'free' ? 'Plano Gratuito' : 'Vitalício + Bônus'}
                </h2>
                <p className={`text-sm font-bold ${detailPlan === 'lifetime' ? 'text-amber-400' : 'text-white'}`}>
                  {detailPlan === 'free' ? 'R$ 0 — Para sempre' : 'R$ 89,90 — Pagamento único'}
                </p>
              </div>
            </div>
            {/* Full feature list */}
            <FeatureList
              features={detailPlan === 'free' ? FREE_FEATURES : LIFETIME_FEATURES}
              amber={detailPlan === 'lifetime'}
            />
            <div className="p-4 pt-0">
              {detailPlan === 'free' ? (
                <Button
                  variant="outline"
                  onClick={handleFree}
                  className="w-full h-11 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  Começar Grátis
                </Button>
              ) : (
                <Button
                  onClick={handleLifetime}
                  disabled={pixLoading}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold shadow-lg shadow-amber-500/25"
                >
                  {pixLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-1" />
                      Assinar Vitalício
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
