import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight, AlertTriangle, CreditCard, ShieldX, Ban, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSubscription } from "@/contexts/SubscriptionContext";

// Mapeamento de códigos de erro do Mercado Pago para mensagens amigáveis
const getPaymentErrorDetails = (statusDetail: string | null): { title: string; message: string; icon: React.ReactNode; suggestion: string } => {
  const errorMap: Record<string, { title: string; message: string; icon: React.ReactNode; suggestion: string }> = {
    // Erros de saldo/limite
    'cc_rejected_insufficient_amount': {
      title: 'Saldo insuficiente',
      message: 'Seu cartão não possui saldo suficiente para esta compra.',
      icon: <CreditCard className="w-10 h-10 text-red-500" />,
      suggestion: 'Verifique o saldo disponível ou tente com outro cartão.'
    },
    'cc_rejected_max_attempts': {
      title: 'Limite de tentativas excedido',
      message: 'Você atingiu o limite de tentativas permitidas.',
      icon: <Ban className="w-10 h-10 text-red-500" />,
      suggestion: 'Aguarde alguns minutos e tente novamente ou use outro cartão.'
    },
    
    // Erros de segurança
    'cc_rejected_high_risk': {
      title: 'Pagamento recusado por segurança',
      message: 'O sistema de segurança do Mercado Pago identificou esta transação como potencialmente arriscada.',
      icon: <ShieldX className="w-10 h-10 text-red-500" />,
      suggestion: 'Isso pode acontecer em primeira compra. Tente com outro cartão ou entre em contato com seu banco.'
    },
    'cc_rejected_blacklist': {
      title: 'Cartão bloqueado',
      message: 'Este cartão não pode ser utilizado para pagamentos.',
      icon: <Ban className="w-10 h-10 text-red-500" />,
      suggestion: 'Entre em contato com seu banco ou use outro cartão.'
    },
    'cc_rejected_bad_filled_security_code': {
      title: 'Código de segurança inválido',
      message: 'O código de segurança (CVV) informado está incorreto.',
      icon: <AlertTriangle className="w-10 h-10 text-red-500" />,
      suggestion: 'Verifique o código de 3 dígitos no verso do cartão e tente novamente.'
    },
    'cc_rejected_bad_filled_date': {
      title: 'Data de validade inválida',
      message: 'A data de validade do cartão está incorreta ou expirada.',
      icon: <Clock className="w-10 h-10 text-red-500" />,
      suggestion: 'Verifique a data de validade impressa no cartão.'
    },
    'cc_rejected_bad_filled_card_number': {
      title: 'Número do cartão inválido',
      message: 'O número do cartão informado está incorreto.',
      icon: <CreditCard className="w-10 h-10 text-red-500" />,
      suggestion: 'Verifique o número do cartão e tente novamente.'
    },
    'cc_rejected_bad_filled_other': {
      title: 'Dados incorretos',
      message: 'Alguma informação do cartão foi preenchida incorretamente.',
      icon: <AlertTriangle className="w-10 h-10 text-red-500" />,
      suggestion: 'Revise todos os dados do cartão e tente novamente.'
    },
    
    // Erros do banco/emissor
    'cc_rejected_call_for_authorize': {
      title: 'Autorização necessária',
      message: 'Você precisa autorizar esta compra junto ao seu banco.',
      icon: <CreditCard className="w-10 h-10 text-amber-500" />,
      suggestion: 'Ligue para o número no verso do cartão e autorize compras online.'
    },
    'cc_rejected_card_disabled': {
      title: 'Cartão desabilitado',
      message: 'Seu cartão está desabilitado para compras online.',
      icon: <Ban className="w-10 h-10 text-red-500" />,
      suggestion: 'Entre em contato com seu banco para habilitar compras pela internet.'
    },
    'cc_rejected_duplicated_payment': {
      title: 'Pagamento duplicado',
      message: 'Você já realizou um pagamento com este valor recentemente.',
      icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
      suggestion: 'Aguarde alguns minutos antes de tentar novamente.'
    },
    'cc_rejected_card_error': {
      title: 'Erro no cartão',
      message: 'Não foi possível processar o pagamento com este cartão.',
      icon: <CreditCard className="w-10 h-10 text-red-500" />,
      suggestion: 'Tente novamente ou use outro cartão.'
    },
    
    // Outros erros
    'cc_rejected_other_reason': {
      title: 'Pagamento recusado',
      message: 'O pagamento foi recusado pelo banco emissor do cartão.',
      icon: <XCircle className="w-10 h-10 text-red-500" />,
      suggestion: 'Entre em contato com seu banco ou tente com outro cartão.'
    },
    'rejected_by_bank': {
      title: 'Recusado pelo banco',
      message: 'Seu banco recusou esta transação.',
      icon: <XCircle className="w-10 h-10 text-red-500" />,
      suggestion: 'Entre em contato com seu banco para mais informações.'
    },
    'rejected_by_regulations': {
      title: 'Transação não permitida',
      message: 'Esta transação não é permitida pelas regras do seu banco.',
      icon: <Ban className="w-10 h-10 text-red-500" />,
      suggestion: 'Verifique com seu banco ou use outro método de pagamento.'
    }
  };

  return errorMap[statusDetail || ''] || {
    title: 'Pagamento não aprovado',
    message: 'Houve um problema com seu pagamento.',
    icon: <XCircle className="w-10 h-10 text-red-500" />,
    suggestion: 'Tente novamente ou use outro método de pagamento.'
  };
};

const AssinaturaCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();
  const [status, setStatus] = useState<'loading' | 'success' | 'failure' | 'pending'>('loading');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    const checkPayment = async () => {
      // Parâmetros do Mercado Pago
      const preapprovalId = searchParams.get('preapproval_id');
      const mpStatus = searchParams.get('status');
      const statusDetail = searchParams.get('status_detail');
      
      console.log('Callback params:', { preapprovalId, mpStatus, statusDetail });

      // Salvar o detalhe do erro se houver
      if (statusDetail) {
        setErrorDetail(statusDetail);
      }

      // Dar um tempo para o webhook processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar status de assinatura
      await refreshSubscription();

      if (mpStatus === 'authorized' || mpStatus === 'approved') {
        setStatus('success');
      } else if (mpStatus === 'pending') {
        setStatus('pending');
      } else if (mpStatus === 'failure' || mpStatus === 'rejected') {
        setStatus('failure');
      } else {
        // Se não houver status claro, verificar a assinatura
        setStatus('pending');
      }
    };

    checkPayment();
  }, [searchParams, refreshSubscription]);

  const errorDetails = getPaymentErrorDetails(errorDetail);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 -mx-8 -my-0">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">Processando pagamento...</h1>
            <p className="text-zinc-400">Aguarde enquanto confirmamos sua assinatura</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </motion.div>
            <h1 className="text-2xl font-bold">Parabéns! Você é Premium!</h1>
            <p className="text-zinc-400">
              Sua assinatura foi ativada com sucesso. Aproveite todos os recursos premium do Direito Premium!
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold py-6 rounded-xl"
            >
              Começar a usar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {status === 'pending' && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold">Pagamento em análise</h1>
            <p className="text-zinc-400">
              Seu pagamento está sendo processado. Assim que for confirmado, você terá acesso a todos os recursos premium.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Voltar ao início
              </Button>
              <Button 
                onClick={() => navigate('/minha-assinatura')}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-black"
              >
                Ver status
              </Button>
            </div>
          </div>
        )}

        {status === 'failure' && (
          <div className="space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center"
            >
              {errorDetails.icon}
            </motion.div>
            <h1 className="text-2xl font-bold">{errorDetails.title}</h1>
            <p className="text-zinc-400">
              {errorDetails.message}
            </p>
            
            {/* Box com sugestão */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-left">
              <p className="text-sm text-zinc-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span><strong>Sugestão:</strong> {errorDetails.suggestion}</span>
              </p>
            </div>

            {/* Código do erro para referência */}
            {errorDetail && (
              <p className="text-xs text-zinc-600">
                Código: {errorDetail}
              </p>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Voltar ao início
              </Button>
              <Button 
                onClick={() => navigate('/assinatura')}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-black"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AssinaturaCallback;
