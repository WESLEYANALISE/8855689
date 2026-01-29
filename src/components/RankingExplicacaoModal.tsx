import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface RankingExplicacaoModalProps {
  tipo: string;
  titulo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Cache local para evitar chamadas repetidas
const explicacaoCache: Record<string, string> = {};

export const RankingExplicacaoModal = ({ tipo, titulo, open, onOpenChange }: RankingExplicacaoModalProps) => {
  const [explicacao, setExplicacao] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tipo) return;

    // Se já tem no cache, usar
    if (explicacaoCache[tipo]) {
      setExplicacao(explicacaoCache[tipo]);
      return;
    }

    const fetchExplicacao = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke('gerar-explicacao-ranking', {
          body: { tipo }
        });

        if (error) throw error;

        if (data?.explicacao) {
          explicacaoCache[tipo] = data.explicacao;
          setExplicacao(data.explicacao);
        }
      } catch (err) {
        console.error('Erro ao buscar explicação:', err);
        setError('Não foi possível carregar a explicação. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplicacao();
  }, [open, tipo]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <Info className="w-5 h-5" />
            {titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm text-muted-foreground">Gerando explicação detalhada...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 mb-4">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setExplicacao(null);
                  explicacaoCache[tipo] && delete explicacaoCache[tipo];
                }}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {explicacao && !isLoading && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-bold text-amber-500 mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold text-amber-500 mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-amber-400 mt-2 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="text-amber-500 font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  li: ({ children }) => <li className="text-sm text-muted-foreground">{children}</li>,
                }}
              >
                {explicacao}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
