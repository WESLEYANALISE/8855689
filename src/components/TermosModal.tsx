import { useState, useEffect } from "react";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TermosModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
  codigoTabela?: string;
  codigo?: string;
}

interface Termo {
  termo: string;
  significado: string;
}

interface PontoAprofundamento {
  titulo: string;
  explicacao: string;
}

interface Aprofundamento {
  termo: string;
  pontos: PontoAprofundamento[];
}

const TermosModal = ({ isOpen, onClose, artigo, numeroArtigo, codigoTabela = 'CP - Código Penal', codigo = 'cp' }: TermosModalProps) => {
  const [termos, setTermos] = useState<Termo[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedTermo, setExpandedTermo] = useState<string | null>(null);
  const [aprofundamentos, setAprofundamentos] = useState<Record<string, Aprofundamento>>({});
  const [loadingAprofundamento, setLoadingAprofundamento] = useState<string | null>(null);
  const { toast } = useToast();

  const gerarTermos = async () => {
    if (hasGenerated) return;
    
    setLoading(true);
    setProgress(0);
    setProgressMessage("Verificando cache...");
    setTermos([]);
    setHasGenerated(true);
    
    // Verificar cache primeiro
    try {
      const { data: cached, error: cacheError } = await supabase
        .from(codigoTabela as any)
        .select('termos')
        .eq('Número do Artigo', numeroArtigo)
        .maybeSingle();
      
      if (!cacheError && cached && 'termos' in cached && cached.termos && Array.isArray(cached.termos) && cached.termos.length > 0) {
        console.log('✅ Termos encontrados no cache');
        setTermos(cached.termos);
        setProgress(100);
        setLoading(false);
        return;
      }
    } catch (cacheError) {
      console.log('⚠️ Erro ao verificar cache, gerando novo:', cacheError);
    }
    
    let progressInterval: number | undefined;
    let currentProgress = 0;
    
    const startProgressAnimation = () => {
      progressInterval = window.setInterval(() => {
        if (currentProgress < 90) {
          const increment = currentProgress < 30 ? 3 : currentProgress < 60 ? 5 : 4;
          currentProgress = Math.min(90, currentProgress + increment);
          setProgress(Math.round(currentProgress));
          
          if (currentProgress < 25) {
            setProgressMessage("Analisando artigo...");
          } else if (currentProgress < 50) {
            setProgressMessage("Extraindo termos jurídicos...");
          } else if (currentProgress < 75) {
            setProgressMessage("Criando definições...");
          } else {
            setProgressMessage("🎉 Quase pronto!");
          }
        }
      }, 300);
    };
    
    try {
      startProgressAnimation();
      
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-termos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
          },
          body: JSON.stringify({
            artigo: `Art. ${numeroArtigo}\n${artigo}`,
            codigo: codigo,
            numeroArtigo: numeroArtigo
          })
        }
      );

      console.log('🔍 [Debug TermosModal - Geração]', {
        codigoEnviado: codigo,
        tabelaMapeada: codigoTabela,
        numeroArtigo: numeroArtigo
      });

      if (!response.ok) {
        throw new Error('Falha na requisição');
      }

      if (!response.ok) {
        throw new Error('Falha na requisição');
      }

      if (progressInterval) clearInterval(progressInterval);
      setProgress(95);

      const text = await response.text();
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanedText);
      
      if (data.termos && Array.isArray(data.termos)) {
        setTermos(data.termos);
        setProgress(100);
        
        // Salvar termos na tabela
        try {
          const { error: updateError } = await supabase
            .from(codigoTabela as any)
            .update({ 
              termos: data.termos,
              ultima_atualizacao: new Date().toISOString()
            })
            .eq('Número do Artigo', numeroArtigo);
          
          if (updateError) {
            console.error('Erro ao salvar termos:', updateError);
          }
        } catch (saveError) {
          console.error('Erro ao salvar termos:', saveError);
        }
      } else {
        throw new Error('Formato de resposta inválido');
      }
      
    } catch (error) {
      console.error("Erro ao gerar termos:", error);
      if (progressInterval) clearInterval(progressInterval);
      toast({
        title: "Erro",
        description: "Não foi possível gerar os termos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const aprofundarTermo = async (termoNome: string) => {
    if (aprofundamentos[termoNome]) {
      setExpandedTermo(expandedTermo === termoNome ? null : termoNome);
      return;
    }
    
    setLoadingAprofundamento(termoNome);
    
    try {
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-termos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
          },
          body: JSON.stringify({
            artigo: `Art. ${numeroArtigo}\n${artigo}`,
            codigo: codigo,
            numeroArtigo: numeroArtigo,
            aprofundar: true,
            termoEspecifico: termoNome
          })
        }
      );

      console.log('🔍 [Debug TermosModal - Aprofundamento]', {
        codigoEnviado: codigo,
        tabelaMapeada: codigoTabela,
        numeroArtigo: numeroArtigo,
        termoAprofundado: termoNome
      });

      if (!response.ok) {
        throw new Error('Falha na requisição');
      }

      if (!response.ok) {
        throw new Error('Falha na requisição');
      }

      const data = await response.json();
      
      if (data.aprofundamento) {
        setAprofundamentos(prev => ({
          ...prev,
          [termoNome]: data.aprofundamento
        }));
        setExpandedTermo(termoNome);
        
        toast({
          title: "Aprofundamento gerado!",
          description: "Detalhes completos disponíveis."
        });
      }
    } catch (error) {
      console.error("Erro ao aprofundar termo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o aprofundamento.",
        variant: "destructive"
      });
    } finally {
      setLoadingAprofundamento(null);
    }
  };

  const handleClose = () => {
    setHasGenerated(false);
    setTermos([]);
    setProgress(0);
    setLoading(false);
    setExpandedTermo(null);
    setAprofundamentos({});
    onClose();
  };

  // Reset quando artigo mudar
  useEffect(() => {
    if (isOpen) {
      setHasGenerated(false);
      setTermos([]);
      setProgress(0);
      setExpandedTermo(null);
      setAprofundamentos({});
    }
  }, [numeroArtigo, isOpen]);

  if (!isOpen) return null;

  if (isOpen && !hasGenerated && !loading) {
    gerarTermos();
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-accent">📚 Termos Jurídicos</h2>
            <p className="text-sm text-muted-foreground">Art. {numeroArtigo}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" className="text-secondary" />
                  <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={276.46} strokeDashoffset={276.46 * (1 - progress / 100)} className="text-accent transition-all duration-300" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-accent">{progress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold mb-1">Gerando termos jurídicos...</p>
                <p className="text-xs text-muted-foreground">{progressMessage}</p>
              </div>
            </div>
          ) : termos.length > 0 ? (
            <div className="space-y-4">
              {termos.map((termo, index) => {
                const isExpanded = expandedTermo === termo.termo;
                const aprofundamento = aprofundamentos[termo.termo];
                const isLoadingThis = loadingAprofundamento === termo.termo;
                
                return (
                  <div key={index} className="bg-secondary/20 border border-border rounded-xl overflow-hidden">
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-accent mb-2">🔍 {termo.termo}</h3>
                      <p className="text-foreground/90 leading-relaxed mb-3">{termo.significado}</p>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => aprofundarTermo(termo.termo)}
                        disabled={isLoadingThis}
                        className="w-full gap-2"
                      >
                        {isLoadingThis ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Aprofundando...</span>
                          </>
                        ) : isExpanded && aprofundamento ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            <span>Ocultar Aprofundamento</span>
                          </>
                        ) : (
                          <span>Aprofundar</span>
                        )}
                      </Button>
                    </div>
                    
                    {isExpanded && aprofundamento && (
                      <div className="border-t border-border bg-secondary/10 p-4 space-y-3">
                        <h4 className="text-sm font-bold text-accent mb-3">📖 Aprofundamento Detalhado</h4>
                        {aprofundamento.pontos.map((ponto, idx) => (
                          <div key={idx} className="bg-card/50 rounded-lg p-3 border border-border/50">
                            <h5 className="text-sm font-semibold text-accent mb-1">{ponto.titulo}</h5>
                            <p className="text-xs text-foreground/80 leading-relaxed">{ponto.explicacao}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Nenhum termo gerado.
            </div>
          )}
        </div>

        {!loading && termos.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button onClick={handleClose} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermosModal;
