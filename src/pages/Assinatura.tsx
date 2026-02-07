import { useState } from "react";
import { Shield, ArrowLeft, MessageCircle, BookOpen, Bot, Sparkles, BadgeCheck, Ban, Scale, Headphones, FileText, Check, Gavel, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PlanConfig {
  price: number;
  label: string;
  days: number;
  badge: string | null;
  featured?: boolean;
  savings?: string;
}

const PLANS: Record<PlanType, PlanConfig> = {
  vitalicio: { price: 89.90, label: 'Vitalício', days: 36500, badge: 'OFERTA ESPECIAL', featured: true }
};

// Benefícios para o marquee infinito - mais compacto
const BENEFIT_ITEMS = [
  { icon: BookOpen, text: "+30.000 questões" },
  { icon: Bot, text: "IA Evelyn 24h" },
  { icon: Ban, text: "Sem anúncios" },
  { icon: BadgeCheck, text: "Vade Mecum" },
  { icon: Headphones, text: "Audioaulas" },
  { icon: Scale, text: "Súmulas" },
  { icon: FileText, text: "Petições" },
  { icon: Sparkles, text: "Acesso vitalício" },
];

// Lista de funcionalidades
const FUNCIONALIDADES = [
  "Acesso completo e ilimitado ao app",
  "Experiência 100% sem anúncios",
  "Acesso antecipado a novos recursos",
  "Sincronização em todos os dispositivos",
  "Suporte prioritário via WhatsApp",
  "Professora IA Evelyn disponível 24h",
  "Vade Mecum completo com +50 leis",
  "+30.000 questões OAB comentadas",
  "Flashcards inteligentes",
  "Mapas mentais",
  "Modelos de petições profissionais",
];
const Assinatura = () => {
  const [contentTab, setContentTab] = useState<"sobre" | "funcoes">("sobre");
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

          {/* Headline persuasivo - mais compacto */}
          <div className="text-center mt-4 sm:mt-6 mb-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
              Domine o Direito. Conquiste a Aprovação.
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-sm mx-auto">
              Acesso vitalício a todo o conteúdo para se tornar um jurista de excelência.
            </p>
          </div>

          {/* Marquee de benefícios - mais discreto */}
          <div className="relative overflow-hidden mb-4 py-1.5">
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
            
            <motion.div
              className="flex gap-3 whitespace-nowrap"
              animate={{ x: [-800, 0] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 25,
                  ease: "linear",
                },
              }}
            >
              {[...BENEFIT_ITEMS, ...BENEFIT_ITEMS, ...BENEFIT_ITEMS].map((benefit, index) => (
                <div 
                  key={`${benefit.text}-${index}`}
                  className="flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/30 rounded-full px-2.5 py-1 flex-shrink-0"
                >
                  <benefit.icon className="w-2.5 h-2.5 text-amber-500" />
                  <span className="text-zinc-500 text-[10px]">{benefit.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Card do Plano Vitalício */}
          <div className="max-w-sm mx-auto px-2">
            <PlanoCardNovo
              planKey="vitalicio"
              plan={PLANS.vitalicio}
              imagemUrl={planImages.vitalicio}
              imagemLoading={imagesLoading}
              onVerMais={() => setModalPlano('vitalicio')}
              delay={0.2}
            />
          </div>

          {/* Selo de segurança */}
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] mt-5 mb-4">
            <div className="flex items-center gap-1.5 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/40 rounded-full px-3 py-1.5">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span>Pagamento seguro via Mercado Pago</span>
            </div>
          </div>

          {/* Toggle Sobre / Funções */}
          <div className="max-w-sm mx-auto px-2">
            <ToggleGroup 
              type="single" 
              value={contentTab} 
              onValueChange={(value) => value && setContentTab(value as "sobre" | "funcoes")}
              className="w-full bg-zinc-900/60 rounded-xl p-1 mb-3"
            >
              <ToggleGroupItem 
                value="sobre" 
                className="flex-1 data-[state=on]:bg-amber-500 data-[state=on]:text-black rounded-lg py-2 text-xs font-medium transition-all text-zinc-400"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Sobre
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="funcoes" 
                className="flex-1 data-[state=on]:bg-amber-500 data-[state=on]:text-black rounded-lg py-2 text-xs font-medium transition-all text-zinc-400"
              >
                <Gavel className="w-3.5 h-3.5 mr-1.5" />
                Funções
              </ToggleGroupItem>
            </ToggleGroup>

            <AnimatePresence mode="wait">
              {contentTab === "sobre" ? (
                <motion.div
                  key="sobre"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.25 }}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4"
                >
                  <p className="text-sm text-zinc-200 mb-4 leading-relaxed">
                    O <strong className="text-amber-400">Direito Premium</strong> é sua plataforma completa para dominar o universo jurídico. Tenha acesso a:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">IA Evelyn 24h</h4>
                        <p className="text-[11px] text-zinc-400">Sua professora particular disponível a qualquer hora para tirar dúvidas.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Scale className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">Vade Mecum Completo</h4>
                        <p className="text-[11px] text-zinc-400">+50 leis atualizadas, Constituição comentada e súmulas dos tribunais.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">Trilhas OAB & Aprender</h4>
                        <p className="text-[11px] text-zinc-400">Roteiros de estudo organizados para sua aprovação na OAB e concursos.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">Biblioteca Jurídica</h4>
                        <p className="text-[11px] text-zinc-400">Livros, flashcards, mapas mentais, audioaulas e modelos de petições.</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-amber-400/80 text-center mt-4 font-medium">
                    Pague uma vez, acesso para sempre. 💼
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="funcoes"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25 }}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3"
                >
                  <div className="space-y-1.5 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {FUNCIONALIDADES.map((texto) => (
                      <div
                        key={texto}
                        className="flex items-center gap-2 py-0.5"
                      >
                        <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                        <span className="text-xs text-zinc-400">{texto}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
