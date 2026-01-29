import React, { useState } from "react";
import { Copy, FileDown, Sparkles, HelpCircle, Lightbulb, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ExplicacaoDetalhadaModal from "./ExplicacaoDetalhadaModal";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";

interface MessageActionsProps {
  message?: string;
  content?: string;
  onGenerateFlashcards: () => void;
  onGenerateQuestions: () => void;
  onExplainMore: () => void;
  onSummarize: () => void;
}

export const MessageActions = ({
  message,
  content,
  onGenerateFlashcards,
  onGenerateQuestions,
  onExplainMore,
  onSummarize,
}: MessageActionsProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showExplicacaoDetalhada, setShowExplicacaoDetalhada] = useState(false);
  const text = message || content || '';

  const copyToClipboard = async () => {
    setCopied(true);
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        
        if (navigator.userAgent.match(/ipad|iphone/i)) {
          const range = document.createRange();
          range.selectNodeContents(textArea);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          textArea.setSelectionRange(0, 999999);
        } else {
          textArea.select();
          textArea.setSelectionRange(0, 999999);
        }
        
        document.execCommand('copy');
        textArea.remove();
      }
      
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência",
      });
    } catch (err) {
      setCopied(false);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const textoFormatado = formatForWhatsApp(text);
    const whatsappText = encodeURIComponent(textoFormatado);
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('exportar-pdf-educacional', {
        body: { 
          content: text,
          filename: `documento-juridico-${Date.now()}`,
          title: "Documento Jurídico",
        }
      });
      
      if (error) throw error;
      
      window.open(data.pdfUrl, '_blank');
      
      toast({
        title: "PDF gerado!",
        description: "O PDF foi aberto em uma nova aba. O link é válido por 24 horas.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <>
      <ExplicacaoDetalhadaModal
        isOpen={showExplicacaoDetalhada}
        onClose={() => setShowExplicacaoDetalhada(false)}
        conteudo={text}
      />
      
      <div className="mt-3 space-y-2">
        {/* Grid de ações principais - 3 por linha no mobile, 4 no desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="text-xs h-9"
        >
          {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={shareViaWhatsApp}
          className="text-xs h-9"
        >
          <Share2 className="w-3.5 h-3.5 mr-1.5" />
          WhatsApp
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={exportToPDF}
          disabled={exportingPDF}
          className="text-xs h-9"
        >
          <FileDown className="w-3.5 h-3.5 mr-1.5" />
          {exportingPDF ? "..." : "PDF"}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateFlashcards}
          className="text-xs h-9"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Flashcards
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateQuestions}
          className="text-xs h-9"
        >
          <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
          Questões
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExplicacaoDetalhada(true)}
          className="text-xs h-9"
        >
          Explicar mais
        </Button>
      </div>
      
      {/* Botão de resumir */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSummarize}
        className="text-xs h-8 w-full"
      >
        <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
        Resumir mais
      </Button>

      </div>
    </>
  );
};
