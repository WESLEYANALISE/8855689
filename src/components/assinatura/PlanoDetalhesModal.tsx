import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Loader2, Crown, CreditCard, X, Gavel, GraduationCap, Target, Briefcase, ChevronDown, Sparkles, BookOpen, Brain, Scale, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckoutCartaoModal } from "./CheckoutCartaoModal";
import { useAppStatistics } from "@/hooks/useAppStatistics";
import { usePlanAnalytics } from "@/hooks/usePlanAnalytics";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import type { PlanType } from "@/hooks/use-mercadopago-pix";

// Imagens horizontais estáticas importadas localmente (pré-carregadas)
import assinaturaVitalicioHorizontal from "@/assets/assinatura-vitalicio-horizontal.webp";
import assinaturaMensalHorizontal from "@/assets/assinatura-mensal-horizontal.webp";
import assinaturaAnualHorizontal from "@/assets/assinatura-trimestral-horizontal.webp"; // Reutilizar para anual

const CAPAS_HORIZONTAIS_ESTATICAS: Record<PlanType, string> = {
  mensal: assinaturaMensalHorizontal,
  anual: assinaturaAnualHorizontal,
  vitalicio: assinaturaVitalicioHorizontal,
};

interface PlanConfig {
  price: number;
  label: string;
  days: number;
  badge: string | null;
  featured?: boolean;
  savings?: string;
}

interface PlanoDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano: PlanType | null;
  planConfig: PlanConfig | null;
  imagemUrl: string | null;
  imagemLoading: boolean;
  onPagar: () => void;
  loading: boolean;
  userId?: string;
  userEmail?: string;
  onPaymentSuccess: () => void;
}

// Função para gerar lista dinâmica de funcionalidades com estatísticas reais
const gerarFuncionalidades = (stats: ReturnType<typeof useAppStatistics>['statistics']) => [
  "Acesso completo e ilimitado ao app",
  "Experiência 100% sem anúncios",
  "Acesso antecipado a novos recursos",
  "Sincronização em todos os dispositivos",
  "Suporte prioritário via WhatsApp",
  "Professora IA Evelyn disponível 24h",
  "Chat inteligente com respostas jurídicas",
  "Vade Mecum completo com +50 leis",
  "Constituição Federal comentada",
  "Código Civil, Penal, CPC e CPP",
  "CLT e legislação trabalhista",
  "Súmulas do STF, STJ, TST e TSE",
  `+${stats.livrosTotal.toLocaleString('pt-BR')} livros na biblioteca`,
  `+${stats.videoaulas.toLocaleString('pt-BR')} videoaulas`,
  `+${stats.audioaulas.toLocaleString('pt-BR')} audioaulas`,
  `+${stats.flashcards.toLocaleString('pt-BR')} flashcards inteligentes`,
  `+${stats.questoesOAB.toLocaleString('pt-BR')} questões OAB comentadas`,
  "Simulados completos estilo prova",
  `+${stats.resumos.toLocaleString('pt-BR')} resumos disponíveis`,
  `+${stats.mapasMentais.toLocaleString('pt-BR')} mapas mentais`,
  `+${stats.casosSimulacao} casos práticos simulados`,
  "Modelos de petições profissionais",
  "Notícias jurídicas em tempo real",
  "JuriFlix - Documentários jurídicos",
];

// Conteúdo persuasivo "Sobre" para cada perfil
const conteudoSobre = {
  estudante: {
    icon: GraduationCap,
    titulo: "Para Estudantes de Direito",
    descricao: "Transforme sua jornada acadêmica com ferramentas que aceleram seu aprendizado.",
    exemplos: [
      {
        titulo: "Domine as matérias",
        texto: "Use a Professora IA Evelyn para tirar dúvidas sobre qualquer artigo de lei às 2h da manhã, antes da prova. Ela explica de forma técnica ou descomplicada, você escolhe."
      },
      {
        titulo: "Estude em qualquer lugar",
        texto: "Ouça audioaulas no ônibus, use flashcards no intervalo das aulas. Todo o conteúdo sincronizado entre celular e computador."
      },
      {
        titulo: "Prepare-se para seminários",
        texto: "Acesse jurisprudência atualizada, súmulas e doutrinas para fundamentar seus trabalhos acadêmicos com autoridade."
      },
      {
        titulo: "Construa base sólida",
        texto: "Mapas mentais e resumos por área do Direito ajudam a conectar conceitos e entender o sistema jurídico como um todo."
      }
    ]
  },
  concurseiro: {
    icon: Target,
    titulo: "Para Concurseiros",
    descricao: "Maximize sua performance com método e tecnologia de ponta.",
    exemplos: [
      {
        titulo: "Questões comentadas",
        texto: "Mais de 30.000 questões de concursos anteriores com gabarito comentado. Filtre por banca, área ou nível de dificuldade."
      },
      {
        titulo: "Simulados cronometrados",
        texto: "Treine nas mesmas condições da prova real. Estatísticas detalhadas mostram onde você precisa melhorar."
      },
      {
        titulo: "Vade Mecum X",
        texto: "Vade Mecum com marcação de artigos mais cobrados, narração em áudio e explicações da IA para artigos complexos."
      },
      {
        titulo: "Cronograma inteligente",
        texto: "O sistema analisa seu desempenho e sugere um plano de estudos personalizado, focando nos seus pontos fracos."
      },
      {
        titulo: "Revisão por repetição espaçada",
        texto: "Flashcards com algoritmo que identifica o que você está esquecendo e traz de volta na hora certa."
      }
    ]
  },
  advogado: {
    icon: Briefcase,
    titulo: "Para Advogados",
    descricao: "Agilize sua rotina profissional e impressione seus clientes.",
    exemplos: [
      {
        titulo: "Consulta rápida de legislação",
        texto: "Encontre qualquer artigo em segundos. Vade Mecum sempre atualizado com as últimas alterações legislativas."
      },
      {
        titulo: "Modelos de petições",
        texto: "Templates profissionais para iniciais, recursos, contratos e mais. Personalize com seus dados e do cliente."
      },
      {
        titulo: "Jurisprudência atualizada",
        texto: "Decisões recentes do STF, STJ e tribunais regionais. Fundamente suas peças com autoridade."
      },
      {
        titulo: "Localizador de fóruns",
        texto: "Encontre endereços, telefones e horários de funcionamento de fóruns, cartórios e órgãos públicos."
      },
      {
        titulo: "Atualização contínua",
        texto: "Boletins jurídicos diários com as principais novidades: novas leis, súmulas e decisões que impactam sua área."
      },
      {
        titulo: "Simulação de audiências",
        texto: "Treine argumentação oral e prepare-se para sustentações com cenários realistas gerados por IA."
      }
    ]
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

const PlanoDetalhesModal = ({ 
  open, 
  onOpenChange, 
  plano, 
  planConfig,
  imagemUrl, 
  imagemLoading,
  onPagar,
  loading,
  userId,
  userEmail,
  onPaymentSuccess
}: PlanoDetalhesModalProps) => {
  // Estatísticas do app para lista dinâmica
  const { statistics } = useAppStatistics();
  const { trackPlanClick } = usePlanAnalytics();
  const { trackEvent } = useFacebookPixel();
  const funcionalidades = gerarFuncionalidades(statistics);

  // Aba de conteúdo: funções ou sobre
  const [contentTab, setContentTab] = useState<"funcoes" | "sobre">("funcoes");

  // Plano mensal só aceita cartão
  const showPixOption = plano !== 'mensal';
  
  // Método de pagamento: pix ou cartao (mensal força cartão)
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao">(showPixOption ? "pix" : "cartao");
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState(plano === 'mensal' ? 1 : 10);

  // Usar capa estática diretamente
  const staticCover = plano ? CAPAS_HORIZONTAIS_ESTATICAS[plano] : null;

  // Calcular valor da parcela
  const calculateInstallment = (installments: number) => {
    const rate = INSTALLMENT_RATES[installments] || 0;
    const total = (planConfig?.price || 89.90) * (1 + rate);
    const perInstallment = total / installments;
    return { total, perInstallment };
  };

  // Reset ao fechar e configurar método de pagamento baseado no plano
  useEffect(() => {
    if (open && plano) {
      setContentTab("funcoes");
      // Mensal só aceita cartão
      const canUsePix = plano !== 'mensal';
      setPaymentMethod(canUsePix ? "pix" : "cartao");
      setSelectedInstallments(plano === 'mensal' ? 1 : 10);
      // Track modal open
      trackPlanClick(plano, "open_modal");
      // Facebook AddToCart event
      trackEvent('AddToCart', {
        content_name: `Plano ${plano === 'vitalicio' ? 'Vitalício' : plano === 'anual' ? 'Anual' : 'Mensal'}`,
        content_type: 'product',
        currency: 'BRL',
        value: planConfig?.price || 89.90,
      });
    }
    if (!open) {
      setShowCardModal(false);
    }
  }, [open, plano]);

  const handlePaymentClick = () => {
    if (plano) {
      // Facebook InitiateCheckout event
      trackEvent('InitiateCheckout', {
        content_name: `Plano ${planConfig?.label}`,
        currency: 'BRL',
        value: planConfig?.price || 89.90,
        payment_method: paymentMethod,
      });

      if (paymentMethod === "pix") {
        trackPlanClick(plano, "select_pix");
        onPagar();
      } else {
        trackPlanClick(plano, "select_card");
        setShowCardModal(true);
      }
    }
  };

  const handleCardSuccess = () => {
    setShowCardModal(false);
    onOpenChange(false);
    onPaymentSuccess();
  };

  if (!plano || !planConfig) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md p-0 gap-0 bg-zinc-950 border-zinc-800 overflow-hidden rounded-2xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.35, 
            ease: [0.32, 0.72, 0, 1]
          }}
          className="w-full"
        >

        {/* Botão X para fechar */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Imagem de capa horizontal - estática, pré-carregada */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={staticCover || imagemUrl || ''}
            alt={`Plano ${planConfig.label}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          
          {/* Header over image */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-amber-500 text-xs font-medium">Plano Premium</span>
            </div>
            <h2 className="text-xl font-bold text-white">{planConfig.label}</h2>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white">
                R$ {planConfig.price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-zinc-400 text-xs">
                / {planConfig.days >= 365 ? 'para sempre' : `${planConfig.days} dias`}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Savings badge */}
          {planConfig.savings && (
            <div className="mb-4 flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-1.5">
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-400 text-xs">
                Economia de {planConfig.savings}
              </span>
            </div>
          )}

          {/* Toggle PIX / Cartão - só mostra se PIX disponível */}
          {showPixOption ? (
            <ToggleGroup 
              type="single" 
              value={paymentMethod} 
              onValueChange={(value) => value && setPaymentMethod(value as "pix" | "cartao")}
              className="w-full bg-zinc-900/80 rounded-xl p-1 mb-4"
            >
              <ToggleGroupItem 
                value="pix" 
                className="flex-1 data-[state=on]:bg-amber-500 data-[state=on]:text-black rounded-lg py-2.5 text-sm font-medium transition-all text-zinc-400"
              >
                <Zap className="w-4 h-4 mr-2" />
                PIX
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="cartao" 
                className="flex-1 data-[state=on]:bg-amber-500 data-[state=on]:text-black rounded-lg py-2.5 text-sm font-medium transition-all text-zinc-400"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Cartão
              </ToggleGroupItem>
            </ToggleGroup>
          ) : (
            <div className="w-full bg-zinc-900/80 rounded-xl p-3 mb-4 flex items-center justify-center gap-2 text-zinc-300">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Pagamento via Cartão</span>
            </div>
          )}

          {/* Informações de pagamento baseado no método */}
          <AnimatePresence mode="wait">
            {paymentMethod === "pix" ? (
              <motion.div
                key="pix-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
              >
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
                  <Zap className="w-4 h-4" />
                  R$ {planConfig.price.toFixed(2).replace('.', ',')} à vista
                </div>
                <p className="text-zinc-400 text-xs">Aprovação instantânea • Melhor preço</p>
              </motion.div>
            ) : (
              <motion.div
                key="card-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4"
              >
                {/* Seletor de parcelas */}
                <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 space-y-2">
                  <p className="text-zinc-400 text-xs font-medium mb-2">Escolha as parcelas:</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const { total, perInstallment } = calculateInstallment(num);
                      const isSelected = selectedInstallments === num;
                      return (
                        <button
                          key={num}
                          onClick={() => setSelectedInstallments(num)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all ${
                            isSelected 
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' 
                              : 'bg-zinc-800/50 border border-transparent text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <span className="font-medium">
                            {num}x de R$ {perInstallment.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {num === 1 ? '(sem juros)' : `(total: R$ ${total.toFixed(2).replace('.', ',')})`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão de pagamento principal - premium design */}
          <div className="h-14">
            {loading ? (
              <div className="w-full h-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-400/30">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5 text-black" />
                </motion.div>
                <span className="text-black font-bold text-base">
                  {paymentMethod === "pix" ? "Gerando PIX..." : "Processando..."}
                </span>
              </div>
            ) : (
              <Button 
                onClick={handlePaymentClick}
                className="w-full h-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:via-amber-300 hover:to-yellow-400 text-black font-bold text-base shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] border border-amber-400/30 transition-all duration-300 group relative overflow-hidden"
              >
                <span className="flex items-center justify-center">
                  {paymentMethod === "pix" ? (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Pagar com PIX
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar com Cartão
                    </>
                  )}
                </span>
                <motion.div
                  className="absolute right-4"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Button>
            )}
          </div>

        </div>
        </motion.div>
      </DialogContent>

      {/* Modal separado para checkout de cartão */}
      {userId && userEmail && plano && planConfig && (
        <CheckoutCartaoModal
          open={showCardModal}
          onOpenChange={setShowCardModal}
          amount={calculateInstallment(selectedInstallments).total}
          planType={plano}
          planLabel={planConfig.label}
          userEmail={userEmail}
          userId={userId}
          onSuccess={handleCardSuccess}
          installments={selectedInstallments}
        />
      )}
    </Dialog>
  );
};

export default PlanoDetalhesModal;
