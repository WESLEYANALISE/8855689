import { Check, Sparkles, ChevronRight } from "lucide-react";
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
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.6,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      {/* Glow effect for featured */}
      {isFeatured && (
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/40 via-amber-400/30 to-amber-500/40 rounded-3xl blur-lg opacity-60 group-hover:opacity-100 transition duration-500" />
      )}
      
      <div className={`relative overflow-hidden rounded-2xl transition-all duration-300 h-full ${
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

        {/* Layout horizontal: conteúdo à esquerda, imagem à direita */}
        <div className="flex h-full min-h-[220px]">
          {/* Conteúdo à esquerda */}
          <div className={`flex-1 p-5 sm:p-6 flex flex-col justify-between ${plan.badge ? 'pt-10' : ''}`}>
            
            {/* Header */}
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
                {planKey === 'vitalicio' ? 'Acesso vitalício para sempre' : 'Cobrança mensal recorrente'}
              </p>
            </div>

            {/* Preço em destaque */}
            <div className="my-4 sm:my-5">
              <div className={`inline-block rounded-xl px-4 py-3 ${
                isFeatured 
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent' 
                  : 'bg-zinc-800/50'
              }`}>
                <div className="flex items-baseline gap-1">
                  <span className="text-zinc-400 text-sm font-medium">R$</span>
                  <span className={`font-extrabold ${
                    isFeatured 
                      ? 'text-3xl sm:text-4xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent' 
                      : 'text-2xl sm:text-3xl text-white'
                  }`}>
                    {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  {planKey === 'mensal' && (
                    <span className="text-zinc-500 text-sm">/mês</span>
                  )}
                </div>
              </div>
              
              {plan.savings && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-semibold">
                    Economize {plan.savings}
                  </span>
                </div>
              )}
            </div>

            {/* Botão */}
            <Button 
              onClick={onVerMais}
              className={`w-full rounded-xl transition-all duration-300 text-sm font-semibold h-11 ${
                isFeatured 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-500/25'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
              }`}
            >
              Ver mais
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Imagem à direita - corpo inteiro cortado */}
          <div className="relative w-28 sm:w-36 lg:w-40 flex-shrink-0 overflow-hidden">
            {imagemLoading || !imagemUrl ? (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-zinc-800 to-zinc-900">
                <Skeleton className="absolute inset-0 bg-zinc-800/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-amber-500/50 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            ) : (
              <>
                <img
                  src={imagemUrl}
                  alt={`Plano ${plan.label}`}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                {/* Gradiente para integrar com o card */}
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanoCardNovo;
