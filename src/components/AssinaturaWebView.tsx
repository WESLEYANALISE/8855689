import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Lock, MoreVertical, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PremiumSuccessCard from "./PremiumSuccessCard";
import { useDeviceType } from "@/hooks/use-device-type";

interface AssinaturaWebViewProps {
  url: string;
  onClose?: () => void;
  planType?: string;
  amount?: number;
}

export default function AssinaturaWebView({ 
  url, 
  onClose,
  planType = 'mensal',
  amount = 21.90
}: AssinaturaWebViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<{
    planType: string;
    amount: number;
  } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isDesktop } = useDeviceType();

  // Extrair o domínio da URL
  const getDomain = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      return urlString;
    }
  };

  const domain = getDomain(url);

  // Listener de Realtime para detectar pagamento aprovado
  useEffect(() => {
    if (!user?.id) return;

    console.log('Iniciando listener Realtime para pagamentos do usuário:', user.id);

    const channel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Subscription update received:', payload);
          const newStatus = payload.new?.status;
          
          if (newStatus === 'authorized') {
            console.log('Pagamento aprovado! Mostrando card de sucesso.');
            setSubscriptionData({
              planType: payload.new?.plan_type || planType,
              amount: payload.new?.amount || amount
            });
            setPaymentSuccess(true);
            refreshSubscription();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New subscription received:', payload);
          const newStatus = payload.new?.status;
          
          if (newStatus === 'authorized') {
            console.log('Nova assinatura aprovada! Mostrando card de sucesso.');
            setSubscriptionData({
              planType: payload.new?.plan_type || planType,
              amount: payload.new?.amount || amount
            });
            setPaymentSuccess(true);
            refreshSubscription();
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription channel status:', status);
      });

    return () => {
      console.log('Removendo listener Realtime');
      supabase.removeChannel(channel);
    };
  }, [user?.id, planType, amount, refreshSubscription]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
    
    // Tenta detectar redirecionamento para callback (não funciona cross-origin, mas mantemos)
    try {
      const iframeUrl = iframeRef.current?.contentWindow?.location.href;
      if (iframeUrl?.includes('/assinatura/callback')) {
        navigate(iframeUrl.replace(window.location.origin, ''));
      }
    } catch {
      // Cross-origin bloqueia, comportamento esperado
    }
  };

  const handleSuccessClose = () => {
    setPaymentSuccess(false);
    handleClose();
  };

  // Layout Desktop - Centralizado com modal style
  if (isDesktop) {
    return (
      <>
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-8">
          <div className="w-full max-w-4xl h-[85vh] flex flex-col bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
            {/* Header com barra de URL estilo navegador */}
            <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
              {/* Botão Fechar */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="shrink-0 h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Indicador de Check */}
              <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-500" />
              </div>

              {/* Barra de URL */}
              <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2 min-w-0">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-zinc-300 truncate">{domain}</span>
              </div>

              {/* Menu de opções */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    A conexão é segura
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* WebView (iframe) */}
            <div className="flex-1 relative bg-white overflow-hidden">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                    <span className="text-base text-zinc-400">Carregando checkout seguro...</span>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={url}
                className="absolute inset-0 w-full h-full border-0"
                onLoad={handleIframeLoad}
                title="Checkout de Assinatura"
                allow="payment"
                style={{ 
                  minHeight: '100%',
                  minWidth: '100%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Card de sucesso flutuante */}
        <PremiumSuccessCard
          isVisible={paymentSuccess}
          planType={subscriptionData?.planType || planType}
          amount={subscriptionData?.amount || amount}
          onClose={handleSuccessClose}
        />
      </>
    );
  }

  // Layout Mobile/Tablet - Fullscreen
  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-black z-50">
        {/* Header com barra de URL estilo navegador */}
        <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800 px-2 sm:px-3 py-2 flex items-center gap-2 sm:gap-3 safe-area-top">
          {/* Botão Fechar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0 h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Indicador de Check */}
          <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          </div>

          {/* Barra de URL */}
          <div className="flex-1 flex items-center gap-1.5 sm:gap-2 bg-zinc-800 rounded-full px-2 sm:px-3 py-1.5 min-w-0">
            <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500 shrink-0" />
            <span className="text-xs sm:text-sm text-zinc-300 truncate">{domain}</span>
          </div>

          {/* Menu de opções */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                A conexão é segura
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* WebView (iframe) - ocupa todo o espaço restante */}
        <div className="flex-1 relative bg-white overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="text-sm text-zinc-400">Carregando checkout...</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            onLoad={handleIframeLoad}
            title="Checkout de Assinatura"
            allow="payment"
            style={{ 
              minHeight: '100%',
              minWidth: '100%'
            }}
          />
        </div>
      </div>

      {/* Card de sucesso flutuante */}
      <PremiumSuccessCard
        isVisible={paymentSuccess}
        planType={subscriptionData?.planType || planType}
        amount={subscriptionData?.amount || amount}
        onClose={handleSuccessClose}
      />
    </>
  );
}
