import { jsPDF } from "jspdf";
import { toast } from "@/hooks/use-toast";

interface PDFExporterProps {
  content: string;
  filename: string;
  title: string;
  onExport?: () => void;
}

export const exportToPDF = ({ content, filename, title }: Omit<PDFExporterProps, 'onExport'>) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // MARGENS ABNT: Superior 3cm, Inferior 2cm, Esquerda 3cm, Direita 2cm
    const marginTop = 30; // 3cm
    const marginBottom = 20; // 2cm
    const marginLeft = 30; // 3cm
    const marginRight = 20; // 2cm
    const maxWidth = pageWidth - marginLeft - marginRight;
    let y = marginTop;

    // CABEÇALHO ABNT (Título centralizado em 14pt, negrito)
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    const titleLines = doc.splitTextToSize(title, maxWidth);
    titleLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 7;
    });
    y += 10;

    // Data (10pt, normal)
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Processar conteúdo markdown
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Verificar se precisa de nova página (respeitando margem inferior ABNT)
      if (y > pageHeight - marginBottom - 15) {
        doc.addPage();
        y = marginTop;
      }

      // Processar formatação com fontes e tamanhos ABNT
      if (line.startsWith('# ')) {
        // Título H1 - 14pt, negrito, Times
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        const text = line.replace('# ', '').replace(/[📄🎯📋⚖️🔍📌]/g, '').trim();
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, marginLeft, y);
        y += splitText.length * 9 + 14; // Espaçamento maior para melhor estrutura
      } else if (line.startsWith('## ')) {
        // Título H2 - 12pt, negrito, Times
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        const text = line.replace('## ', '').replace(/[📄🎯📋⚖️🔍📌]/g, '').trim();
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, marginLeft, y);
        y += splitText.length * 8 + 10; // Mais espaço após subtítulos
      } else if (line.startsWith('### ')) {
        // Título H3 - 12pt, negrito, Times
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        const text = line.replace('### ', '').replace(/[📄🎯📋⚖️🔍📌]/g, '').trim();
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, marginLeft, y);
        y += splitText.length * 7 + 8; // Espaçamento melhorado
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Lista - 12pt, Times, espaçamento melhorado
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        const text = line.replace(/^[*-] /, '• ');
        const splitText = doc.splitTextToSize(text, maxWidth - 10);
        doc.text(splitText, marginLeft + 10, y);
        y += splitText.length * 7 + 6; // Espaçamento maior entre itens
      } else if (line.startsWith('---')) {
        // Linha divisória - espaço maior para separação visual
        y += 12;
      } else if (line.trim() === '') {
        // Linha vazia - espaçamento ABNT aumentado
        y += 10;
      } else {
        // Texto normal - 12pt, Times, espaçamento 1.5
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        
        // Remover emojis e processar negrito **texto**
        let processedLine = line.replace(/[📄🎯📋⚖️🔍📌💡🏛️⚡🎓]/g, '');
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts: { text: string; bold: boolean }[] = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(processedLine)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ text: processedLine.substring(lastIndex, match.index), bold: false });
          }
          parts.push({ text: match[1], bold: true });
          lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < processedLine.length) {
          parts.push({ text: processedLine.substring(lastIndex), bold: false });
        }

        if (parts.length > 0) {
          let currentX = marginLeft;
          for (const part of parts) {
            doc.setFont("times", part.bold ? "bold" : "normal");
            doc.text(part.text, currentX, y);
            currentX += doc.getTextWidth(part.text);
          }
          y += 9; // Espaçamento aumentado entre parágrafos
        } else {
          const splitText = doc.splitTextToSize(processedLine, maxWidth);
          doc.text(splitText, marginLeft, y);
          y += splitText.length * 9; // Espaçamento aumentado para melhor legibilidade
        }
      }
    }

    // Rodapé ABNT - Numeração a partir da 2ª página, 10pt
    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("times", "normal");
      doc.text(
        `${i}`,
        pageWidth - marginRight,
        pageHeight - 15,
        { align: 'right' }
      );
    }

    // Salvar
    doc.save(`${filename}.pdf`);
    
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
