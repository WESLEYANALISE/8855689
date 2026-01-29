import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Calendar, CreditCard, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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

const MinhaAssinatura = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, subscription, loading, refreshSubscription, daysRemaining } = useSubscription();
  const [cancelling, setCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    if (!user?.id) return;

    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-cancelar-assinatura', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso.",
      });

      await refreshSubscription();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar sua assinatura. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiration = () => {
    if (!subscription?.expirationDate) return null;
    const expiration = new Date(subscription.expirationDate);
    const now = new Date();
    const diff = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getStatusBadge = () => {
    switch (subscription?.status) {
      case 'authorized':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativa</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelada</Badge>;
      case 'paused':
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Pausada</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">{subscription?.status || 'Desconhecido'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center -mx-8 -my-0">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white -mx-8 -my-0 px-8 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <span className="text-lg font-semibold">Minha Assinatura</span>
          </div>
        </motion.header>

        {!subscription ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <CreditCard className="w-10 h-10 text-zinc-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Você ainda não é Premium</h2>
            <p className="text-zinc-400 mb-6">
              Desbloqueie todos os recursos do JurisIA com uma assinatura premium.
            </p>
            <Button 
              onClick={() => navigate('/assinatura')}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ver planos
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status Card */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Status</CardTitle>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {isPremium ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isPremium ? 'Assinatura ativa' : 'Assinatura inativa'}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Plano {subscription.planType === 'mensal' ? 'Mensal' : 'Anual'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <CreditCard className="w-4 h-4" />
                    <span>Valor</span>
                  </div>
                  <span className="font-medium">
                    R$ {subscription.amount.toFixed(2).replace('.', ',')}
                    {subscription.planType === 'mensal' ? '/mês' : '/ano'}
                  </span>
                </div>

                {subscription.expirationDate && isPremium && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      <span>Válido até</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium block">{formatDate(subscription.expirationDate)}</span>
                      {getDaysUntilExpiration() !== null && (
                        <span className="text-sm text-zinc-500">
                          {getDaysUntilExpiration() === 0 ? 'Expira hoje' : `em ${getDaysUntilExpiration()} dias`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-4 h-4" />
                    <span>Assinante desde</span>
                  </div>
                  <span className="font-medium">{formatDate(subscription.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cancel Button */}
            {isPremium && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    Cancelar assinatura
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      Tem certeza que deseja cancelar sua assinatura? Você perderá acesso a todos os recursos premium.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                      Manter assinatura
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelSubscription}
                      className="bg-red-600 hover:bg-red-500"
                    >
                      Confirmar cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {!isPremium && subscription.status === 'cancelled' && (
              <Button 
                onClick={() => navigate('/assinatura')}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold"
              >
                <Crown className="w-4 h-4 mr-2" />
                Reativar assinatura
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MinhaAssinatura;
