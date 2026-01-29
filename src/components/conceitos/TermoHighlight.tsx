import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TermoHighlightProps {
  termo: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const TermoHighlight = ({ termo, children, disabled = false }: TermoHighlightProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [definicao, setDefinicao] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDefinicao = async () => {
    if (definicao) return; // Já tem definição carregada
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('gerar-definicao-termo', {
        body: { termo }
      });
      
      if (fnError) {
        throw new Error(fnError.message);
      }
      
      if (data?.success && data?.definicao) {
        setDefinicao(data.definicao);
      } else {
        throw new Error(data?.error || 'Erro ao gerar definição');
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
        className="w-80 bg-[#1a1a2e] border-amber-500/30 p-4 shadow-xl shadow-black/50"
        sideOffset={8}
      >
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
            {termo}
          </h4>
          
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              <span className="ml-2 text-sm text-gray-400">Gerando definição...</span>
            </div>
          )}
          
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          
          {definicao && !isLoading && (
            <p className="text-sm text-gray-300 leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
              {definicao}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TermoHighlight;
