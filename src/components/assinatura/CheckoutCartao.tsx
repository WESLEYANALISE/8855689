import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PremiumSuccessCard from '@/components/PremiumSuccessCard';

// Mercado Pago Public Key - pode ficar no código pois é pública
const MP_PUBLIC_KEY = 'APP_USR-5f369726-30b9-4e89-9179-c28727a42c07';

interface CheckoutCartaoProps {
  amount: number;
  planType: string;
  planLabel: string;
  userEmail: string;
  userId: string;
  defaultInstallments?: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export function CheckoutCartao({ 
  amount, 
  planType, 
  planLabel,
  userEmail, 
  userId,
  defaultInstallments = 1,
  onSuccess, 
  onError,
  onCancel 
}: CheckoutCartaoProps) {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [cpf, setCpf] = useState('');
  const [installments, setInstallments] = useState(defaultInstallments);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Detectar bandeira do cartão
  const detectCardBrand = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    if (/^(?:2131|1800|35)/.test(cleaned)) return 'jcb';
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'diners';
    if (/^(50|5[6-9]|6[0-9])/.test(cleaned)) return 'elo';
    if (/^606282/.test(cleaned)) return 'hipercard';
    return null;
  };

  // Formatar número do cartão
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    return formatted;
  };

  // Formatar data de validade
  const formatExpirationDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  // Formatar CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
    setCardBrand(detectCardBrand(formatted));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      newErrors.cardNumber = 'Número do cartão inválido';
    }
    
    if (!cardholderName.trim() || cardholderName.length < 3) {
      newErrors.cardholderName = 'Nome obrigatório';
    }
    
    const [month, year] = expirationDate.split('/');
    if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) {
      newErrors.expirationDate = 'Data inválida';
    }
    
    if (securityCode.length < 3) {
      newErrors.securityCode = 'CVV inválido';
    }
    
    if (!email.includes('@')) {
      newErrors.email = 'E-mail inválido';
    }
    
    const cleanedCPF = cpf.replace(/\D/g, '');
    if (cleanedCPF.length !== 11) {
      newErrors.cpf = 'CPF inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setPaymentError(null);
    setLoading(true);

    try {
      // Carregar SDK do Mercado Pago dinamicamente
      if (!window.MercadoPago) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Falha ao carregar SDK'));
          document.head.appendChild(script);
        });
      }

      const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
      
      const [expMonth, expYear] = expirationDate.split('/');
      const cleanedCPF = cpf.replace(/\D/g, '');

      // Obter payment_method_id correto usando getPaymentMethods
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      const bin = cleanedCardNumber.slice(0, 6);
      
      let paymentMethodId = cardBrand || 'visa';
      
      try {
        const paymentMethods = await mp.getPaymentMethods({ bin });
        if (paymentMethods.results && paymentMethods.results.length > 0) {
          paymentMethodId = paymentMethods.results[0].id;
          console.log('Payment method detectado:', paymentMethodId);
        }
      } catch (pmErr) {
        console.warn('Não foi possível detectar payment method, usando fallback:', cardBrand);
      }

      // Criar token do cartão
      const tokenResult = await mp.createCardToken({
        cardNumber: cleanedCardNumber,
        cardholderName: cardholderName.toUpperCase(),
        cardExpirationMonth: expMonth,
        cardExpirationYear: `20${expYear}`,
        securityCode: securityCode,
        identificationType: 'CPF',
        identificationNumber: cleanedCPF,
      });

      if (tokenResult.error) {
        throw new Error(tokenResult.error.message || 'Erro ao processar cartão');
      }

      console.log('Token criado:', tokenResult.id, 'PaymentMethodId:', paymentMethodId);

      // Enviar para o backend
      const { data, error } = await supabase.functions.invoke('mercadopago-criar-pagamento-cartao', {
        body: {
          token: tokenResult.id,
          userId,
          userEmail: email,
          planType,
          installments,
          paymentMethodId,
          identificationType: 'CPF',
          identificationNumber: cleanedCPF
        }
      });

      if (error) {
        throw new Error('Erro ao processar pagamento');
      }

      if (data?.success) {
        if (data.status === 'approved') {
          toast.success('Pagamento aprovado! Sua assinatura foi ativada.');
          setShowSuccess(true);
        } else if (data.status === 'pending') {
          toast.info(data.message || 'Pagamento em análise. Você será notificado quando for aprovado!', {
            duration: 8000
          });
          setShowSuccess(true);
        } else {
          toast.success('Pagamento processado!');
          setShowSuccess(true);
        }
      } else {
        const errorMsg = data?.error || 'Pagamento não aprovado. Tente outro cartão.';
        setPaymentError(errorMsg);
        throw new Error(errorMsg);
      }

    } catch (err: any) {
      console.error('Erro no checkout:', err);
      const errorMessage = err.message || 'Erro ao processar pagamento';
      if (!paymentError) {
        setPaymentError(errorMessage);
      }
      toast.error(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Taxas do Mercado Pago "Na Hora" até R$3mil
  const INSTALLMENT_RATES: Record<number, number> = {
    1: 0,
    2: 0.0990,
    3: 0.1128,
    4: 0.1264,
    5: 0.1397,
    6: 0.1527,
    7: 0.1655,
    8: 0.1781,
    9: 0.1904,
    10: 0.2024,
  };

  // Calcular parcelas disponíveis (até 10x com juros)
  const getInstallmentOptions = () => {
    const options = [];
    
    for (let i = 1; i <= 10; i++) {
      const rate = INSTALLMENT_RATES[i] || 0;
      const totalWithInterest = amount * (1 + rate);
      const installmentValue = totalWithInterest / i;
      
      if (i === 1) {
        options.push({ 
          value: 1, 
          label: `1x de R$ ${amount.toFixed(2).replace('.', ',')} (sem juros)`,
          total: amount
        });
      } else {
        options.push({ 
          value: i, 
          label: `${i}x de R$ ${installmentValue.toFixed(2).replace('.', ',')} (total: R$ ${totalWithInterest.toFixed(2).replace('.', ',')})`,
          total: totalWithInterest
        });
      }
    }
    
    return options;
  };

  // Mostrar card de sucesso se pagamento aprovado
  if (showSuccess) {
    return (
      <PremiumSuccessCard 
        isVisible={true}
        planType={planType}
        amount={amount}
        onClose={onSuccess}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alerta de erro de pagamento */}
      {paymentError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Pagamento recusado</p>
            <p className="text-red-300/80 text-sm">{paymentError}</p>
            <p className="text-zinc-400 text-sm mt-1">Tente usar outro cartão ou método de pagamento.</p>
          </div>
        </div>
      )}

      {/* Número do Cartão */}
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">Número do cartão</label>
        <div className="relative">
          <Input 
            value={cardNumber}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            placeholder="1234 5678 9012 3456"
            className={`bg-zinc-900 border-zinc-700 pl-10 ${errors.cardNumber ? 'border-red-500' : ''}`}
            maxLength={19}
            disabled={loading}
          />
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          {cardBrand && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs uppercase text-amber-400 font-medium">
              {cardBrand}
            </span>
          )}
        </div>
        {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
      </div>

      {/* Nome no Cartão */}
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">Nome no cartão</label>
        <Input 
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          placeholder="COMO ESTÁ NO CARTÃO"
          className={`bg-zinc-900 border-zinc-700 uppercase ${errors.cardholderName ? 'border-red-500' : ''}`}
          disabled={loading}
        />
        {errors.cardholderName && <p className="text-red-400 text-xs mt-1">{errors.cardholderName}</p>}
      </div>

      {/* Validade e CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-zinc-400 mb-1 block">Validade</label>
          <Input 
            value={expirationDate}
            onChange={(e) => setExpirationDate(formatExpirationDate(e.target.value))}
            placeholder="MM/AA"
            className={`bg-zinc-900 border-zinc-700 ${errors.expirationDate ? 'border-red-500' : ''}`}
            maxLength={5}
            disabled={loading}
          />
          {errors.expirationDate && <p className="text-red-400 text-xs mt-1">{errors.expirationDate}</p>}
        </div>
        <div>
          <label className="text-sm text-zinc-400 mb-1 block">CVV</label>
          <Input 
            type="password"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="•••"
            className={`bg-zinc-900 border-zinc-700 ${errors.securityCode ? 'border-red-500' : ''}`}
            maxLength={4}
            disabled={loading}
          />
          {errors.securityCode && <p className="text-red-400 text-xs mt-1">{errors.securityCode}</p>}
        </div>
      </div>

      {/* CPF */}
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">CPF do titular</label>
        <Input 
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          placeholder="000.000.000-00"
          className={`bg-zinc-900 border-zinc-700 ${errors.cpf ? 'border-red-500' : ''}`}
          maxLength={14}
          disabled={loading}
        />
        {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf}</p>}
      </div>

      {/* E-mail */}
      <div>
        <label className="text-sm text-zinc-400 mb-1 block">E-mail</label>
        <Input 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className={`bg-zinc-900 border-zinc-700 ${errors.email ? 'border-red-500' : ''}`}
          disabled={loading}
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Info de parcelas (já selecionadas) */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-300">Pagamento em</span>
          <span className="text-amber-400 font-semibold">
            {installments}x de R$ {(amount / installments).toFixed(2).replace('.', ',')}
          </span>
        </div>
        {installments > 1 && (
          <p className="text-xs text-zinc-500 mt-1">
            Total: R$ {amount.toFixed(2).replace('.', ',')}
          </p>
        )}
      </div>

      {/* Selo de segurança */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 rounded-lg p-3">
        <Lock className="w-4 h-4 text-green-500" />
        <span>Pagamento seguro processado pelo Mercado Pago</span>
      </div>

      {/* Botões */}
      <div className="space-y-2 pt-2">
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold py-5"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar R$ {amount.toFixed(2)}
            </>
          )}
        </Button>
        
        <Button 
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="w-full text-zinc-400 hover:text-white"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
