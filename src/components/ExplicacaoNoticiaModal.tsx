import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, FileDown, Sparkles, X, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExplicacaoNoticiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  url: string;
  analisePreGerada?: string;
}

interface AnaliseCompleta {
  resumoExecutivo: string;
  pontosPrincipais: string;
}

const ExplicacaoNoticiaModal = ({
  isOpen,
  onClose,
  titulo,
  url,
  analisePreGerada,
}: ExplicacaoNoticiaModalProps) => {
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState<AnaliseCompleta | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState("resumo");
  const [fontSize, setFontSize] = useState(15);

  // Parse análise pré-gerada em seções
  const parseAnalise = (texto: string): AnaliseCompleta => {
    // Tentar extrair seções do texto
    const sections = texto.split(/(?=##?\s+)/);
    
    let resumoExecutivo = "";
    let pontosPrincipais = "";
    
    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;
      
      // Identificar seção pelo título
      const lowerTrimmed = trimmed.toLowerCase();
      
      if (lowerTrimmed.includes("resumo executivo") || lowerTrimmed.includes("resumo geral") ||
          lowerTrimmed.includes("análise") || lowerTrimmed.includes("impacto") ||
          lowerTrimmed.includes("contexto") || lowerTrimmed.includes("implicações")) {
        // Adicionar ao resumo executivo para criar conteúdo detalhado
        const content = trimmed.replace(/^##?\s*.*?\n/, '').trim();
        if (content && !resumoExecutivo) {
          resumoExecutivo = content;
        } else if (content) {
          resumoExecutivo += "\n\n" + content;
        }
      } else if (lowerTrimmed.includes("pontos principais") || lowerTrimmed.includes("pontos-chave") || 
                 lowerTrimmed.includes("destaques") || lowerTrimmed.includes("principais")) {
        pontosPrincipais = trimmed.replace(/^##?\s*.*?\n/, '').trim();
      }
    }
    
    // Se não conseguiu separar, usar texto completo como resumo
    if (!resumoExecutivo) {
      resumoExecutivo = texto;
    }
    
    // Se não tem pontos principais, extrair do resumo
    if (!pontosPrincipais && resumoExecutivo) {
      // Extrair frases mais relevantes como pontos
      const sentences = resumoExecutivo.split(/[.!?]+/).filter(s => s.trim().length > 20);
      pontosPrincipais = sentences.slice(0, 6).map(s => `• ${s.trim()}`).join('\n\n');
    }
    
    return { resumoExecutivo, pontosPrincipais };
  };

  const gerarExplicacao = async () => {
    try {
      setLoading(true);
      setAnalise(null);

      const { data, error } = await supabase.functions.invoke("explicar-noticia", {
        body: { url, titulo },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const parsed = parseAnalise(data.explicacao);
      setAnalise(parsed);
      toast.success("Análise gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar explicação:", error);
      toast.error("Erro ao gerar análise. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getFullContent = () => {
    if (!analise) return "";
    return `## Resumo Executivo\n${analise.resumoExecutivo}\n\n## Pontos Principais\n${analise.pontosPrincipais}`;
  };

  const compartilharWhatsApp = () => {
    if (!analise) return;

    const conteudoMarkdown = `# ${titulo}\n\n${getFullContent()}\n\n---\n\n**Fonte:** ${url}`;
    const textoFormatado = formatForWhatsApp(conteudoMarkdown);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textoFormatado)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Abrindo WhatsApp...");
  };

  const handleExportPDF = async () => {
    if (!analise) return;

    try {
      setExportingPDF(true);
      toast.info("Gerando PDF...");

      const conteudoCompleto = `${getFullContent()}\n\n---\n\n**Fonte:** ${url}`;

      const { data, error } = await supabase.functions.invoke("exportar-pdf-educacional", {
        body: {
          content: conteudoCompleto,
          filename: `analise-noticia-${Date.now()}`,
          title: `Análise: ${titulo}`,
        },
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        toast.success("PDF gerado com sucesso!");
      } else {
        throw new Error("URL do PDF não foi retornada");
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setExportingPDF(false);
    }
  };

  const handleClose = () => {
    if (!analisePreGerada) {
      setAnalise(null);
    }
    setLoading(false);
    onClose();
  };

  const aumentarFonte = () => {
    setFontSize(prev => Math.min(prev + 2, 22));
  };

  const diminuirFonte = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  // Se tiver análise pré-gerada e analise estiver vazio, popular
  useEffect(() => {
    if (analisePreGerada && !analise && isOpen) {
      const parsed = parseAnalise(analisePreGerada);
      setAnalise(parsed);
    }
  }, [analisePreGerada, isOpen]);

  // Componentes de markdown com tamanho de fonte dinâmico
  const getMarkdownComponents = () => ({
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="font-bold text-foreground mb-3 mt-4 text-primary" style={{ fontSize: fontSize + 4 }}>{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="font-semibold text-foreground mb-3 mt-4 border-b border-border pb-2" style={{ fontSize: fontSize + 2 }}>{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="font-semibold text-foreground mb-2 mt-3" style={{ fontSize: fontSize + 1 }}>{children}</h3>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="text-foreground mb-4 leading-relaxed text-left" style={{ fontSize }}>{children}</p>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside space-y-3 mb-4 text-foreground" style={{ fontSize }}>{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-inside space-y-3 mb-4 text-foreground" style={{ fontSize }}>{children}</ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="text-foreground ml-4 leading-relaxed" style={{ fontSize }}>{children}</li>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="font-bold text-primary">{children}</strong>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/30 rounded-r-md italic">
        {children}
      </blockquote>
    ),
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Análise da Notícia
          </DialogTitle>
          <div className="flex items-center gap-2">
            {/* Controles de fonte */}
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={diminuirFonte}
                className="h-6 w-6"
                title="Diminuir fonte"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs px-1 min-w-[24px] text-center">{fontSize}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={aumentarFonte}
                className="h-6 w-6"
                title="Aumentar fonte"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Título da notícia */}
        <h2 className="text-sm font-medium text-muted-foreground line-clamp-2 mb-3">
          {titulo}
        </h2>

        <div className="space-y-4">
          {!analise && !loading && (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-primary mb-4 animate-pulse" />
              <p className="text-sm text-muted-foreground mb-6">
                Clique no botão abaixo para gerar uma análise completa desta notícia
              </p>
              <Button onClick={gerarExplicacao} size="lg" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Gerar Análise com IA
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Analisando notícia...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Isso pode levar alguns segundos
              </p>
            </div>
          )}

          {analise && !loading && (
            <>
              {/* Tabs de navegação - apenas 2 */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2 h-auto bg-muted/50 p-1">
                  <TabsTrigger 
                    value="resumo" 
                    className="text-xs py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    📋 Resumo Executivo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pontos" 
                    className="text-xs py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    🎯 Pontos Principais
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="resumo" className="mt-4">
                  <div className="prose prose-sm max-w-none">
                    {/* Título do resumo executivo */}
                    <h2 className="font-bold text-primary mb-4 border-b border-border pb-2" style={{ fontSize: fontSize + 3 }}>
                      Análise Detalhada
                    </h2>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={getMarkdownComponents()}
                    >
                      {analise.resumoExecutivo}
                    </ReactMarkdown>
                  </div>
                </TabsContent>

                <TabsContent value="pontos" className="mt-4">
                  <div className="prose prose-sm max-w-none">
                    <h2 className="font-bold text-primary mb-4 border-b border-border pb-2" style={{ fontSize: fontSize + 3 }}>
                      Pontos Principais
                    </h2>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={getMarkdownComponents()}
                    >
                      {analise.pontosPrincipais}
                    </ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={compartilharWhatsApp}
                  variant="outline"
                  className="flex-1 gap-2 text-xs"
                  size="sm"
                >
                  <Share2 className="w-3 h-3" />
                  Compartilhar
                </Button>
                <Button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  variant="outline"
                  className="flex-1 gap-2 text-xs"
                  size="sm"
                >
                  {exportingPDF ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileDown className="w-3 h-3" />
                  )}
                  Exportar PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExplicacaoNoticiaModal;
