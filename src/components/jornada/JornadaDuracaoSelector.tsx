import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, Zap, Clock, Target, Infinity, Check } from "lucide-react";

interface JornadaDuracaoSelectorProps {
  duracaoSelecionada: number | null;
  totalArtigos: number;
  onSelect: (duracao: number | null) => void;
}

const opcoesDuracao = [
  { valor: 30, label: "30 dias", icon: Zap, descricao: "Intensivo" },
  { valor: 60, label: "60 dias", icon: Clock, descricao: "Equilibrado" },
  { valor: 90, label: "90 dias", icon: Target, descricao: "Consistente" },
  { valor: 180, label: "180 dias", icon: Calendar, descricao: "Relaxado" },
  { valor: 365, label: "1 ano", icon: Calendar, descricao: "Anual" },
  { valor: null, label: "Completo", icon: Infinity, descricao: "1 artigo/dia" },
];

export const JornadaDuracaoSelector = ({ 
  duracaoSelecionada, 
  totalArtigos, 
  onSelect 
}: JornadaDuracaoSelectorProps) => {
  
  const calcularArtigosPorDia = (duracao: number | null) => {
    if (duracao === null) return 1;
    return Math.ceil(totalArtigos / duracao);
  };

  const calcularDuracaoReal = (duracao: number | null) => {
    if (duracao === null) return totalArtigos;
    return duracao;
  };

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-lg">Escolha a duração</h3>
        <p className="text-sm text-muted-foreground">
          {totalArtigos} artigos disponíveis
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {opcoesDuracao.map((opcao, index) => {
          const Icon = opcao.icon;
          const isSelected = duracaoSelecionada === opcao.valor;
          const artigosPorDia = calcularArtigosPorDia(opcao.valor);
          const duracaoReal = calcularDuracaoReal(opcao.valor);

          return (
            <motion.div
              key={opcao.valor ?? "completo"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "hover:border-primary/50"
                }`}
                onClick={() => onSelect(opcao.valor)}
              >
                <CardContent className="p-3 text-center">
                  <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {isSelected ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <p className="font-semibold">{opcao.label}</p>
                  <p className="text-xs text-muted-foreground">{opcao.descricao}</p>
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs font-medium text-primary">
                      {artigosPorDia} artigo{artigosPorDia > 1 ? "s" : ""}/dia
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {duracaoReal} dias total
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
