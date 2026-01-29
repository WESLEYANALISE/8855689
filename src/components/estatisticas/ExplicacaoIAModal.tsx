import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Copy, Check, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExplicacaoIAModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: "kpi" | "tribunal" | "assunto" | "classe" | "comparacao" | "tendencia";
  dados: any;
  contexto?: string;
}

// Função para criar hash simples dos dados
function criarHash(dados: any): string {
  const str = JSON.stringify(dados);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function ExplicacaoIAModal({
  isOpen,
  onClose,
  tipo,
  dados,
  contexto,
}: ExplicacaoIAModalProps) {
  const [explicacao, setExplicacao] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (isOpen && dados) {
      verificarCacheEBuscar();
    }
  }, [isOpen, dados]);

  const verificarCacheEBuscar = async () => {
    if (!dados) return;
    
    setIsLoading(true);
    const dadosHash = criarHash({ tipo, dados });

    try {
      // Primeiro, verificar se existe no cache
      const { data: cacheData, error: cacheError } = await supabase
        .from('cache_explicacoes_estatisticas')
        .select('explicacao')
        .eq('tipo', tipo)
        .eq('dados_hash', dadosHash)
        .maybeSingle();

      if (cacheData?.explicacao) {
        console.log('[ExplicacaoIAModal] Usando explicação do cache');
        setExplicacao(cacheData.explicacao);
        setSalvo(true);
        setIsLoading(false);
        return;
      }

      // Se não existe no cache, buscar da IA
      await buscarExplicacaoIA(dadosHash);
    } catch (error) {
      console.error("Erro ao verificar cache:", error);
      await buscarExplicacaoIA(criarHash({ tipo, dados }));
    }
  };

  const buscarExplicacaoIA = async (dadosHash: string) => {
    setIsLoading(true);
    setSalvo(false);
    
    try {
      const { data, error } = await supabase.functions.invoke("explicar-estatistica-cnj", {
        body: { tipo, dados, contexto },
      });

      if (error) throw error;

      const novaExplicacao = data.explicacao;
      setExplicacao(novaExplicacao);

      // Salvar no cache automaticamente
      await salvarNoCache(dadosHash, novaExplicacao);
    } catch (error) {
      console.error("Erro ao buscar explicação:", error);
      setExplicacao(
        "Não foi possível gerar a explicação no momento. Por favor, tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const salvarNoCache = async (dadosHash: string, textoExplicacao: string) => {
    try {
      const { error } = await supabase
        .from('cache_explicacoes_estatisticas')
        .upsert({
          tipo,
          dados_hash: dadosHash,
          explicacao: textoExplicacao,
        }, { 
          onConflict: 'tipo,dados_hash' 
        });

      if (error) {
        console.error("Erro ao salvar no cache:", error);
      } else {
        setSalvo(true);
      }
    } catch (error) {
      console.error("Erro ao salvar no cache:", error);
    }
  };

  const regenerar = async () => {
    const dadosHash = criarHash({ tipo, dados });
    await buscarExplicacaoIA(dadosHash);
  };

  const copiarTexto = async () => {
    if (!explicacao) return;
    await navigator.clipboard.writeText(explicacao);
    setCopiado(true);
    toast.success("Explicação copiada!");
    setTimeout(() => setCopiado(false), 2000);
  };

  const getTitulo = () => {
    switch (tipo) {
      case "kpi":
        return dados?.nome || "Indicador";
      case "tribunal":
        return dados?.nome || dados?.sigla || "Tribunal";
      case "assunto":
        return dados?.nome || "Assunto Jurídico";
      case "classe":
        return dados?.nome || "Classe Processual";
      case "comparacao":
        return "Comparação de Tribunais";
      case "tendencia":
        return "Análise de Tendência";
      default:
        return "Explicação";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        Entenda este dado
                      </h3>
                      {salvo && (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <Save className="w-3 h-3" />
                          Salvo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{getTitulo()}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[50vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Gerando explicação com IA...
                    </p>
                  </div>
                ) : explicacao ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-sm dark:prose-invert max-w-none"
                  >
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {explicacao}
                    </p>
                  </motion.div>
                ) : null}
              </div>

              {/* Footer */}
              {explicacao && !isLoading && (
                <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground">
                    Gerado por IA • CNJ DataJud
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copiarTexto}
                      className="gap-2"
                    >
                      {copiado ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiado ? "Copiado" : "Copiar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={regenerar}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
