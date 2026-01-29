import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Building2 } from "lucide-react";

interface DespesaCardProps {
  despesa: {
    tipoDespesa: string;
    nomeFornecedor: string;
    valorDocumento: number;
    valorLiquido: number;
    dataDocumento: string;
    urlDocumento?: string;
  };
  index?: number;
}

export const DespesaCard = ({ despesa, index = 0 }: DespesaCardProps) => {
  return (
    <Card 
      className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 border-gray-700 hover:border-amber-500/50 transition-all animate-fade-in"
      style={{
        animationDelay: `${index * 0.08}s`,
        animationFillMode: 'backwards'
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-lg bg-amber-600/20 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-6 h-6 text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-white mb-1 line-clamp-2">
              {despesa.tipoDespesa}
            </h3>
            
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-300 truncate">
                {despesa.nomeFornecedor}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-amber-400">
                  {despesa.valorLiquido.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </p>
                {despesa.valorDocumento !== despesa.valorLiquido && (
                  <p className="text-xs text-gray-500 line-through">
                    {despesa.valorDocumento.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </p>
                )}
              </div>
              
              <p className="text-xs text-gray-400">
                {new Date(despesa.dataDocumento).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            {despesa.urlDocumento && (
              <a
                href={despesa.urlDocumento}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
              >
                Ver comprovante →
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
