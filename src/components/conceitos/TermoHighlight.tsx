import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Lightbulb, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TermoHighlightProps {
  termo: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface DefinicaoData {
  definicao: string;
  exemploPratico?: string;
}

const TermoHighlight = ({ termo, children, disabled = false }: TermoHighlightProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<DefinicaoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDefinicao = async () => {
    if (data) return; // Já tem definição carregada
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: resposta, error: fnError } = await supabase.functions.invoke('gerar-definicao-termo', {
        body: { termo }
      });
      
      if (fnError) {
        throw new Error(fnError.message);
      }
      
      if (resposta?.success && resposta?.definicao) {
        setData({
          definicao: resposta.definicao,
          exemploPratico: resposta.exemploPratico
        });
      } else {
        throw new Error(resposta?.error || 'Erro ao gerar definição');
      }
    } catch (err) {
      console.error('Erro ao buscar definição:', err);
      setError('Não foi possível carregar a definição');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchDefinicao();
    }
  };

  // Se desabilitado, apenas retorna o texto sem highlight
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span 
          className="text-orange-400 hover:text-orange-300 cursor-pointer underline decoration-orange-500/50 underline-offset-2 transition-colors font-medium"
          role="button"
          tabIndex={0}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-[#1a1a2e] border-amber-500/30 p-4 shadow-xl shadow-black/50 z-[100]"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Header com ícone */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              {termo}
            </h4>
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              <span className="ml-2 text-sm text-gray-400">Gerando definição...</span>
            </div>
          )}
          
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          
          {data && !isLoading && (
            <>
              {/* Definição */}
              <p className="text-sm text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                {data.definicao}
              </p>
              
              {/* Exemplo Prático */}
              {data.exemploPratico && (
                <div className="mt-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                      Exemplo Prático
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                    {data.exemploPratico}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TermoHighlight;
