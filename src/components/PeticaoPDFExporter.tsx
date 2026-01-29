import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";

interface PeticaoContent {
  etapa1: string;
  etapa2: string;
  etapa3: string;
}

interface Jurisprudencia {
  numeroProcesso: string;
  tribunal: string;
  ementa: string;
}

interface PDFExportOptions {
  titulo: string;
  conteudo: PeticaoContent;
  jurisprudencias: Jurisprudencia[];
}

export const exportPeticaoPDF = ({ titulo, conteudo, jurisprudencias }: PDFExportOptions) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const maxWidth = pageWidth - 2 * margin;
    let y = margin;

    // Função auxiliar para adicionar nova página se necessário
    const checkNewPage = (space: number = 10) => {
      if (y > pageHeight - margin - space) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };

    // Função auxiliar para processar texto
    const addText = (text: string, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        checkNewPage();
        doc.text(line, margin, y);
        y += fontSize * 0.35 + 2;
      }
    };

    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(titulo, margin, y);
    y += 10;

    // Data
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const date = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Gerado em: ${date}`, margin, y);
    y += 10;

    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    // Processar Etapa 1
    if (conteudo.etapa1) {
      addText("QUALIFICAÇÃO E FUNDAMENTAÇÃO JURÍDICA", 12, true);
      y += 5;
      addText(conteudo.etapa1, 11);
      y += 10;
    }

    // Processar Etapa 2
    if (conteudo.etapa2) {
      checkNewPage(20);
      addText("ANÁLISE DETALHADA E ARGUMENTAÇÃO", 12, true);
      y += 5;
      addText(conteudo.etapa2, 11);
      y += 10;
    }

    // Processar Etapa 3
    if (conteudo.etapa3) {
      checkNewPage(20);
      addText("PEDIDOS E CONCLUSÃO", 12, true);
      y += 5;
      addText(conteudo.etapa3, 11);
      y += 10;
    }

    // Seção de Jurisprudências
    if (jurisprudencias.length > 0) {
      doc.addPage();
      y = margin;
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("JURISPRUDÊNCIAS CITADAS", margin, y);
      y += 10;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      jurisprudencias.forEach((juris, index) => {
        checkNewPage(30);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${juris.tribunal} - ${juris.numeroProcesso}`, margin, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const ementaLines = doc.splitTextToSize(juris.ementa, maxWidth);
        
        for (const line of ementaLines) {
          checkNewPage();
          doc.text(line, margin, y);
          y += 5;
        }
        
        y += 8;
      });
    }

    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Salvar
    const filename = `peticao-${titulo.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    doc.save(filename);

    toast({
      title: "PDF exportado com sucesso!",
      description: "O arquivo foi baixado para seu dispositivo.",
    });

    return true;
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    toast({
      title: "Erro ao exportar PDF",
      description: "Tente novamente mais tarde.",
      variant: "destructive",
    });
    return false;
  }
};
