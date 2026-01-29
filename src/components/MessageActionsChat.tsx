import React, { useState } from "react";
import { FileDown, Sparkles, HelpCircle, Lightbulb, Share2, Brain, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ExplicacaoDetalhadaModal from "./ExplicacaoDetalhadaModal";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";

interface MessageActionsChatProps {
  content: string;
  onCreateLesson: () => void;
  onSummarize: () => void;
  onGenerateFlashcards: () => void;
  onGenerateQuestions: () => void;
  onGenerateAula: () => void;
  onGenerateExemplo: () => void;
}

export const MessageActionsChat = ({
  content,
  onCreateLesson,
  onSummarize,
  onGenerateFlashcards,
  onGenerateQuestions,
  onGenerateAula,
  onGenerateExemplo,
}: MessageActionsChatProps) => {
  const { toast } = useToast();
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showExplicacaoDetalhada, setShowExplicacaoDetalhada] = useState(false);

  const shareViaWhatsApp = () => {
    const textoFormatado = formatForWhatsApp(content);
    const whatsappText = encodeURIComponent(textoFormatado);
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
    window.open(whatsappUrl, '_blank');
  };

  const exportToPDFABNT = async () => {
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('exportar-pdf-abnt', {
        body: { 
          content: content,
          titulo: "Trabalho Acadêmico - Professora Jurídica",
          autor: "Estudante",
          instituicao: "Instituição de Ensino",
          local: "Brasil",
          ano: new Date().getFullYear().toString(),
        }
      });
      
      if (error) throw error;
      
      window.open(data.pdfUrl, '_blank');
      
      toast({
        title: "PDF ABNT gerado!",
        description: "O PDF foi aberto em uma nova aba.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF ABNT:", error);
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
        conteudo={content}
      />
      
      <div className="mt-4">
        {/* Grid de ações - 3 por linha */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onCreateLesson}
            size="sm"
            className="text-xs h-9 bg-primary hover:bg-primary/90 text-white border-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Aprofundar
          </Button>
          
          <Button
            size="sm"
            onClick={onGenerateQuestions}
            className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Questões
          </Button>
          
          <Button
            size="sm"
            onClick={onGenerateFlashcards}
            className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white border-0"
          >
            <Brain className="w-3.5 h-3.5 mr-1" />
            Flashcards
          </Button>
          
          <Button
            size="sm"
            onClick={onGenerateAula}
            className="text-xs h-9 bg-cyan-600 hover:bg-cyan-700 text-white border-0"
          >
            <GraduationCap className="w-3.5 h-3.5 mr-1" />
            Aula
          </Button>
          
          <Button
            size="sm"
            onClick={onGenerateExemplo}
            className="text-xs h-9 bg-amber-500 hover:bg-amber-600 text-white border-0"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            Exemplo
          </Button>
          
          <Button
            size="sm"
            onClick={exportToPDFABNT}
            disabled={exportingPDF}
            className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            <FileDown className="w-3.5 h-3.5 mr-1" />
            {exportingPDF ? "..." : "PDF"}
          </Button>
          
          <Button
            size="sm"
            onClick={shareViaWhatsApp}
            className="text-xs h-9 bg-green-600 hover:bg-green-700 text-white border-0"
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Compartilhar
          </Button>
          
          <Button
            size="sm"
            onClick={onSummarize}
            className="text-xs h-9 bg-orange-500 hover:bg-orange-600 text-white border-0"
          >
            <Lightbulb className="w-3.5 h-3.5 mr-1" />
            Resumir
          </Button>
        </div>
      </div>
    </>
  );
};
