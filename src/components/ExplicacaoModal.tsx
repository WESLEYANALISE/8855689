import { useState, useEffect } from "react";
import { ArrowLeft, Download, Share2, BookOpen, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";

interface ExplicacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
  tipo: "explicacao" | "exemplo";
  nivel?: "tecnico" | "simples";
  codigo?: string;
  codigoTabela?: string;
}

const ExplicacaoModal = ({
  isOpen,
  onClose,
  artigo,
  numeroArtigo,
  tipo,
  nivel = "tecnico",
  codigo = "cpp",
  codigoTabela
}: ExplicacaoModalProps) => {
  const [conteudo, setConteudo] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [showLevelSelection, setShowLevelSelection] = useState(true);
  const [showAgeSelection, setShowAgeSelection] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [hasValidContent, setHasValidContent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const gerarConteudo = async (nivelSelecionado: "tecnico" | "simples" | "resumido", faixaEtaria?: "menor16" | "maior16") => {
    setShowLevelSelection(false);
    setShowAgeSelection(false);
    setLoading(true);
    setIsStreaming(false);
    setProgress(0);
    setProgressMessage("Iniciando...");
    setConteudo("");
    setHasValidContent(false);

    let progressInterval: number | undefined;
    let currentProgress = 0;

    const startProgressAnimation = () => {
      progressInterval = window.setInterval(() => {
        if (currentProgress < 90) {
          const increment = Math.random() * 8;
          currentProgress = Math.min(90, currentProgress + increment);
          setProgress(Math.round(currentProgress));

          if (currentProgress < 30) {
            setProgressMessage("Conectando com a IA...");
          } else if (currentProgress < 60) {
            setProgressMessage("Analisando o conteúdo...");
          } else if (currentProgress < 90) {
            setProgressMessage("Gerando explicação...");
          }
        }
      }, 400);
    };

    try {
      startProgressAnimation();
      
      const response = await fetch(`https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-explicacao-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
        },
        body: JSON.stringify({
          artigo: `Art. ${numeroArtigo}\n${artigo}`,
          tipo,
          nivel: nivelSelecionado,
          faixaEtaria,
          codigo: codigo,
          numeroArtigo: numeroArtigo
        })
      });

      // Log headers de revisão para debugging
      const revision = response.headers.get('X-Function-Revision');
      const model = response.headers.get('X-Model');
      if (revision || model) {
        console.log('📍 Endpoint:', 'gerar-explicacao-v2');
        console.log('📍 Revisão:', revision || 'N/A');
        console.log('📍 Modelo:', model || 'N/A');
      }

      if (!response.ok) {
        // Tentar ler o corpo como JSON para obter detalhes do erro
        const contentType = response.headers.get('Content-Type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          console.error('❌ Erro do servidor:', errorData);
          
          // Mostrar erro mais específico para 402 e 429
          if (response.status === 402) {
            toast({
              title: "Sem créditos disponíveis",
              description: errorData.message || "Por favor, adicione créditos à sua conta Lovable AI.",
              variant: "destructive"
            });
          } else if (response.status === 429) {
            toast({
              title: "Limite de requisições excedido",
              description: errorData.message || "Aguarde alguns instantes antes de tentar novamente.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro ao gerar conteúdo",
              description: `${errorData.provider || 'Servidor'}: ${errorData.message || 'Erro desconhecido'}`,
              variant: "destructive"
            });
          }
          throw new Error(errorData.error || 'Falha na requisição');
        }
        throw new Error('Falha na requisição');
      }

      if (!response.body) {
        throw new Error('Corpo da resposta vazio');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let buffer = "";
      let hasStartedReceiving = false;
      let contentTimeout: number | undefined;

      // Timeout aumentado para 30 segundos
      contentTimeout = window.setTimeout(() => {
        if (!hasStartedReceiving || accumulatedContent.trim().length === 0) {
          console.error('Timeout: Nenhum conteúdo válido recebido em 30 segundos');
          if (progressInterval) clearInterval(progressInterval);
          setLoading(false);
          setIsStreaming(false);
          
          if (retryCount < 2) {
            toast({
              title: "Gerando novamente...",
              description: "A primeira tentativa não retornou conteúdo. Tentando novamente.",
            });
            setRetryCount(prev => prev + 1);
            setTimeout(() => gerarConteudo(nivelSelecionado), 1000);
          } else {
            toast({
              title: "Erro",
              description: "Não foi possível gerar o conteúdo após várias tentativas. Tente novamente.",
              variant: "destructive"
            });
          }
        }
      }, 30000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content && content.trim().length > 0) {
                if (!hasStartedReceiving) {
                  hasStartedReceiving = true;
                  if (progressInterval) clearInterval(progressInterval);
                  if (contentTimeout) clearTimeout(contentTimeout);
                  currentProgress = 92;
                  setProgress(92);
                  setProgressMessage("Recebendo resposta...");
                  setLoading(false);
                  setIsStreaming(true);
                  setHasValidContent(true);
                  setRetryCount(0);
                  console.log('✅ Primeiro conteúdo válido recebido:', content.substring(0, 50));
                }
                
                accumulatedContent += content;
                setConteudo(accumulatedContent);

                if (currentProgress < 95) {
                  currentProgress = Math.min(95, 90 + accumulatedContent.length / 100);
                  setProgress(Math.round(currentProgress));
                }
              }
            } catch (e) {
              console.error('Erro ao parsear chunk:', e);
            }
          }
        }
      }

      if (contentTimeout) clearTimeout(contentTimeout);

      if (progressInterval) clearInterval(progressInterval);

      let finalProgress = 95;
      const finalInterval = window.setInterval(() => {
        finalProgress += 1;
        setProgress(finalProgress);
        if (finalProgress >= 100) {
          clearInterval(finalInterval);
          setIsStreaming(false);
        }
      }, 50);
    } catch (error) {
      console.error("Erro ao gerar conteúdo:", error);
      if (progressInterval) clearInterval(progressInterval);
      setLoading(false);
      setIsStreaming(false);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o conteúdo. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setConteudo("");
    setProgress(0);
    setLoading(false);
    setIsStreaming(false);
    setShowLevelSelection(true);
    setShowAgeSelection(false);
    setHasValidContent(false);
    setRetryCount(0);
    onClose();
  };

  // Reset quando artigo mudar
  useEffect(() => {
    setConteudo("");
    setProgress(0);
    setShowLevelSelection(true);
    setShowAgeSelection(false);
    setHasValidContent(false);
    setRetryCount(0);
  }, [numeroArtigo, tipo]);

  const handleSuperFacilClick = () => {
    setShowLevelSelection(false);
    setShowAgeSelection(true);
  };

  const compartilharWhatsApp = () => {
    // Extrair nome do código/lei do artigo ou conteúdo
    const codigoMatch = artigo.match(/(Código\s+\w+|Lei\s+[\d.\/]+|Constituição)/i) || 
                       conteudo.match(/(Código\s+\w+|Lei\s+[\d.\/]+|Constituição)/i);
    const nomeCodigo = codigoMatch ? codigoMatch[1] : 'Lei';
    
    const textoFormatado = formatForWhatsApp(conteudo);
    const titulo = tipo === "explicacao" 
      ? `Explicação do Artigo ${numeroArtigo} do ${nomeCodigo}`
      : `Exemplo Prático do Artigo ${numeroArtigo} do ${nomeCodigo}`;
    
    const mensagem = `*${titulo}*\n\n${textoFormatado}\n\n_Gerado pelo Direito Premium_`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const copiarTexto = () => {
    const { copyToClipboard } = require('@/lib/utils');
    
    // Extrair nome do código/lei
    const codigoMatch = artigo.match(/(Código\s+\w+|Lei\s+[\d.\/]+|Constituição)/i) || 
                       conteudo.match(/(Código\s+\w+|Lei\s+[\d.\/]+|Constituição)/i);
    const nomeCodigo = codigoMatch ? codigoMatch[1] : 'Lei';
    
    const textoFormatado = formatForWhatsApp(conteudo);
    const titulo = tipo === "explicacao" 
      ? `Explicação do Artigo ${numeroArtigo} do ${nomeCodigo}`
      : `Exemplo Prático do Artigo ${numeroArtigo} do ${nomeCodigo}`;
    
    const mensagem = `${titulo}\n\n${textoFormatado}\n\nGerado pelo Direito Premium`;
    
    copyToClipboard(mensagem).then((success) => {
      if (success) {
        toast({
          title: "Texto copiado!",
          description: "O conteúdo foi copiado para a área de transferência.",
        });
      } else {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o texto.",
          variant: "destructive",
        });
      }
    });
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    
    try {
      console.log('📄 Iniciando exportação de PDF...');
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      const { data, error } = await supabase.functions.invoke('exportar-pdf-educacional', {
        body: {
          content: conteudo,
          filename: `${tipo === "explicacao" ? "explicacao" : "exemplo"}-art-${numeroArtigo}`,
          title: `${tipo === "explicacao" ? "Explicação" : "Exemplo Prático"} - Art. ${numeroArtigo}`,
          darkMode: true
        }
      });

      console.log('📄 Resposta da função:', { data, error });

      if (error) {
        console.error('❌ Erro na função:', error);
        throw error;
      }

      if (data?.pdfUrl) {
        if (isMobile) {
          window.open(data.pdfUrl, '_blank');
          toast({
            title: "PDF gerado!",
            description: "O link foi aberto em uma nova aba. Válido por 24 horas.",
          });
        } else {
          const link = document.createElement('a');
          link.href = data.pdfUrl;
          link.download = `${tipo === "explicacao" ? "explicacao" : "exemplo"}-art-${numeroArtigo}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "PDF baixado com sucesso!",
            description: "O arquivo foi salvo no seu dispositivo.",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const customComponents: Components = {
    p: ({ children }) => (
      <p className="text-[15px] leading-relaxed text-foreground/90 mb-4">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-accent mb-6 mt-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-accent mb-4 mt-8">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium text-foreground mb-3 mt-6">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => {
      const text = String(children);
      let icon = "";
      let bgColor = "bg-secondary/40";
      let borderColor = "border-accent";
      
      if (text.includes("🚨") || text.includes("ATENÇÃO CRÍTICA")) {
        icon = "🚨";
        bgColor = "bg-red-500/10";
        borderColor = "border-red-500";
      } else if (text.includes("⚠️") || text.includes("IMPORTANTE")) {
        icon = "⚠️";
        bgColor = "bg-yellow-500/10";
        borderColor = "border-yellow-500";
      } else if (text.includes("💡") || text.includes("DICA")) {
        icon = "💡";
        bgColor = "bg-blue-500/10";
        borderColor = "border-blue-500";
      } else if (text.includes("✅") || text.includes("BOA PRÁTICA")) {
        icon = "✅";
        bgColor = "bg-green-500/10";
        borderColor = "border-green-500";
      } else if (text.includes("📌") || text.includes("LEMBRE-SE")) {
        icon = "📌";
        bgColor = "bg-purple-500/10";
        borderColor = "border-purple-500";
      } else if (text.includes("❌") || text.includes("ERRO COMUM")) {
        icon = "❌";
        bgColor = "bg-red-500/10";
        borderColor = "border-red-500";
      }
      
      return (
        <blockquote className={`border-l-4 ${borderColor} pl-6 pr-4 py-4 my-6 ${bgColor} rounded-r-lg text-foreground/95 text-[15px] leading-relaxed shadow-lg`}>
          {icon && <span className="text-2xl mr-2 inline-block align-middle">{icon}</span>}
          {children}
        </blockquote>
      );
    },
    strong: ({ children }) => {
      const text = String(children);
      const isArtigo = /^(Art\.|Artigo)\s*\d+/.test(text);
      return (
        <strong className={isArtigo ? "text-primary font-extrabold" : "text-foreground font-bold"}>
          {children}
        </strong>
      );
    },
    code: ({ children }) => (
      <code className="bg-secondary/60 px-2 py-0.5 rounded text-sm text-accent">
        {children}
      </code>
    ),
    ul: ({ children }) => (
      <ul className="space-y-2 my-4 list-disc list-inside">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-2 my-4 list-decimal list-inside">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-[15px] text-foreground/90 leading-relaxed ml-2">
        {children}
      </li>
    ),
    hr: ({ children }) => (
      <hr className="border-border/40 my-8" />
    )
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-lg px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-bold">
              {tipo === "explicacao" ? "Explicação" : "Exemplo Prático"}
            </h1>
            <p className="text-xs text-muted-foreground">Art. {numeroArtigo}</p>
          </div>
        </div>
        
        {!loading && !showLevelSelection && !showAgeSelection && conteudo && (
          <Button
            variant="outline"
            size="sm"
            onClick={compartilharWhatsApp}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 pb-24">
          {showLevelSelection ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 py-8">
              <div className="text-center space-y-1 mb-2">
                <h3 className="text-lg font-bold text-foreground">
                  {tipo === "explicacao" ? "Escolha o nível de explicação" : "Escolha o nível do exemplo"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Selecione como deseja que o conteúdo seja apresentado
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
                <button
                  onClick={() => gerarConteudo("tecnico")}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="text-center space-y-1.5">
                    <div className="text-2xl mb-1">🎓</div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      Técnico
                    </h4>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Aprofundado com termos jurídicos
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => gerarConteudo("resumido")}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="text-center space-y-1.5">
                    <div className="text-2xl mb-1">📋</div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      Resumido
                    </h4>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Direto ao ponto e conciso
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleSuperFacilClick}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="text-center space-y-1.5">
                    <div className="text-2xl mb-1">💡</div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      Super Fácil
                    </h4>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Linguagem simples e clara
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : showAgeSelection ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 py-8">
              <div className="text-center space-y-1 mb-2">
                <h3 className="text-lg font-bold text-foreground">
                  Qual sua faixa etária?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Vamos adaptar a explicação para você entender melhor
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                <button
                  onClick={() => gerarConteudo("simples", "menor16")}
                  className="flex-1 p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="text-center space-y-1.5">
                    <div className="text-2xl mb-1">🎮</div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      Abaixo de 16 anos
                    </h4>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Com exemplos da escola e do dia a dia
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => gerarConteudo("simples", "maior16")}
                  className="flex-1 p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                >
                  <div className="text-center space-y-1.5">
                    <div className="text-2xl mb-1">💼</div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      16 anos ou mais
                    </h4>
                    <p className="text-xs text-muted-foreground leading-tight">
                      Com exemplos de trabalho e cotidiano
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              {/* Avatar do professor */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg">
                  <DotLottieReact
                    src="https://lottie.host/542f6e8e-cbf1-4d80-ad7a-ed9584c815c6/yfYXOPUtbr.lottie"
                    autoplay
                    loop
                    style={{ width: 140, height: 140 }}
                  />
                </div>
              </div>
              
              {/* Mensagem de carregamento com estilo de chat */}
              <div className="text-center space-y-3 max-w-md">
                <div className="bg-card/50 border border-border rounded-2xl px-6 py-4 shadow-sm">
                  <p className="text-base font-semibold text-foreground mb-1">
                    {tipo === "explicacao" ? "Gerando explicação..." : "Gerando exemplo prático..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {progress < 30 && "Preparando análise..."}
                    {progress >= 30 && progress < 60 && "Lendo e compreendendo o artigo..."}
                    {progress >= 60 && progress < 90 && "Organizando a explicação..."}
                    {progress >= 90 && "Quase pronto..."}
                  </p>
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full max-w-md space-y-2">
                <div className="w-full h-2.5 bg-secondary/50 rounded-full overflow-hidden border border-border/30 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary/90 to-accent transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>{progressMessage}</span>
                  <span className="font-bold text-primary">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          ) : conteudo ? (
            <div className="space-y-4">
              {isStreaming && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Gerando conteúdo...</span>
                </div>
              )}
              <div className="animate-fade-in">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={customComponents}
                >
                  {conteudo}
                </ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ExplicacaoModal;
