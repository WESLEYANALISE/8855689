import { Card, CardContent } from "@/components/ui/card";
import { Check, FileText, Users, Microscope, Camera, FileCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Prova {
  id: string;
  tipo: string;
  descricao: string;
  forca: 'forte' | 'media' | 'fraca';
}

interface ProvasSelectorGridProps {
  provas: Prova[];
  provaSelecionada: string | null;
  onSelecionar: (id: string) => void;
  disabled?: boolean;
}

const iconesPorTipo: Record<string, any> = {
  'Documento': FileText,
  'Testemunha': Users,
  'Perícia': Microscope,
  'Fotografia': Camera,
  'Laudo': FileCheck,
  'default': FileText
};

const ProvasSelectorGrid = ({
  provas,
  provaSelecionada,
  onSelecionar,
  disabled = false
}: ProvasSelectorGridProps) => {
  const getIcone = (tipo: string) => {
    return iconesPorTipo[tipo] || iconesPorTipo.default;
  };

  const getCorForca = (forca: string) => {
    switch (forca) {
      case 'forte':
        return 'border-green-500 bg-green-500/10';
      case 'media':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'fraca':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-600 bg-gray-800/50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Legenda */}
      <div className="text-center mb-4">
        <p className="text-sm text-amber-500 font-semibold bg-amber-500/10 rounded-lg px-4 py-2 inline-block">
          📁 Selecione UMA prova para apresentar
        </p>
      </div>

      {/* Grid de provas */}
      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {provas.map((prova, index) => {
            const Icone = getIcone(prova.tipo);
            const isSelected = provaSelecionada === prova.id;

            return (
              <div
                key={prova.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'border-2 border-amber-500 bg-amber-500/10 scale-105'
                          : `border-2 ${getCorForca(prova.forca)} hover:scale-105`
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !disabled && onSelecionar(prova.id)}
                    >
                      <CardContent className="p-6 text-center relative">
                        {/* Ícone de seleção */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 animate-scale-in">
                            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Ícone da prova */}
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                          isSelected ? 'bg-amber-500' : 'bg-gray-700'
                        }`}>
                          <Icone className="w-8 h-8 text-white" />
                        </div>

                        {/* Tipo da prova */}
                        <h4 className={`font-bold mb-2 ${
                          isSelected ? 'text-amber-500' : 'text-white'
                        }`}>
                          {prova.tipo}
                        </h4>

                        {/* Indicador de força */}
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                          prova.forca === 'forte' ? 'bg-green-500/20 text-green-400' :
                          prova.forca === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {prova.forca === 'forte' ? 'Forte' : prova.forca === 'media' ? 'Média' : 'Fraca'}
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{prova.descricao}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ProvasSelectorGrid;
