import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getCorPartido } from "@/lib/partido-cores";
interface RankingCardProps {
  posicao?: number;
  posicaoAnterior?: number | null;
  deputado: {
    id: number;
    nome: string;
    siglaPartido: string;
    siglaUf: string;
    urlFoto?: string;
  };
  metrica: number | string;
  metricaLabel: string;
  onClick?: () => void;
  animationDelay?: number;
}

export const RankingCard = ({ 
  posicao, 
  posicaoAnterior, 
  deputado, 
  metricaLabel, 
  onClick,
  animationDelay = 0 
}: RankingCardProps) => {
  const getMedalha = () => {
    if (posicao === 1) return { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/20" };
    if (posicao === 2) return { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/20" };
    if (posicao === 3) return { icon: Award, color: "text-amber-600", bg: "bg-amber-600/20" };
    return null;
  };

  const getMudancaPosicao = () => {
    if (!posicao || posicaoAnterior === undefined || posicaoAnterior === null) {
      // Sem dados de posição anterior - pode ser novo
      if (posicao && posicaoAnterior === null) {
        return { tipo: 'novo', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/20', texto: 'Novo' };
      }
      return null;
    }
    
    const diferenca = posicaoAnterior - posicao; // Positivo = subiu (posição menor é melhor)
    
    if (diferenca > 0) {
      return { 
        tipo: 'subiu', 
        icon: TrendingUp, 
        color: 'text-green-400', 
        bg: 'bg-green-500/20',
        texto: `+${diferenca}`
      };
    } else if (diferenca < 0) {
      return { 
        tipo: 'desceu', 
        icon: TrendingDown, 
        color: 'text-red-400', 
        bg: 'bg-red-500/20',
        texto: `${diferenca}`
      };
    } else {
      return { 
        tipo: 'igual', 
        icon: Minus, 
        color: 'text-muted-foreground', 
        bg: 'bg-muted/20',
        texto: '—'
      };
    }
  };

  const medalha = getMedalha();
  const mudanca = getMudancaPosicao();
  const corPartido = getCorPartido(deputado.siglaPartido);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: animationDelay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <Card
        className="p-3 cursor-pointer bg-card border-border/50 hover:border-primary/30 transition-all active:scale-[0.98]"
        onClick={onClick}
      >
        <div className="flex gap-3 items-center">
          {/* Foto/Posição */}
          <div className="relative flex-shrink-0">
            {medalha && (
              <div className={`absolute -top-1 -left-1 ${medalha.bg} rounded-full p-0.5 z-10`}>
                <medalha.icon className={`w-3 h-3 ${medalha.color}`} />
              </div>
            )}
            {deputado.urlFoto ? (
              <img
                src={deputado.urlFoto}
                alt={deputado.nome}
                className="w-12 h-12 rounded-full object-cover border border-border"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                {posicao || '?'}
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {posicao && (
                <span className="text-[10px] font-medium text-muted-foreground">#{posicao}</span>
              )}
              <h3 className="font-medium text-sm truncate">{deputado.nome}</h3>
              
              {/* Indicador de mudança */}
              {mudanca && (
                <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded ${mudanca.bg}`}>
                  <mudanca.icon className={`w-2.5 h-2.5 ${mudanca.color}`} />
                  <span className={`text-[9px] font-semibold ${mudanca.color}`}>
                    {mudanca.texto}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 ${corPartido.bg} ${corPartido.text} rounded text-[10px] font-medium`}>
                {deputado.siglaPartido}
              </span>
              <span className="text-[10px] text-muted-foreground">{deputado.siglaUf}</span>
            </div>
          </div>
          
          {/* Métrica - vermelho vibrante */}
          <div className="text-right flex-shrink-0">
            <span className="font-bold text-red-500 text-sm">{metricaLabel}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
