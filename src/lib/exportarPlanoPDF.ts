import jsPDF from "jspdf";
import { PlanoEstudosData } from "./planoEstudosParser";
import { supabase } from "@/integrations/supabase/client";

interface ExportarPlanoPDFOptions {
  plano: PlanoEstudosData;
  materia: string;
  totalHoras?: number;
  dataGeracao?: string;
}

export const exportarPlanoPDF = async ({
  plano,
  materia,
  totalHoras,
  dataGeracao = new Date().toLocaleDateString("pt-BR"),
}: ExportarPlanoPDFOptions): Promise<string | null> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const addNewPageIfNeeded = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const addText = (
    text: string,
    options: {
      fontSize?: number;
      fontStyle?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      indent?: number;
    } = {}
  ) => {
    const {
      fontSize = 11,
      fontStyle = "normal",
      color = [51, 51, 51],
      indent = 0,
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      addNewPageIfNeeded(8);
      doc.text(line, margin + indent, yPosition);
      yPosition += fontSize * 0.4 + 2;
    });
  };

  const addSection = (title: string) => {
    addNewPageIfNeeded(25);
    yPosition += 8;
    
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(margin - 5, yPosition - 6, contentWidth + 10, 12, 2, 2, "F");
    
    addText(title, {
      fontSize: 13,
      fontStyle: "bold",
      color: [59, 59, 59],
    });
    yPosition += 4;
  };

  // ========== HEADER ==========
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PLANO DE ESTUDOS", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(materia, pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(10);
  const cargaInfo = plano.visaoGeral.cargaTotal || (totalHoras ? `${totalHoras}h` : '');
  const metaInfo = `Data: ${dataGeracao}${cargaInfo ? ` | Carga horaria: ${cargaInfo}` : ""}`;
  doc.text(metaInfo, pageWidth / 2, 38, { align: "center" });

  yPosition = 55;

  // ========== OBJETIVO ==========
  if (plano.objetivo) {
    addSection("OBJETIVO");
    addText(plano.objetivo);
  }

  // ========== VISÃO GERAL ==========
  if (plano.visaoGeral.descricao) {
    addSection("VISAO GERAL");
    addText(plano.visaoGeral.descricao);
  }

  // ========== CRONOGRAMA SEMANAL ==========
  if (plano.cronograma && plano.cronograma.length > 0) {
    addSection("CRONOGRAMA SEMANAL");

    plano.cronograma.forEach((semana) => {
      addNewPageIfNeeded(20);
      yPosition += 5;
      
      // Semana header
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(margin, yPosition - 5, contentWidth, 10, 2, 2, "F");
      
      addText(`Semana ${semana.semana}: ${semana.titulo}`, {
        fontSize: 11,
        fontStyle: "bold",
        color: [67, 56, 202],
      });
      yPosition += 3;

      // Dias da semana
      semana.dias.forEach((dia) => {
        addNewPageIfNeeded(15);
        addText(`${dia.dia} (${dia.cargaHoraria})`, {
          fontSize: 10,
          fontStyle: "bold",
          indent: 5,
        });

        // Tópicos do dia
        dia.topicos.forEach((topico) => {
          addNewPageIfNeeded(10);
          const textoTopico = topico.horario ? `${topico.horario} - ${topico.titulo}` : topico.titulo;
          addText(textoTopico, {
            fontSize: 10,
            indent: 12,
            color: [71, 71, 71],
          });
          if (topico.descricao) {
            addText(topico.descricao, {
              fontSize: 9,
              indent: 15,
              color: [100, 100, 100],
            });
          }
        });
        yPosition += 2;
      });
    });
  }

  // ========== MATERIAIS ==========
  if (plano.materiais && plano.materiais.length > 0) {
    addSection("MATERIAIS DE ESTUDO");
    plano.materiais.forEach((material) => {
      addNewPageIfNeeded(15);
      addText(`[${material.tipo}] ${material.titulo}`, {
        fontSize: 10,
        fontStyle: "bold",
        indent: 5,
      });
      if (material.autor) {
        addText(`Por: ${material.autor}`, {
          fontSize: 9,
          indent: 10,
          color: [100, 100, 100],
        });
      }
      if (material.detalhes) {
        addText(material.detalhes, {
          fontSize: 9,
          indent: 10,
          color: [80, 80, 80],
        });
      }
      yPosition += 2;
    });
  }

  // ========== ESTRATÉGIAS ==========
  if (plano.estrategias && plano.estrategias.length > 0) {
    addSection("ESTRATEGIAS DE ESTUDO");
    plano.estrategias.forEach((estrategia, idx) => {
      addNewPageIfNeeded(15);
      addText(`${idx + 1}. ${estrategia.titulo}`, {
        fontSize: 10,
        fontStyle: "bold",
        indent: 5,
      });
      addText(estrategia.descricao, {
        fontSize: 9,
        indent: 10,
        color: [71, 71, 71],
      });
      yPosition += 2;
    });
  }

  // ========== CHECKLIST ==========
  if (plano.checklist && plano.checklist.length > 0) {
    addSection("CHECKLIST DE METAS");
    plano.checklist.forEach((item) => {
      addNewPageIfNeeded(10);
      addText(`[ ] Semana ${item.semana}: ${item.meta}`, {
        fontSize: 10,
        indent: 5,
      });
    });
  }

  // ========== REVISÃO FINAL ==========
  if (plano.revisaoFinal.descricao) {
    addSection("REVISAO FINAL");
    addText(plano.revisaoFinal.descricao);
    
    if (plano.revisaoFinal.simulado) {
      yPosition += 5;
      addNewPageIfNeeded(15);
      doc.setFillColor(255, 245, 230);
      doc.roundedRect(margin, yPosition - 3, contentWidth, 15, 2, 2, "F");
      
      addText("Simulado Final", {
        fontSize: 10,
        fontStyle: "bold",
        color: [180, 100, 50],
      });
      addText(`Duracao: ${plano.revisaoFinal.simulado.duracao} | Formato: ${plano.revisaoFinal.simulado.formato}`, {
        fontSize: 9,
        color: [100, 100, 100],
      });
    }
  }

  // ========== FOOTER (todas as páginas) ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Pagina ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    doc.text(
      "Gerado por Direito Premium",
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  }

  // Gera blob do PDF
  const pdfBlob = doc.output('blob');
  const timestamp = Date.now();
  const fileName = `plano-estudos-${materia.toLowerCase().replace(/\s+/g, "-")}-${timestamp}.pdf`;
  const filePath = `planos-temporarios/${fileName}`;

  // Upload para Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('pdfs-educacionais')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.error('Erro ao fazer upload do PDF:', uploadError);
    return null;
  }

  // Obtém URL pública
  const { data: urlData } = supabase.storage
    .from('pdfs-educacionais')
    .getPublicUrl(filePath);

  if (urlData?.publicUrl) {
    // Abre em nova aba do navegador
    window.open(urlData.publicUrl, '_blank');
    return urlData.publicUrl;
  }

  return null;
};
