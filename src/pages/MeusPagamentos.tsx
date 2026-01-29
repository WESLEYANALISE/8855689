import { useState, useEffect } from 'react';
import { CreditCard, Receipt, Search, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentItem {
  id: string;
  plan_type: string;
  amount: number;
  status: string;
  created_at: string;
  expiration_date: string | null;
  payment_method: string | null;
  mp_payment_id: string | null;
  mp_payer_email: string | null;
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

const getMethodIcon = (method: string | null) => {
  if (method === 'pix') return QrCode;
  if (method === 'card') return CreditCard;
  return Receipt;
};

const MeusPagamentos = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('id, plan_type, amount, status, created_at, expiration_date, payment_method, mp_payment_id, mp_payer_email')
          .eq('user_id', user.id)
          .eq('status', 'authorized')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar pagamentos:', error);
        } else {
          setPayments(data || []);
          setFilteredPayments(data || []);
        }
      } catch (err) {
        console.error('Erro ao buscar pagamentos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user?.id]);

  useEffect(() => {
    let filtered = [...payments];

    if (methodFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_method === methodFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.mp_payment_id?.toLowerCase().includes(term) ||
        p.plan_type?.toLowerCase().includes(term) ||
        format(new Date(p.created_at), 'dd/MM/yyyy').includes(term)
      );
    }

    setFilteredPayments(filtered);
  }, [payments, methodFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-4">
        {/* Title */}
        <div className="pb-2">
          <h1 className="text-xl font-bold">Meus Pagamentos</h1>
          <p className="text-sm text-muted-foreground">Histórico de pagamentos aprovados</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <CreditCard className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="card">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-500/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-500">
              {payments.length}
            </p>
            <p className="text-xs text-muted-foreground">Pagamentos</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">
              R$ {payments
                .reduce((acc, p) => acc + (p.amount || 0), 0)
                .toFixed(2)
                .replace('.', ',')}
            </p>
            <p className="text-xs text-muted-foreground">Total pago</p>
          </div>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {payments.length === 0 
                ? 'Nenhum pagamento encontrado' 
                : 'Nenhum resultado para os filtros selecionados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const MethodIcon = getMethodIcon(payment.payment_method);

              return (
                <div 
                  key={payment.id}
                  className="bg-card border rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-full ${
                        payment.payment_method === 'pix' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        <MethodIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          Plano {formatPlanType(payment.plan_type)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.payment_method === 'pix' ? 'PIX' : 'Cartão de crédito'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        R$ {payment.amount?.toFixed(2).replace('.', ',')}
                      </p>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-500">
                        <CheckCircle2 className="h-3 w-3" />
                        Aprovado
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Data</p>
                      <p>{format(new Date(payment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                    {payment.expiration_date && (
                      <div>
                        <p className="text-muted-foreground text-xs">Expira em</p>
                        <p>{format(new Date(payment.expiration_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                    )}
                    {payment.mp_payment_id && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">ID do pagamento</p>
                        <p className="font-mono text-xs">{payment.mp_payment_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <p className="text-center text-sm text-muted-foreground">
          Mostrando {filteredPayments.length} de {payments.length} pagamentos
        </p>
      </div>
    </div>
  );
};

export default MeusPagamentos;
