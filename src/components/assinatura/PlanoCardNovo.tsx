import { Check, Sparkles, ChevronRight, BookOpen, Bot, Ban, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { PlanType } from "@/hooks/use-mercadopago-pix";

interface PlanConfig {
  price: number;
  label: string;
  days: number;
  badge: string | null;
  featured?: boolean;
  savings?: string;
}

interface PlanoCardNovoProps {
  planKey: PlanType;
  plan: PlanConfig;
  imagemUrl: string | null;
  imagemLoading: boolean;
  onVerMais: () => void;
  delay?: number;
}

// Benefícios compactos para o card
const CARD_BENEFITS = [
  { icon: BookOpen, text: "+30.000 questões OAB" },
  { icon: Bot, text: "Professora IA 24h" },
  { icon: Ban, text: "Sem anúncios, para sempre" },
  { icon: Scale, text: "Vade Mecum completo" },
];

// Cálculo de parcela com taxa do Mercado Pago (10x = 20.24%)
const INSTALLMENT_RATE_10X = 0.2024;
const BASE_PRICE = 89.90;
const TOTAL_WITH_INTEREST = BASE_PRICE * (1 + INSTALLMENT_RATE_10X);
const INSTALLMENT_VALUE = TOTAL_WITH_INTEREST / 10;

const PlanoCardNovo = ({ 
  planKey, 
  plan, 
  imagemUrl, 
  imagemLoading,
  onVerMais, 
  delay = 0 
}: PlanoCardNovoProps) => {
  const isFeatured = plan.featured;

  return (
    <motion.div 
      className="relative group h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      {/* Glow effect for featured */}
      {isFeatured && (
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/40 via-amber-400/30 to-amber-500/40 rounded-3xl blur-lg opacity-60 group-hover:opacity-100 transition duration-500" />
      )}
      
      <div className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
        isFeatured 
          ? 'bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10' 
          : 'bg-gradient-to-br from-zinc-900/90 to-zinc-800/80 border border-zinc-700/50 hover:border-zinc-600'
      }`}>
        
        {/* Badge superior */}
        {plan.badge && (
          <div className="absolute top-0 left-0 right-0 z-20">
            <div className={`${
              isFeatured 
                ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                : 'bg-zinc-700'
            } text-black text-[10px] sm:text-xs font-bold py-1.5 text-center tracking-wider`}>
              {plan.badge}
            </div>
          </div>
        )}

        {/* Layout vertical para o card */}
        <div className={`p-5 sm:p-6 ${plan.badge ? 'pt-10' : ''}`}>
          
          {/* Header com imagem à direita */}
          <div className="flex justify-between items-start mb-4">
            <div>
              {isFeatured && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400 font-semibold tracking-wide">RECOMENDADO</span>
                </div>
              )}
              
              <h3 className={`font-bold mb-1 ${isFeatured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
                {plan.label}
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Acesso vitalício para sempre
              </p>
            </div>

            {/* Mini imagem decorativa */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0">
              {imagemLoading || !imagemUrl ? (
                <Skeleton className="absolute inset-0 bg-zinc-800/50" />
              ) : (
                <>
                  <img
                    src={imagemUrl}
                    alt={`Plano ${plan.label}`}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                </>
              )}
            </div>
          </div>

          {/* Lista de benefícios compacta */}
          <div className="space-y-2 mb-4">
            {CARD_BENEFITS.map((benefit) => (
              <div key={benefit.text} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-zinc-300 text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Preços */}
          <div className={`rounded-xl px-4 py-3 mb-4 ${
            isFeatured 
              ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/20' 
              : 'bg-zinc-800/50'
          }`}>
            {/* Preço principal */}
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-zinc-400 text-sm font-medium">R$</span>
              <span className={`font-extrabold ${
                isFeatured 
                  ? 'text-3xl sm:text-4xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent' 
                  : 'text-2xl sm:text-3xl text-white'
              }`}>
                {plan.price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-zinc-500 text-sm">à vista</span>
            </div>
            
            {/* Opção de parcelamento */}
            <p className="text-zinc-400 text-xs">
              ou <span className="text-amber-400 font-semibold">10x de R$ {INSTALLMENT_VALUE.toFixed(2).replace('.', ',')}</span> no cartão
            </p>
          </div>

          {/* Botão */}
          <Button 
            onClick={onVerMais}
            className={`w-full rounded-xl transition-all duration-300 text-sm font-semibold h-12 ${
              isFeatured 
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/25'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
            }`}
          >
            Ver mais detalhes
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanoCardNovo;
