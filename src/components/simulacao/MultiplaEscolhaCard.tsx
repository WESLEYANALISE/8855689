import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface Opcao {
  id: string;
  texto: string;
  letra: string;
}

interface MultiplaEscolhaCardProps {
  opcoes: Opcao[];
  opcaoSelecionada: string | null;
  onSelecionar: (id: string) => void;
  disabled?: boolean;
}

const MultiplaEscolhaCard = ({
  opcoes,
  opcaoSelecionada,
  onSelecionar,
  disabled = false
}: MultiplaEscolhaCardProps) => {
  return (
    <div className="space-y-4">
      {/* Legenda */}
      <div className="text-center mb-4">
        <p className="text-sm text-amber-500 font-semibold bg-amber-500/10 rounded-lg px-4 py-2 inline-block">
          ⚖️ Escolha apenas UMA alternativa
        </p>
      </div>

      {/* Opções */}
      <div className="space-y-3">
        {opcoes.map((opcao, index) => (
          <div
            key={opcao.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card
              className={`cursor-pointer transition-all duration-300 ${
                opcaoSelecionada === opcao.id
                  ? 'border-2 border-amber-500 bg-amber-500/10 scale-[1.02]'
                  : 'border-2 border-gray-600 hover:border-amber-500/50 bg-gray-800/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onSelecionar(opcao.id)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Letra da alternativa */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  opcaoSelecionada === opcao.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {opcao.letra}
                </div>

                {/* Texto da alternativa */}
                <div className="flex-1 pt-1">
                  <p className={`text-base leading-relaxed ${
                    opcaoSelecionada === opcao.id ? 'text-white font-medium' : 'text-gray-300'
                  }`}>
                    {opcao.texto}
                  </p>
                </div>

                {/* Ícone de seleção */}
                {opcaoSelecionada === opcao.id && (
                  <div className="flex-shrink-0 animate-scale-in">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiplaEscolhaCard;