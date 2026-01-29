import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Clock, QrCode, Shield, Loader2, Smartphone, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppLifecycle } from '@/hooks/use-app-lifecycle';
import PremiumSuccessCard from '@/components/PremiumSuccessCard';
import type { PlanType } from '@/hooks/use-mercadopago-pix';

interface PixPaymentScreenProps {
  userId: string;
  planType: PlanType;
  qrCodeBase64: string;
  qrCode: string;
  amount: number;
  expiresAt: string;
  onCancel: () => void;
  onCopyCode: () => Promise<void>;
  onPaymentApproved?: () => void;
}

const PLAN_LABELS = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual'
};

const PixPaymentScreen: React.FC<PixPaymentScreenProps> = ({
  userId,
  planType,
  qrCodeBase64,
  qrCode,
  amount,
  expiresAt,
  onCancel,
  onCopyCode,
  onPaymentApproved
}) => {
  const { isPremium, refreshSubscription } = useSubscription();
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    setIsChecking(true);
    await refreshSubscription();
    setIsChecking(false);
  }, [refreshSubscription]);

  // Verificar ao voltar para o app
  useAppLifecycle(checkPaymentStatus);

  // Listener realtime para mudanças na tabela subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('pix-payment-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Subscription update:', payload);
          if (payload.new?.status === 'authorized') {
            refreshSubscription();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshSubscription]);

  // Mostrar sucesso quando isPremium mudar e parar o áudio
  useEffect(() => {
    if (isPremium) {
      onPaymentApproved?.();
      setShowSuccess(true);
    }
  }, [isPremium, onPaymentApproved]);

  // Timer de expiração do PIX
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Handle copiar código
  const handleCopy = async () => {
    await onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Mostrar card de sucesso
  if (showSuccess) {
    return (
      <PremiumSuccessCard 
        isVisible={true}
        planType={planType}
        amount={amount}
        onClose={() => {}}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>

        <div className="flex items-center gap-2 text-amber-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{timeLeft}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-6 py-8">
          {/* Plan Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4">
              <QrCode className="w-4 h-4 text-amber-500" />
              <span className="text-amber-400 text-sm font-medium">
                Plano {PLAN_LABELS[planType]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Pague via PIX
            </h1>
            <p className="text-zinc-400">
              Escaneie o QR Code ou copie o código
            </p>
          </motion.div>

          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 mx-auto w-fit mb-6"
          >
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-56 h-56"
            />
          </motion.div>

          {/* Valor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <p className="text-zinc-500 text-sm mb-1">Valor a pagar</p>
            <p className="text-3xl font-bold text-white">
              R$ {amount.toFixed(2).replace('.', ',')}
            </p>
          </motion.div>

          {/* Botão Copiar Código */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleCopy}
              className={`w-full h-14 text-base font-medium transition-all ${
                copied
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-amber-500 hover:bg-amber-600 text-black'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Código copiado!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copiar código PIX
                </>
              )}
            </Button>
          </motion.div>

          {/* Instruções */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 space-y-4"
          >
            <h3 className="text-sm font-medium text-zinc-400 text-center mb-4">
              Como pagar
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-500 text-xs font-bold">1</span>
                </div>
                <p className="text-sm text-zinc-300">
                  Abra o app do seu banco e acesse a área PIX
                </p>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-500 text-xs font-bold">2</span>
                </div>
                <p className="text-sm text-zinc-300">
                  Escolha pagar com QR Code ou cole o código copiado
                </p>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-500 text-xs font-bold">3</span>
                </div>
                <p className="text-sm text-zinc-300">
                  Confirme o pagamento e volte aqui - ativaremos automaticamente!
                </p>
              </div>
            </div>
          </motion.div>

          {/* Verificação manual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <button
              onClick={checkPaymentStatus}
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white py-3 transition-colors disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verificando pagamento...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">Já paguei, verificar</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Badge de segurança */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex items-center justify-center gap-2 text-zinc-500"
          >
            <Shield className="w-4 h-4" />
            <span className="text-xs">Pagamento processado pelo Mercado Pago</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PixPaymentScreen;
