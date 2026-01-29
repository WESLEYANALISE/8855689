import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, RefreshCw, X, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAppLifecycle } from '@/hooks/use-app-lifecycle';
import PremiumSuccessCard from '@/components/PremiumSuccessCard';

interface PaymentMonitorProps {
  userId: string;
  planType: 'mensal' | 'vitalicio';
  onCancel: () => void;
}

export default function PaymentMonitor({ userId, planType, onCancel }: PaymentMonitorProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { refreshSubscription, isPremium } = useSubscription();

  const planAmount = planType === 'vitalicio' ? 89.90 : 15.90;

  // Verificar status manualmente
  const checkPaymentStatus = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    console.log('[PaymentMonitor] Verificando status do pagamento...');
    try {
      await refreshSubscription();
    } finally {
      setIsChecking(false);
    }
  }, [refreshSubscription, isChecking]);

  // Verificar quando app volta ao foreground
  useAppLifecycle(checkPaymentStatus);

  // Polling automático a cada 5 segundos como fallback
  useEffect(() => {
    console.log('[PaymentMonitor] Iniciando polling automático');
    const interval = setInterval(() => {
      if (!isPremium && !isChecking) {
        console.log('[PaymentMonitor] Polling: verificando pagamento...');
        checkPaymentStatus();
      }
    }, 5000);

    return () => {
      console.log('[PaymentMonitor] Parando polling');
      clearInterval(interval);
    };
  }, [isPremium, isChecking, checkPaymentStatus]);

  // Escutar mudanças em tempo real na tabela subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('subscription-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('[PaymentMonitor] Realtime: mudança detectada', payload);
          const newStatus = (payload.new as any)?.status;
          if (newStatus === 'authorized') {
            console.log('[PaymentMonitor] Realtime: pagamento autorizado!');
            await refreshSubscription();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshSubscription]);

  // Detectar quando isPremium muda para true
  useEffect(() => {
    if (isPremium) {
      setShowSuccess(true);
    }
  }, [isPremium]);

  // Mostrar card de sucesso
  if (showSuccess) {
    return (
      <PremiumSuccessCard
        isVisible={showSuccess}
        planType={planType}
        amount={planAmount}
        onClose={onCancel}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6"
    >
      {/* Botão Fechar */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Conteúdo Central */}
      <div className="text-center max-w-sm space-y-8">
        {/* Ícone animado */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mx-auto w-24 h-24"
        >
          <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
          <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-full border border-amber-500/30">
            <CreditCard className="w-10 h-10 text-amber-500" />
          </div>
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-2xl font-bold text-white">
            Aguardando Pagamento
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Complete o pagamento no navegador. Quando finalizar, volte aqui e seu acesso Premium será ativado automaticamente.
          </p>
        </motion.div>

        {/* Indicador de carregamento */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-zinc-500"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Monitorando pagamento...</span>
        </motion.div>

        {/* Botão de verificar manualmente */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <Button
            onClick={checkPaymentStatus}
            disabled={isChecking}
            variant="outline"
            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 py-6"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Já paguei, verificar agora
              </>
            )}
          </Button>
        </motion.div>

        {/* Selo de segurança */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 text-zinc-600 pt-4"
        >
          <Shield className="w-4 h-4" />
          <span className="text-xs">Pagamento processado pelo Mercado Pago</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
