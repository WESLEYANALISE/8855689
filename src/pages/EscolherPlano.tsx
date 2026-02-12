import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { Check, X, Crown, Loader2, Star, ArrowLeft, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMercadoPagoPix } from '@/hooks/use-mercadopago-pix';
import { useAssinaturaBackgroundAudio } from '@/hooks/useAssinaturaBackgroundAudio';
import PixPaymentScreen from '@/components/assinatura/PixPaymentScreen';
import themisFull from '@/assets/themis-full.webp';
import themisFaceCloseup from '@/assets/themis-face-closeup.webp';
import capaGratuito from '@/assets/capa-plano-gratuito.webp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  { label: 'Evelyn IA 24h', included: false },
];

const ESSENCIAL_FEATURES = [
  { label: 'Chat Jurídico ilimitado', included: true },
  { label: 'Flashcards ilimitados', included: true },
  { label: 'Vade Mecum completo (+50 leis)', included: true },
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
  { label: 'Evelyn IA 24h no WhatsApp', included: false },
  { label: 'Suporte prioritário', included: false },
];

const LIFETIME_FEATURES = [
  { label: 'Chat Jurídico (ilimitado)', included: true },
  { label: 'Flashcards ilimitados', included: true },
  { label: 'Dicionário Jurídico', included: true },
  { label: 'Vade Mecum completo (+50 leis)', included: true },
  { label: 'Todos os códigos e estatutos', included: true },
  { label: 'Notícias + Análise especializada', included: true },
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
  { label: 'Evelyn IA 24h no WhatsApp', included: true },
  { label: 'Suporte prioritário', included: true },
];

const FREE_ABOUT = `O plano Gratuito é perfeito para quem está começando no Direito e quer conhecer a plataforma. Você terá acesso ao Chat Jurídico com limite diário, flashcards para fixar conceitos, o Dicionário Jurídico completo, a Constituição Federal, os Códigos Civil e Penal, além de notícias jurídicas atualizadas e 2 videoaulas de degustação.\n\nÉ a porta de entrada para explorar o universo jurídico sem compromisso. Quando estiver pronto para desbloquear todo o potencial, você pode fazer o upgrade a qualquer momento.`;

const ESSENCIAL_ABOUT = `O plano Essencial é ideal para quem quer acesso completo à plataforma por um valor acessível. Por apenas R$ 14,99/mês, você desbloqueia todas as ferramentas de estudo: Chat Jurídico ilimitado, Vade Mecum completo com +50 leis, +30.000 questões OAB, mapas mentais, resumos inteligentes, simulados, audioaulas, trilhas de estudo e a biblioteca jurídica completa.\n\nTudo sem anúncios e com renovação mensal — cancele quando quiser. A única diferença para o Vitalício é o acesso à Evelyn, a assistente IA no WhatsApp, que é exclusiva do plano Vitalício.`;

const LIFETIME_ABOUT = `O plano Vitalício é o acesso completo e definitivo à maior plataforma de estudos jurídicos do Brasil. Com um único pagamento de R$ 89,90, você desbloqueia TUDO — para sempre.\n\nSão mais de 30.000 questões OAB, o Vade Mecum mais completo com +50 leis, trilhas de estudo personalizadas, mapas mentais, resumos inteligentes, simulados, audioaulas, videoaulas exclusivas, petições, contratos e a biblioteca jurídica mais completa do país.\n\nAlém disso, você ganha acesso à Evelyn, sua assistente jurídica 24h no WhatsApp, análises especializadas de notícias e suporte prioritário. Tudo sem anúncios e sem mensalidades — pague uma vez, use para sempre.`;

const COMPACT_VISIBLE = 4;

export const markPlanChosen = (userId: string) => {
  localStorage.setItem(`${PLAN_CHOSEN_KEY}_${userId}`, 'true');
};

export const hasPlanChosen = (userId: string): boolean => {
  return localStorage.getItem(`${PLAN_CHOSEN_KEY}_${userId}`) === 'true';
};

const EscolherPlano: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useFacebookPixel();
  const [detailPlan, setDetailPlan] = useState<'free' | 'essencial' | 'lifetime' | null>(null);
  const [detailTab, setDetailTab] = useState<'funcoes' | 'sobre'>('funcoes');
  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();
  const [essencialLoading, setEssencialLoading] = useState(false);

  useEffect(() => {
    trackEvent('ViewContent', {
      content_name: 'Escolher Plano',
      content_category: 'subscription',
    });
  }, []);

  useAssinaturaBackgroundAudio(true);

  const handleFree = () => {
    if (user?.id) markPlanChosen(user.id);
    navigate('/', { replace: true });
  };

  const handleLifetime = async () => {
    if (!user) return;
    await createPix(user.id, user.email || '', 'vitalicio');
  };

  const handleEssencial = async () => {
    if (!user) return;
    setEssencialLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-criar-assinatura', {
        body: { planType: 'essencial', userEmail: user.email || '', userId: user.id }
      });

      if (error) throw error;

      if (data?.init_point) {
        window.open(data.init_point, '_blank');
        if (user.id) markPlanChosen(user.id);
        toast({
          title: "Redirecionando para pagamento",
          description: "Complete o pagamento no Mercado Pago para ativar seu plano.",
        });
      }
    } catch (err) {
      console.error('Erro ao criar assinatura essencial:', err);
      toast({
        title: "Erro ao processar",
        description: "Tente novamente em instantes.",
        variant: "destructive"
      });
    } finally {
      setEssencialLoading(false);
    }
  };

  const handlePaymentApproved = () => {
    if (user?.id) {
      markPlanChosen(user.id);
    }
  };

  const handleConfirm = () => {
    if (detailPlan === 'free') handleFree();
    else if (detailPlan === 'essencial') handleEssencial();
    else if (detailPlan === 'lifetime') handleLifetime();
  };

  const openDetail = (plan: 'free' | 'essencial' | 'lifetime') => {
    setDetailTab('funcoes');
    setDetailPlan(plan);
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

  // Detail full-screen view
  if (detailPlan) {
    const isLifetime = detailPlan === 'lifetime';
    const isEssencial = detailPlan === 'essencial';
    const features = isLifetime ? LIFETIME_FEATURES : isEssencial ? ESSENCIAL_FEATURES : FREE_FEATURES;
    const aboutText = isLifetime ? LIFETIME_ABOUT : isEssencial ? ESSENCIAL_ABOUT : FREE_ABOUT;
    const coverImg = isLifetime ? themisFaceCloseup : capaGratuito;
    const isLoading = isLifetime ? pixLoading : isEssencial ? essencialLoading : false;

    const accentColor = isLifetime ? 'amber' : isEssencial ? 'blue' : 'zinc';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-black text-foreground"
      >
        {/* Cover */}
        <div className="relative w-full h-56 sm:h-72">
          <img src={coverImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <button
            onClick={() => setDetailPlan(null)}
            className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 z-10">
            {isLifetime && <Crown className="w-6 h-6 text-amber-400 mb-1" />}
            {isEssencial && <Zap className="w-6 h-6 text-blue-400 mb-1" />}
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {isLifetime ? 'Plano Vitalício' : isEssencial ? 'Plano Essencial' : 'Plano Gratuito'}
            </h1>
            <p className={`text-sm font-bold ${isLifetime ? 'text-amber-400' : isEssencial ? 'text-blue-400' : 'text-zinc-300'}`}>
              {isLifetime ? 'R$ 89,90 — Pagamento único' : isEssencial ? 'R$ 14,99/mês — Cartão de crédito' : 'R$ 0 — Para sempre'}
            </p>
          </div>
        </div>

        {/* Confirm button */}
        <div className="px-4 py-4 max-w-lg mx-auto">
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full h-12 text-sm font-bold shadow-lg group ${
              isEssencial 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-500/25'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-amber-500/25'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isLifetime ? (
              <Crown className="w-4 h-4 mr-2" />
            ) : isEssencial ? (
              <Zap className="w-4 h-4 mr-2" />
            ) : null}
            Confirmar escolha
            <ChevronRight className="w-4 h-4 ml-1 animate-[slide-in-right_0.6s_ease-in-out_infinite_alternate] group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Toggle tabs */}
        <div className="px-4 max-w-lg mx-auto">
          <div className="flex bg-zinc-900 rounded-lg p-1 mb-4">
            <button
              onClick={() => setDetailTab('funcoes')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                detailTab === 'funcoes'
                  ? (isLifetime ? 'bg-amber-500/20 text-amber-400' : isEssencial ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-white')
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Funções
            </button>
            <button
              onClick={() => setDetailTab('sobre')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                detailTab === 'sobre'
                  ? (isLifetime ? 'bg-amber-500/20 text-amber-400' : isEssencial ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-white')
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sobre
            </button>
          </div>

          <AnimatePresence mode="wait">
            {detailTab === 'funcoes' ? (
              <motion.div
                key="funcoes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pb-8"
              >
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4 font-medium">
                  Tudo que está incluso
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-700 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? 'text-zinc-300' : 'text-zinc-600 line-through'}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="sobre"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pb-8"
              >
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4 font-medium">
                  Sobre o plano
                </p>
                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                  {aboutText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen relative text-foreground overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={themisFull} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-2 tracking-tight">
            Como você quer começar?
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-sm mx-auto">
            Escolha a melhor forma de iniciar sua jornada no Direito
          </p>
        </motion.div>

        {/* Cards */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          {/* Free Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-zinc-700/60 overflow-hidden bg-zinc-900/80 backdrop-blur-sm"
          >
            <div className="flex">
              <div className="w-28 sm:w-36 relative overflow-hidden flex-shrink-0">
                <img src={capaGratuito} alt="" className="w-full h-full object-cover brightness-75" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/80" />
              </div>
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2">
                <h2 className="text-sm font-bold text-white">Gratuito</h2>
                <div className="space-y-1">
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
                <Button
                  variant="outline"
                  onClick={() => openDetail('free')}
                  className="w-full h-9 text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  Escolher esse
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Essencial Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border-2 border-blue-500/50 overflow-hidden relative bg-zinc-900/80 backdrop-blur-sm shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)]"
          >
            <div className="flex">
              <div className="w-28 sm:w-36 relative overflow-hidden flex-shrink-0">
                <img src={capaGratuito} alt="" className="w-full h-full object-cover brightness-75" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/80" />
              </div>
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2">
                <h2 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Essencial
                </h2>
                <div className="space-y-1">
                  {ESSENCIAL_FEATURES.slice(0, COMPACT_VISIBLE).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-zinc-300">{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-blue-400">R$ 14,99</span>
                  <span className="text-[10px] text-blue-300/60">/mês</span>
                </div>
                <Button
                  onClick={() => openDetail('essencial')}
                  className="w-full h-9 text-xs bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/25"
                >
                  Escolher esse
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Lifetime Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-amber-500/70 overflow-hidden relative bg-zinc-900/80 backdrop-blur-sm shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]"
          >
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" />
                MELHOR
              </span>
            </div>

            <div className="flex">
              <div className="w-28 sm:w-36 relative overflow-hidden flex-shrink-0">
                <img src={themisFaceCloseup} alt="" className="w-full h-full object-cover object-[30%_center]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/60" />
              </div>
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2">
                <h2 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  Vitalício + Evelyn
                </h2>
                <div className="space-y-1">
                  {LIFETIME_FEATURES.slice(0, COMPACT_VISIBLE).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-zinc-300">{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-amber-400">R$ 89,90</span>
                  <span className="text-[10px] text-amber-300/60">Pagamento único</span>
                </div>
                <Button
                  onClick={() => openDetail('lifetime')}
                  className="w-full h-9 text-xs bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold shadow-lg shadow-amber-500/25"
                >
                  Escolher esse
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EscolherPlano;
