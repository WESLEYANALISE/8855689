import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";

const ResumosResultado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumo, titulo } = location.state || {};
  const { goBack } = useHierarchicalNavigation();
  const [exportingPDF, setExportingPDF] = useState(false);

  if (!resumo) {
    navigate("/resumos-juridicos");
    return null;
  }

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('exportar-resumo-pdf', {
        body: { 
          resumo,
          titulo: titulo || "Resumo Jurídico",
        }
      });
      
      if (error) throw error;
      
      if (data?.pdfDataUrl) {
        const link = document.createElement('a');
        link.href = data.pdfDataUrl;
        link.download = `resumo-${titulo?.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_') || 'juridico'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "PDF exportado!",
          description: "O arquivo foi gerado e baixado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleShareWhatsApp = () => {
    const whatsappFormatted = formatForWhatsApp(resumo);
    
    const cabecalho = `╔══════════════════╗
📚 *RESUMO JURÍDICO*
╚══════════════════╝

📝 *${titulo || "Resumo Personalizado"}*
━━━━━━━━━━━━━━━━━`;

    const rodape = `
━━━━━━━━━━━━━━━━━
✨ _Direito Premium_
📱 _App de Estudos Jurídicos_`;

    const mensagem = `${cabecalho}\n\n${whatsappFormatted}\n${rodape}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    
    toast({
      title: "Compartilhando no WhatsApp",
      description: "Resumo formatado e pronto para enviar!"
    });
  };

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Resumo Gerado</h1>
          <p className="text-sm text-muted-foreground">
            Seu resumo está pronto para visualização e exportação
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleExportPDF} 
            disabled={exportingPDF} 
            size="lg"
            className="h-14"
          >
            <Download className="w-5 h-5 mr-2" />
            {exportingPDF ? "Gerando..." : "Exportar PDF"}
          </Button>
          <Button 
            onClick={handleShareWhatsApp} 
            size="lg"
            variant="outline"
            className="h-14"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </Button>
        </div>

        {/* Conteúdo do resumo */}
        <Card className="border-accent/20">
          <CardContent className="p-4 md:p-6 resumo-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resumo}
            </ReactMarkdown>
          </CardContent>
        </Card>

        {/* Botão para novo resumo */}
        <Button
          onClick={() => navigate("/resumos-juridicos/personalizado")}
          variant="outline"
          className="w-full"
        >
          Criar Novo Resumo
        </Button>
      </div>
    </div>
  );
};

export default ResumosResultado;
