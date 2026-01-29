import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AnalisarResultado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resultado, tipo, fileName } = location.state || {};

  if (!resultado) {
    navigate('/analisar');
    return null;
  }

  const getTitulo = () => {
    switch (tipo) {
      case 'documento': return 'Análise de Documento';
      case 'peticao': return 'Análise de Petição';
      case 'prova': return 'Correção de Prova';
      case 'resumo': return 'Resumo Digitalizado';
      case 'contrato': return 'Análise de Contrato';
      case 'ocr': return 'Texto Extraído (OCR)';
      default: return 'Resultado da Análise';
    }
  };

  const [exportingPDF, setExportingPDF] = useState(false);

  const exportarPDF = async () => {
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('exportar-pdf-educacional', {
        body: { 
          content: resultado,
          filename: `${tipo}-${fileName}`,
          title: getTitulo(),
        }
      });
      
      if (error) throw error;
      
      window.open(data.pdfUrl, '_blank');
      
      toast({
        title: "PDF gerado!",
        description: "O PDF foi aberto em uma nova aba. O link é válido por 24 horas.",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const compartilhar = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: getTitulo(),
          text: resultado,
        });
      } else {
        // Fallback: copiar para clipboard
        await navigator.clipboard.writeText(resultado);
        toast({
          title: "Copiado!",
          description: "Resultado copiado para a área de transferência",
        });
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível compartilhar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/analisar')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">{getTitulo()}</h1>
            <p className="text-sm text-muted-foreground">{fileName}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={exportarPDF}
              disabled={exportingPDF}
              title="Exportar PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={compartilhar}
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resultado da Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-accent">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resultado}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalisarResultado;
