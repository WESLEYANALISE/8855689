import { useState } from "react";
import { Shield, ArrowLeft, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import AssinaturaGerenciamento from "@/components/AssinaturaGerenciamento";
import PixPaymentScreen from "@/components/assinatura/PixPaymentScreen";
import { useMercadoPagoPix, type PlanType } from "@/hooks/use-mercadopago-pix";
import { useAssinaturaExperiencia } from "@/hooks/use-assinatura-experiencia";
import { useAssinaturaBackgroundAudio } from "@/hooks/useAssinaturaBackgroundAudio";
import AssinaturaHeroImage from "@/components/assinatura/AssinaturaHeroImage";
import AssinaturaNarracao from "@/components/assinatura/AssinaturaNarracao";
import PlanoCardNovo from "@/components/assinatura/PlanoCardNovo";
import PlanoDetalhesModal from "@/components/assinatura/PlanoDetalhesModal";
import { Button } from "@/components/ui/button";

interface PlanConfig {
  price: number;
  label: string;
  days: number;
  badge: string | null;
  featured?: boolean;
  savings?: string;
}

const PLANS: Record<PlanType, PlanConfig> = {
  mensal: { price: 17.99, label: 'Mensal', days: 30, badge: null },
  vitalicio: { price: 79.90, label: 'Vitalício', days: 36500, badge: 'MAIS POPULAR', featured: true }
};


const Assinatura = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const [loadingPlano, setLoadingPlano] = useState<PlanType | null>(null);
  const [modalPlano, setModalPlano] = useState<PlanType | null>(null);
  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();
  const { heroImage, planImages, fraseImpacto, audioBase64, imagesLoading } = useAssinaturaExperiencia();
  
  // Áudio de fundo imersivo - só toca se NÃO for premium
  const { stopAudio } = useAssinaturaBackgroundAudio(!isPremium);

  // Se for premium, mostrar tela de gerenciamento
  if (!subscriptionLoading && isPremium) {
    return <AssinaturaGerenciamento />;
  }

  // Mostrar tela de pagamento PIX se tiver dados
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
        onPaymentApproved={stopAudio}
      />
    );
  }

  const handleAssinar = async (plano: PlanType) => {
    if (!user) {
      toast({
        title: "Faça login primeiro",
        description: "Você precisa estar logado para assinar.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setLoadingPlano(plano);
    // Manter modal aberto enquanto gera o PIX
    const success = await createPix(user.id, user.email || '', plano);
    if (success) {
      setModalPlano(null); // Fechar apenas após sucesso
    }
    setLoadingPlano(null);
  };

  // Callback para parar áudio quando pagamento aprovado (sem reload)
  const handlePaymentSuccess = () => {
    stopAudio();
    setModalPlano(null);
    // Não recarrega - deixa a animação de sucesso aparecer
  };

  return (
    <div className="min-h-screen text-white relative -mx-4 sm:-mx-6 md:-mx-8 overflow-hidden">
      {/* Fundo sofisticado com gradientes */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
      
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[size:32px_32px]" />
      
      {/* Glow effects estáticos */}
      <div className="fixed top-20 left-1/4 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px] pointer-events-none opacity-40" />
      <div className="fixed bottom-20 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none opacity-30" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Botão Voltar no topo */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border border-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
      
      {/* Conteúdo principal */}
      <div className="relative z-10">
        {/* Hero Image - sem animação de entrada */}
        <AssinaturaHeroImage imageUrl={heroImage} loading={imagesLoading} />

        {/* Conteúdo principal sobreposto */}
        <div className="relative z-10 -mt-8 sm:-mt-12 md:-mt-16 lg:-mt-20 px-4 sm:px-6 md:px-8 lg:px-12 pb-8">
          {/* Frase de impacto com narração */}
          <AssinaturaNarracao 
            frase={fraseImpacto} 
            audioBase64={audioBase64} 
          />

          {/* Cards dos Planos - responsivo para desktop */}
          <div className="max-w-4xl mx-auto mt-6 sm:mt-8 px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Plano Mensal */}
              <PlanoCardNovo
                planKey="mensal"
                plan={PLANS.mensal}
                imagemUrl={planImages.mensal || planImages.vitalicio}
                imagemLoading={imagesLoading}
                onVerMais={() => setModalPlano('mensal')}
                delay={0.3}
              />
              
              {/* Plano Vitalício */}
              <PlanoCardNovo
                planKey="vitalicio"
                plan={PLANS.vitalicio}
                imagemUrl={planImages.vitalicio}
                imagemLoading={imagesLoading}
                onVerMais={() => setModalPlano('vitalicio')}
                delay={0.5}
              />
            </div>
          </div>

          {/* Selo de segurança */}
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs mt-10">
            <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-full px-4 py-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Pagamento seguro via Mercado Pago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalhes do plano */}
      <PlanoDetalhesModal
        open={!!modalPlano}
        onOpenChange={(open) => !open && setModalPlano(null)}
        plano={modalPlano}
        planConfig={modalPlano ? PLANS[modalPlano] : null}
        imagemUrl={modalPlano ? planImages[modalPlano] : null}
        imagemLoading={imagesLoading}
        onPagar={() => modalPlano && handleAssinar(modalPlano)}
        loading={loadingPlano !== null || pixLoading}
        userId={user?.id}
        userEmail={user?.email || ''}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Botão flutuante de WhatsApp para suporte */}
      <a
        href="https://wa.me/5511991897603?text=Ol%C3%A1%21%20Preciso%20de%20ajuda%20com%20a%20assinatura%20do%20Direito%20Premium."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="Suporte via WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
};

export default Assinatura;
