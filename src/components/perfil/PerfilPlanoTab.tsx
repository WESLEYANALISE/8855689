import { Crown, Sparkles, Receipt, Loader2, ExternalLink } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
interface PaymentHistoryItem {
  id: string;
  plan_type: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method: string | null;
}

const formatPlanType = (planType: string): string => {
  const types: Record<string, string> = {
    'mensal': 'Mensal',
    'trimestral': 'Trimestral',
    'vitalicio': 'Vitalício',
    'lifetime': 'Vitalício',
  };
  return types[planType?.toLowerCase()] || planType || 'Premium';
};


export function PerfilPlanoTab() {
  const { isPremium, subscription, daysRemaining, loading } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!user?.id) {
        setLoadingHistory(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('id, plan_type, amount, status, created_at, payment_method')
          .eq('user_id', user.id)
          .eq('status', 'authorized')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar histórico:', error);
        } else {
          // Filtra para mostrar apenas o último pagamento de cada mês
          const uniqueByMonth = (data || []).reduce((acc, payment) => {
            const date = new Date(payment.created_at);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}-${payment.plan_type}`;
            if (!acc.has(monthKey)) {
              acc.set(monthKey, payment);
            }
            return acc;
          }, new Map<string, PaymentHistoryItem>());
          
          // Pega apenas o último pagamento (o mais recente)
          const allPayments = Array.from(uniqueByMonth.values());
          setPaymentHistory(allPayments.slice(0, 1));
        }
      } catch (err) {
        console.error('Erro ao buscar histórico de pagamentos:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchPaymentHistory();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`p-6 rounded-2xl border-2 ${
        isPremium 
          ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30' 
          : 'bg-muted/50 border-border'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${
            isPremium ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {isPremium ? 'Plano Premium' : 'Plano Gratuito'}
            </h3>
            {isPremium && subscription?.expirationDate && (
              <p className="text-sm text-muted-foreground">
                {daysRemaining && daysRemaining > 365 
                  ? 'Acesso vitalício'
                  : `Expira em ${format(new Date(subscription.expirationDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                }
              </p>
            )}
          </div>
        </div>

        {isPremium && daysRemaining && daysRemaining <= 365 && (
          <div className="bg-background/50 rounded-lg p-3 mb-4">
            <p className="text-sm">
              <span className="font-medium">{daysRemaining}</span> dias restantes
            </p>
          </div>
        )}

        {!isPremium && (
          <Button 
            onClick={() => navigate('/assinatura')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Assinar Premium
          </Button>
        )}

        {isPremium && (
          <Button 
            variant="outline"
            onClick={() => navigate('/assinatura')}
            className="w-full"
          >
            Gerenciar assinatura
          </Button>
        )}
      </div>

      {/* Payment History */}
      {isPremium && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Histórico de pagamentos
            </h4>
            <Link 
              to="/meus-pagamentos" 
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Ver completo <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : paymentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum pagamento encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {paymentHistory.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Receipt className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Plano {formatPlanType(payment.plan_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      R$ {payment.amount?.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-green-500">Aprovado</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
