import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Minus, ThumbsDown, Scale } from "lucide-react";
import { motion } from "framer-motion";

interface OpcaoRespostaCardProps {
  opcao: {
    texto: string;
    pontos: number;
    forca: "forte" | "media" | "fraca";
    artigos_citados?: number[];
  };
  index: number;
  onClick: () => void;
  disabled?: boolean;
}

const OpcaoRespostaCard = ({ opcao, index, onClick, disabled }: OpcaoRespostaCardProps) => {
  const forcaConfig = {
    forte: {
      icon: ThumbsUp,
      color: "bg-green-500/20 text-green-300 border-green-500/40",
      borderColor: "border-green-500/40 hover:border-green-500/70",
      label: "Forte"
    },
    media: {
      icon: Minus,
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      borderColor: "border-yellow-500/40 hover:border-yellow-500/70",
      label: "Média"
    },
    fraca: {
      icon: ThumbsDown,
      color: "bg-red-500/20 text-red-300 border-red-500/40",
      borderColor: "border-red-500/40 hover:border-red-500/70",
      label: "Fraca"
    }
  };

  const config = forcaConfig[opcao.forca];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={`cursor-pointer transition-all ${config.borderColor} bg-gray-800/60 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
        }`}
        onClick={() => !disabled && onClick()}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Badge de força */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.color} border-2 flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge className={`${config.color} text-xs flex-shrink-0`}>
                  {config.label}
                </Badge>
                <div className="text-amber-400 font-bold text-sm">
                  {opcao.pontos > 0 ? '+' : ''}{opcao.pontos} pts
                </div>
              </div>

              <p className="text-gray-200 text-sm leading-relaxed max-h-20 overflow-y-auto line-clamp-4">
                {opcao.texto}
              </p>

              {/* Artigos citados */}
              {opcao.artigos_citados && opcao.artigos_citados.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Cita {opcao.artigos_citados.length} artigo(s)</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OpcaoRespostaCard;
