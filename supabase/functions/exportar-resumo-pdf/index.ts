import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Upload para Supabase Storage
async function uploadParaSupabase(
  supabase: any, 
  bytes: Uint8Array, 
  bucket: string, 
  path: string, 
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType, upsert: true })
  
  if (error) {
    console.error('[upload] Erro:', error)
    throw new Error(`Erro no upload: ${error.message}`)
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  console.log(`[upload] URL pública: ${data.publicUrl}`)
  return data.publicUrl
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumo, titulo, videoId, resumoId, area, tema, urlAudio } = await req.json();
    
    if (!resumo || !titulo) {
      throw new Error("Resumo e título são obrigatórios");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe PDF em cache
    if (resumoId) {
      const { data: existingResumo } = await supabase
        .from("RESUMO")
        .select("url_pdf")
        .eq("id", resumoId)
        .single();

      if (existingResumo?.url_pdf) {
        console.log("PDF já existe em cache:", existingResumo.url_pdf);
        return new Response(
          JSON.stringify({ 
            pdfUrl: existingResumo.url_pdf,
            fromCache: true,
            message: "PDF recuperado do cache!"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Gerando PDF profissional para:", titulo);

    const jsPDF = (await import("https://esm.sh/jspdf@2.5.1")).default;
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Configurações
    const margemEsquerda = 25;
    const margemDireita = 20;
    const margemSuperior = 25;
    const margemInferior = 25;
    const larguraUtil = 210 - margemEsquerda - margemDireita;
    let y = margemSuperior;

    // Cores
    const corPrimaria = [41, 98, 255]; // Azul
    const corSecundaria = [100, 100, 100]; // Cinza
    const corTexto = [33, 33, 33]; // Quase preto

    // =====================
    // CAPA PROFISSIONAL
    // =====================
    
    // Fundo decorativo superior
    pdf.setFillColor(41, 98, 255);
    pdf.rect(0, 0, 210, 60, 'F');
    
    // Ícone de balança (desenho simplificado)
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1.5);
    // Base da balança
    pdf.line(105, 35, 105, 50);
    pdf.line(95, 50, 115, 50);
    // Braços
    pdf.line(85, 30, 125, 30);
    // Pratos
    pdf.circle(85, 35, 8);
    pdf.circle(125, 35, 8);
    
    // Título "RESUMO JURÍDICO"
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("RESUMO JURÍDICO", 105, 22, { align: "center" });

    // Área do Direito
    y = 80;
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(30, y - 8, 150, 20, 3, 3, 'F');
    pdf.setTextColor(...corPrimaria);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(area?.toUpperCase() || "DIREITO", 105, y, { align: "center" });
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...corSecundaria);
    pdf.text(tema || "", 105, y + 8, { align: "center" });

    // Linha decorativa
    y = 115;
    pdf.setDrawColor(...corPrimaria);
    pdf.setLineWidth(0.5);
    pdf.line(50, y, 160, y);

    // Título do resumo
    y = 135;
    pdf.setTextColor(...corTexto);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    const tituloLines = pdf.splitTextToSize(titulo, 140);
    tituloLines.forEach((line: string, i: number) => {
      pdf.text(line, 105, y + (i * 10), { align: "center" });
    });

    // Linha decorativa inferior
    y = 135 + (tituloLines.length * 10) + 15;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(50, y, 160, y);

    // Link do áudio (se disponível)
    if (urlAudio) {
      y += 20;
      pdf.setFillColor(240, 248, 255);
      pdf.roundedRect(40, y - 6, 130, 18, 3, 3, 'F');
      pdf.setTextColor(...corPrimaria);
      pdf.setFontSize(11);
      pdf.text("🎧 Escutar Narração do Resumo", 105, y + 2, { align: "center" });
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.textWithLink("Clique aqui para ouvir", 105, y + 8, { 
        align: "center",
        url: urlAudio 
      });
    }

    // Data
    y = 230;
    pdf.setTextColor(...corSecundaria);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const dataAtual = new Date().toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    pdf.text(`Gerado em ${dataAtual}`, 105, y, { align: "center" });

    // Rodapé da capa
    pdf.setFillColor(41, 98, 255);
    pdf.rect(0, 270, 210, 27, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("DIREITO PREMIUM", 105, 282, { align: "center" });
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Seu app de estudos jurídicos", 105, 289, { align: "center" });

    // =====================
    // PÁGINAS DE CONTEÚDO
    // =====================
    pdf.addPage();
    y = margemSuperior;

    // Função para adicionar header em cada página
    const addPageHeader = () => {
      pdf.setFillColor(41, 98, 255);
      pdf.rect(0, 0, 210, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      const tituloHeader = titulo.length > 60 ? titulo.substring(0, 57) + "..." : titulo;
      pdf.text(tituloHeader, 105, 10, { align: "center" });
    };

    addPageHeader();
    y = 25;

    // Função para verificar nova página
    const checkNewPage = (requiredSpace: number) => {
      if (y + requiredSpace > 297 - margemInferior) {
        pdf.addPage();
        addPageHeader();
        y = 25;
        return true;
      }
      return false;
    };

    // Função para processar texto com formatação
    const processFormattedText = (text: string, x: number, maxWidth: number, fontSize: number = 11) => {
      // Remover marcadores de negrito e itálico para o texto final
      let cleanText = text
        .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // Bold+Italic
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1') // Italic
        .replace(/__(.*?)__/g, '$1') // Bold alt
        .replace(/_(.*?)_/g, '$1'); // Italic alt
      
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...corTexto);
      
      const lines = pdf.splitTextToSize(cleanText, maxWidth);
      lines.forEach((line: string) => {
        checkNewPage(7);
        pdf.text(line, x, y);
        y += 6;
      });
    };

    // Processar Markdown
    const lines = resumo.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        y += 4;
        continue;
      }

      // Remover emojis
      const cleanLine = trimmedLine.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

      // Separador horizontal
      if (cleanLine === '---' || cleanLine === '***' || cleanLine === '___') {
        checkNewPage(10);
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margemEsquerda, y, 210 - margemDireita, y);
        y += 8;
        continue;
      }

      // Blockquote (citação)
      if (cleanLine.startsWith('>')) {
        checkNewPage(20);
        const quoteText = cleanLine.replace(/^>\s*/, '');
        
        // Calcular altura do bloco
        pdf.setFontSize(10);
        const quoteLines = pdf.splitTextToSize(quoteText, larguraUtil - 15);
        const blockHeight = quoteLines.length * 5 + 10;
        
        // Fundo cinza claro
        pdf.setFillColor(248, 248, 248);
        pdf.roundedRect(margemEsquerda, y - 3, larguraUtil, blockHeight, 2, 2, 'F');
        
        // Barra azul lateral
        pdf.setFillColor(...corPrimaria);
        pdf.rect(margemEsquerda, y - 3, 3, blockHeight, 'F');
        
        // Texto da citação
        pdf.setTextColor(80, 80, 80);
        pdf.setFont("helvetica", "italic");
        quoteLines.forEach((qLine: string) => {
          pdf.text(qLine, margemEsquerda + 8, y + 3);
          y += 5;
        });
        y += 8;
        continue;
      }

      // H1 (#)
      if (cleanLine.startsWith('# ') && !cleanLine.startsWith('## ')) {
        checkNewPage(20);
        pdf.setFillColor(...corPrimaria);
        pdf.rect(margemEsquerda - 5, y - 5, larguraUtil + 10, 12, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        const text = cleanLine.replace(/^#\s*/, '');
        pdf.text(text, margemEsquerda, y + 2);
        y += 18;
        continue;
      }

      // H2 (##)
      if (cleanLine.startsWith('## ')) {
        checkNewPage(18);
        y += 5;
        pdf.setDrawColor(...corPrimaria);
        pdf.setLineWidth(0.8);
        pdf.line(margemEsquerda, y + 6, margemEsquerda + 40, y + 6);
        pdf.setTextColor(...corPrimaria);
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        const text = cleanLine.replace(/^##\s*/, '');
        const textLines = pdf.splitTextToSize(text, larguraUtil);
        textLines.forEach((textLine: string) => {
          checkNewPage(10);
          pdf.text(textLine, margemEsquerda, y);
          y += 7;
        });
        y += 6;
        continue;
      }

      // H3 (###)
      if (cleanLine.startsWith('### ')) {
        checkNewPage(15);
        y += 3;
        pdf.setTextColor(...corTexto);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        const text = cleanLine.replace(/^###\s*/, '');
        const textLines = pdf.splitTextToSize(text, larguraUtil);
        textLines.forEach((textLine: string) => {
          checkNewPage(8);
          pdf.text(textLine, margemEsquerda, y);
          y += 6;
        });
        y += 4;
        continue;
      }

      // Listas numeradas
      if (/^\d+\.\s/.test(cleanLine)) {
        checkNewPage(12);
        const match = cleanLine.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          const numero = match[1];
          const texto = match[2].replace(/\*\*/g, '');
          
          // Número em círculo
          pdf.setFillColor(...corPrimaria);
          pdf.circle(margemEsquerda + 3, y - 1.5, 3, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.text(numero, margemEsquerda + 3, y, { align: "center" });
          
          // Texto
          pdf.setTextColor(...corTexto);
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          const textLines = pdf.splitTextToSize(texto, larguraUtil - 12);
          textLines.forEach((textLine: string, idx: number) => {
            if (idx > 0) checkNewPage(6);
            pdf.text(textLine, margemEsquerda + 10, y);
            y += 6;
          });
          y += 3;
        }
        continue;
      }

      // Listas com marcadores (nível 1)
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        checkNewPage(12);
        const text = cleanLine.replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
        
        // Bullet point
        pdf.setFillColor(...corPrimaria);
        pdf.circle(margemEsquerda + 2, y - 1, 1.5, 'F');
        
        pdf.setTextColor(...corTexto);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const textLines = pdf.splitTextToSize(text, larguraUtil - 10);
        textLines.forEach((textLine: string, idx: number) => {
          if (idx > 0) checkNewPage(6);
          pdf.text(textLine, margemEsquerda + 8, y);
          y += 6;
        });
        y += 2;
        continue;
      }

      // Listas aninhadas (nível 2)
      if (cleanLine.startsWith('  - ') || cleanLine.startsWith('  * ')) {
        checkNewPage(10);
        const text = cleanLine.replace(/^\s+[-*]\s*/, '').replace(/\*\*/g, '');
        
        // Bullet secundário
        pdf.setDrawColor(...corSecundaria);
        pdf.circle(margemEsquerda + 10, y - 1, 1, 'S');
        
        pdf.setTextColor(...corSecundaria);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const textLines = pdf.splitTextToSize(text, larguraUtil - 18);
        textLines.forEach((textLine: string, idx: number) => {
          if (idx > 0) checkNewPage(5);
          pdf.text(textLine, margemEsquerda + 15, y);
          y += 5;
        });
        y += 2;
        continue;
      }

      // Texto normal
      checkNewPage(10);
      processFormattedText(cleanLine, margemEsquerda, larguraUtil);
      y += 2;
    }

    // Adicionar numeração de páginas
    const totalPages = pdf.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Página ${i - 1} de ${totalPages - 1}`, 105, 290, { align: "center" });
    }

    // Gerar PDF
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const uint8Array = new Uint8Array(pdfArrayBuffer);
    
    console.log("PDF gerado, fazendo upload para Supabase Storage...");

    // Upload para Supabase Storage
    const timestamp = Date.now();
    const safeTitle = titulo.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    const path = `resumos/${safeTitle}_${timestamp}.pdf`;
    const pdfUrl = await uploadParaSupabase(supabase, uint8Array, 'pdfs', path, 'application/pdf');

    console.log("PDF uploaded para Supabase:", pdfUrl);

    // Salvar URL no banco de dados
    if (resumoId) {
      const { error: updateError } = await supabase
        .from("RESUMO")
        .update({ url_pdf: pdfUrl })
        .eq("id", resumoId);

      if (updateError) {
        console.error("Erro ao salvar URL do PDF:", updateError);
      } else {
        console.log("URL do PDF salva no banco de dados");
      }
    }

    return new Response(
      JSON.stringify({ 
        pdfUrl,
        fromCache: false,
        message: "PDF gerado e enviado com sucesso!"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
