import { Check, Sparkles, ChevronRight, ArrowRight } from "lucide-react";
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

// Taxas do Mercado Pago "Na Hora" até R$3mil para parcelamento
const INSTALLMENT_RATE_10X = 0.2024;

// Função para calcular parcela
const calculateInstallment = (price: number, installments: number) => {
  const rate = installments > 1 ? INSTALLMENT_RATE_10X : 0;
  const total = price * (1 + rate);
  return total / installments;
};

const PlanoCardNovo = ({ 
  planKey, 
  plan, 
  imagemUrl, 
  imagemLoading,
  onVerMais, 
  delay = 0 
}: PlanoCardNovoProps) => {
  const isFeatured = plan.featured;
  const isMensal = planKey === 'mensal';
  
  // Calcular parcela para planos que permitem parcelamento
  const installmentValue = isMensal ? null : calculateInstallment(plan.price, 10);

  return (
    <motion.div 
      className="relative group"
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
        
        {/* Imagem de fundo cobrindo todo o card - lado direito, com gradiente de transparência */}
        <div className="absolute inset-0 overflow-hidden">
          {imagemLoading || !imagemUrl ? (
            <Skeleton className="absolute right-0 top-0 w-2/3 h-full bg-zinc-800/30" />
          ) : (
            <>
              <img
                src={imagemUrl}
                alt={`Plano ${plan.label}`}
                className="absolute right-0 top-0 h-full w-3/4 object-cover object-top opacity-30"
              />
              {/* Gradiente que faz a esquerda mais transparente e direita mais visível */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900/40" />
            </>
          )}
        </div>

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

        {/* Conteúdo do card */}
        <div className={`relative z-10 p-5 sm:p-6 ${plan.badge ? 'pt-10' : ''}`}>
          
          {/* Header */}
          <div className="mb-4">
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
              {planKey === 'mensal' && 'Renovação mensal'}
              {planKey === 'anual' && 'Acesso por 1 ano completo'}
              {planKey === 'vitalicio' && 'Acesso vitalício para sempre'}
            </p>
          </div>

          {/* Preços */}
          <div className={`rounded-xl px-4 py-3 mb-5 ${
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
              <span className="text-zinc-500 text-sm">
                {isMensal ? '/mês' : 'à vista'}
              </span>
            </div>
            
            {/* Opção de parcelamento - só para anual e vitalício */}
            {!isMensal && installmentValue && (
              <p className="text-zinc-400 text-xs">
                ou <span className="text-amber-400 font-semibold">10x de R$ {installmentValue.toFixed(2).replace('.', ',')}</span> no cartão
              </p>
            )}
            
            {/* Texto para mensal */}
            {isMensal && (
              <p className="text-zinc-400 text-xs">
                Apenas cartão de crédito
              </p>
            )}
          </div>

          {/* Botão */}
          <Button 
            onClick={onVerMais}
            className={`w-full rounded-xl transition-all duration-300 text-sm font-semibold h-12 group ${
              isFeatured 
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/25'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
            }`}
          >
            <span>Ver mais detalhes</span>
            <motion.span
              className="ml-2 inline-flex"
              animate={{ x: [0, 4, 0] }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanoCardNovo;
