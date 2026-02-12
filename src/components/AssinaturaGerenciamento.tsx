import { useState } from "react";
import { ArrowLeft, Crown, Calendar, Mail, CreditCard, AlertCircle, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDeviceType } from "@/hooks/use-device-type";

const AssinaturaGerenciamento = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, refreshSubscription, daysRemaining } = useSubscription();
  const [cancelando, setCancelando] = useState(false);
  const [mudandoPlano, setMudandoPlano] = useState(false);
  const { isDesktop } = useDeviceType();

  const handleCancelar = async () => {
    if (!user?.id) return;
    
    setCancelando(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-cancelar-assinatura', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso. Você ainda terá acesso até o fim do período pago.",
      });

      await refreshSubscription();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar sua assinatura. Tente novamente ou entre em contato com o suporte.",
        variant: "destructive"
      });
    } finally {
      setCancelando(false);
    }
  };

  const handleMudarPlano = async () => {
    // Para mudar de plano, o usuário precisa cancelar o atual e assinar outro
    toast({
      title: "Mudança de plano",
      description: "Para mudar de plano, cancele sua assinatura atual e assine o novo plano após o término do período atual.",
    });
  };

  const getPlanName = () => {
    if (subscription?.planType === 'vitalicio') return 'Premium Vitalício';
    if (subscription?.planType === 'pro') return 'Pro';
    if (subscription?.planType === 'essencial') return 'Essencial';
    if (subscription?.planType === 'anual') return 'Premium Anual';
    if (subscription?.planType === 'mensal') return 'Premium Mensal';
    return 'Premium';
  };

  const getPlanValue = () => {
    if (subscription?.planType === 'vitalicio') return 'R$ 89,90 (vitalício)';
    if (subscription?.planType === 'pro') return 'R$ 19,90/mês';
    if (subscription?.planType === 'essencial') return 'R$ 14,99/mês';
    if (subscription?.planType === 'anual') return 'R$ 69,90/ano';
    if (subscription?.planType === 'mensal') return 'R$ 17,99/mês';
    return subscription?.amount ? `R$ ${subscription.amount.toFixed(2).replace('.', ',')}` : '';
  };

  const getStatusBadge = () => {
    const status = subscription?.status;
    if (status === 'authorized' || status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Ativo
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
          <XCircle className="w-3.5 h-3.5" />
          Cancelado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
        <AlertCircle className="w-3.5 h-3.5" />
        {status || 'Pendente'}
      </span>
    );
  };

  const formatExpirationDate = () => {
    if (!subscription?.expirationDate) return 'Não disponível';
    try {
      const date = new Date(subscription.expirationDate);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return subscription.expirationDate;
    }
  };

  const supportEmail = "wn7corporation@gmail.com";

  // Tela de assinatura cancelada
  if (subscription?.status === 'cancelled') {
    return (
      <div className={`min-h-screen bg-black text-white relative ${isDesktop ? '' : '-mx-8 -my-0 px-8'}`}>
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${isDesktop ? 'w-[800px] h-[800px]' : 'w-[600px] h-[600px]'} bg-amber-500/5 rounded-full blur-[120px]`} />
          <div className={`absolute bottom-0 right-0 ${isDesktop ? 'w-[600px] h-[600px]' : 'w-[400px] h-[400px]'} bg-amber-600/3 rounded-full blur-[100px]`} />
        </div>

        <div className={`relative z-10 mx-auto px-4 py-6 ${isDesktop ? 'max-w-xl py-16 px-8' : 'max-w-lg'} flex flex-col items-center justify-center min-h-screen`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            {/* Ícone */}
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-amber-500" />
            </div>

            {/* Título */}
            <div className="space-y-2">
              <h1 className={`${isDesktop ? 'text-3xl' : 'text-2xl'} font-bold text-white`}>
                Assinatura Cancelada
              </h1>
              <p className="text-zinc-400">
                Você optou por cancelar sua assinatura premium.
              </p>
            </div>

            {/* Card com data de expiração */}
            <Card className="bg-gradient-to-br from-[#1A1A1B] to-[#141415] border-amber-500/30 w-full max-w-sm mx-auto">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-500">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Acesso ativo até</span>
                </div>
                <p className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-bold text-white`}>
                  {formatExpirationDate()}
                </p>
                <p className="text-zinc-400 text-sm">
                  Após essa data, você perderá acesso às funcionalidades premium.
                </p>
              </CardContent>
            </Card>

            {/* Botão Ver Planos */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => navigate('/assinatura', { state: { forceShowPlans: true } })}
                className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold py-6 rounded-xl"
              >
                <Crown className="w-5 h-5 mr-2" />
                Ver Planos
              </Button>
            </motion.div>

            {/* Link de suporte */}
            <p className="text-zinc-500 text-sm">
              Precisa de ajuda?{' '}
              <a href={`mailto:${supportEmail}`} className="text-amber-500 hover:text-amber-400 underline">
                Entre em contato
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-black text-white relative ${isDesktop ? '' : '-mx-8 -my-0 px-8'}`}>
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${isDesktop ? 'w-[800px] h-[800px]' : 'w-[600px] h-[600px]'} bg-amber-500/5 rounded-full blur-[120px]`} />
        <div className={`absolute bottom-0 right-0 ${isDesktop ? 'w-[600px] h-[600px]' : 'w-[400px] h-[400px]'} bg-amber-600/3 rounded-full blur-[100px]`} />
      </div>

      <div className={`relative z-10 mx-auto px-4 py-6 ${isDesktop ? 'max-w-3xl py-12 px-8' : 'max-w-lg'}`}>
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-8"
        >
          <Crown className={`${isDesktop ? 'w-8 h-8' : 'w-6 h-6'} text-amber-500`} />
          <span className={`${isDesktop ? 'text-2xl' : 'text-lg'} font-semibold tracking-wide`}>Minha Assinatura</span>
        </motion.header>

        {/* Grid Layout para Desktop */}
        <div className={isDesktop ? 'grid grid-cols-2 gap-6' : 'space-y-4'}>
          {/* Card do Plano Atual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={isDesktop ? 'col-span-2' : ''}
          >
            <Card className="bg-gradient-to-br from-[#1A1A1B] to-[#141415] border-amber-500/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={`${isDesktop ? 'text-xl' : 'text-lg'} font-semibold text-white flex items-center gap-2`}>
                    <Crown className={`${isDesktop ? 'w-6 h-6' : 'w-5 h-5'} text-amber-500`} />
                    {getPlanName()}
                  </CardTitle>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-300">
                  <CreditCard className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-amber-500`} />
                  <span className={`${isDesktop ? 'text-lg' : 'text-base'} font-medium`}>{getPlanValue()}</span>
                </div>
                {subscription?.createdAt && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-amber-500/70`} />
                    <span className="text-sm">
                      Assinado em {format(new Date(subscription.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Card da Expiração */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#141415] border-zinc-800 h-full">
              <CardHeader className="pb-2">
                <CardTitle className={`${isDesktop ? 'text-lg' : 'text-base'} font-medium text-zinc-300 flex items-center gap-2`}>
                  <Calendar className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-amber-500`} />
                  Válido até
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${isDesktop ? 'text-xl' : 'text-lg'} text-white font-medium`}>{formatExpirationDate()}</p>
                {daysRemaining !== null && daysRemaining <= 7 && (
                  <p className="text-amber-400 text-sm mt-1">
                    {daysRemaining === 0 ? 'Expira hoje!' : `Expira em ${daysRemaining} dias`}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Card de Suporte */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-[#141415] border-zinc-800 h-full">
              <CardHeader className="pb-2">
                <CardTitle className={`${isDesktop ? 'text-lg' : 'text-base'} font-medium text-zinc-300 flex items-center gap-2`}>
                  <Mail className={`${isDesktop ? 'w-5 h-5' : 'w-4 h-4'} text-amber-500`} />
                  Suporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-zinc-400 text-sm">
                  Precisa de ajuda? Entre em contato:
                </p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors text-sm font-medium"
                >
                  <Mail className="w-4 h-4" />
                  {supportEmail}
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Botões de Ação - Ocultos para plano vitalício */}
        {subscription?.planType !== 'vitalicio' && (
          <div className={`mt-6 ${isDesktop ? 'grid grid-cols-2 gap-4' : 'space-y-4'}`}>
            {/* Botão Mudar de Plano */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleMudarPlano}
                disabled={mudandoPlano}
                variant="outline"
                className={`w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white ${isDesktop ? 'py-7' : 'py-6'} rounded-xl transition-all duration-300`}
              >
                {mudandoPlano ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Mudar de Plano
              </Button>
            </motion.div>

            {/* Botão Cancelar Assinatura */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 ${isDesktop ? 'py-7' : 'py-6'} rounded-xl transition-all duration-300`}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar Assinatura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#1A1A1B] border-zinc-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Cancelar assinatura?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400 space-y-3">
                      <p>Tem certeza que deseja cancelar sua assinatura premium?</p>
                      <p className="text-amber-400 font-medium">
                        Sua assinatura permanecerá ativa até {formatExpirationDate()}.
                      </p>
                      <p>Após essa data, você perderá acesso a todas as funcionalidades exclusivas.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700">
                      Voltar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelar}
                      disabled={cancelando}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      {cancelando ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          </div>
        )}

        {/* Botão de Suporte Mobile */}
        {!isDesktop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4"
          >
            <Button
              onClick={() => window.location.href = `mailto:${supportEmail}`}
              variant="outline"
              className="w-full border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              Enviar Email de Suporte
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AssinaturaGerenciamento;
