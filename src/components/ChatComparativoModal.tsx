import { useState, useEffect } from "react";
import { X, Loader2, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuadroComparativoVisual, extrairTabelaDoMarkdown } from "@/components/oab/QuadroComparativoVisual";

interface ChatComparativoModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

interface TabelaData {
  cabecalhos: string[];
  linhas: string[][];
  titulo?: string;
}

const ChatComparativoModal = ({ isOpen, onClose, content }: ChatComparativoModalProps) => {
  const [tabela, setTabela] = useState<TabelaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [hasGenerated, setHasGenerated] = useState(false);

  const gerarTabela = async () => {
    if (hasGenerated) return;
    
    setLoading(true);
    setProgress(0);
    setProgressMessage("Analisando conteúdo...");
    setTabela(null);
    setHasGenerated(true);
    
    let progressInterval: number | undefined;
    let currentProgress = 0;
    
    const startProgressAnimation = () => {
      progressInterval = window.setInterval(() => {
        if (currentProgress < 90) {
          const increment = currentProgress < 30 ? 4 : currentProgress < 60 ? 5 : 3;
          currentProgress = Math.min(90, currentProgress + increment);
          setProgress(Math.round(currentProgress));
          
          if (currentProgress < 25) {
            setProgressMessage("Identificando conceitos...");
          } else if (currentProgress < 50) {
            setProgressMessage("Estruturando comparação...");
          } else if (currentProgress < 75) {
            setProgressMessage("Montando tabela...");
          } else {
            setProgressMessage("🎯 Finalizando!");
          }
        }
      }, 250);
    };
    
    try {
      startProgressAnimation();
      
      const { data, error } = await supabase.functions.invoke("gerar-tabela-comparativa", {
        body: {
          content: content,
          tipo: 'chat'
        }
      });

      if (error) throw error;

      if (progressInterval) clearInterval(progressInterval);
      setProgress(95);
      
      if (data?.tabela) {
        // Adaptar formato se necessário
        const tabelaFormatada: TabelaData = {
          cabecalhos: data.tabela.colunas || data.tabela.cabecalhos || [],
          linhas: data.tabela.linhas?.map((l: any) => l.celulas || l) || [],
          titulo: data.tabela.titulo
        };
        setTabela(tabelaFormatada);
        setProgress(100);
        toast.success(`Tabela comparativa gerada!`);
      } else if (data?.markdown) {
        // Tentar extrair tabela do markdown retornado
        const extraida = extrairTabelaDoMarkdown(data.markdown);
        if (extraida) {
          setTabela(extraida);
          setProgress(100);
          toast.success(`Tabela comparativa gerada!`);
        } else {
          throw new Error('Não foi possível extrair a tabela');
        }
      } else {
        throw new Error('Formato de resposta inválido');
      }
      
    } catch (error) {
      console.error("Erro ao gerar tabela:", error);
      if (progressInterval) clearInterval(progressInterval);
      toast.error("Não foi possível gerar a tabela. Tente novamente.");
      setHasGenerated(false);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleClose = () => {
    setHasGenerated(false);
    setTabela(null);
    setProgress(0);
    setLoading(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen && !hasGenerated && !loading) {
      gerarTabela();
    }
  }, [isOpen, hasGenerated, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Table className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-400">Tabela Comparativa</h2>
              <p className="text-sm text-muted-foreground">Comparação visual do conteúdo</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" className="text-secondary" />
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={276.46} strokeDashoffset={276.46 * (1 - progress / 100)} className="text-cyan-400 transition-all duration-300" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-cyan-400">{progress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold mb-1">Gerando tabela...</p>
                <p className="text-xs text-muted-foreground">{progressMessage}</p>
              </div>
            </div>
          ) : tabela ? (
            <div className="space-y-4">
              <QuadroComparativoVisual 
                cabecalhos={tabela.cabecalhos} 
                linhas={tabela.linhas} 
                titulo={tabela.titulo}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tabela gerada.</p>
            </div>
          )}
        </div>

        {!loading && tabela && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button onClick={handleClose} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComparativoModal;
