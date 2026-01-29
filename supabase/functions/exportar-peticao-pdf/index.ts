import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Jurisprudencia {
  numeroProcesso: string;
  tribunal: string;
  ementa: string;
  relator?: string;
  dataJulgamento?: string;
}

interface DadosPessoais {
  nomeCliente?: string;
  rgCliente?: string;
  cpfCliente?: string;
  enderecoCliente?: string;
  cidadeCliente?: string;
  estadoCliente?: string;
  cepCliente?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  nomeAdvogado?: string;
  oabNumero?: string;
  oabEstado?: string;
  enderecoEscritorio?: string;
  telefoneEscritorio?: string;
  emailEscritorio?: string;
  assinaturaNome?: string;
  assinaturaUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titulo, conteudo, jurisprudencias, dadosPessoais } = await req.json();
    
    if (!titulo || !conteudo) {
      throw new Error("Título e conteúdo são obrigatórios");
    }

    console.log("Gerando PDF ABNT de petição:", titulo);

    // Importar jsPDF dinamicamente
    const jsPDF = (await import("https://esm.sh/jspdf@2.5.1")).default;
    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    
    // Margens ABNT: 3cm superior e esquerda, 2cm inferior e direita
    const marginTop = 30;
    const marginBottom = 20;
    const marginLeft = 30;
    const marginRight = 20;
    const maxWidth = pageWidth - marginLeft - marginRight; // 160mm
    const contentHeight = pageHeight - marginTop - marginBottom;
    
    let y = marginTop;
    let pageNum = 1;

    // Função auxiliar para adicionar nova página
    const checkNewPage = (space: number = 10) => {
      if (y > pageHeight - marginBottom - space) {
        doc.addPage();
        y = marginTop;
        pageNum++;
        return true;
      }
      return false;
    };

    // Função para limpar texto de markdown
    const limparMarkdown = (text: string): string => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s*/g, '')
        .replace(/`(.*?)`/g, '$1')
        .replace(/>\s*/g, '')
        .trim();
    };

    // Função para detectar tipo de conteúdo
    const detectarTipo = (texto: string): 'enderecamento' | 'secao' | 'citacao' | 'pedido' | 'normal' => {
      const textoLimpo = texto.trim().toUpperCase();
      
      if (/^EXCELENT|^AO\s+JUIZ|^MM\.|^ILUSTRÍSSIMO/.test(textoLimpo)) {
        return 'enderecamento';
      }
      if (/^(I{1,3}V?|V?I{0,3})\s*[-–—.]\s*|^(DOS?\s+|DA\s+|DAS\s+)(FATOS?|DIREITO|PEDIDOS?|PRELIMINAR|MÉRITO|FUNDAMENTAÇÃO|CONCLUSÃO|REQUERIMENTOS?)/.test(textoLimpo)) {
        return 'secao';
      }
      if (/^\d+\s*[-–.]|^[IVX]+\s*[-–.]|^[a-z]\)/.test(texto.trim())) {
        return 'pedido';
      }
      if (texto.length > 200 || /^[""]|^(RECURSO|AGRAVO|APELAÇÃO|EMENTA|SÚMULA|STF|STJ|TJ|TRF)/.test(textoLimpo)) {
        return 'citacao';
      }
      return 'normal';
    };

    // Função para adicionar texto com formatação ABNT
    const addTextoABNT = (texto: string, tipo: 'enderecamento' | 'secao' | 'citacao' | 'pedido' | 'normal') => {
      const textoLimpo = limparMarkdown(texto);
      if (!textoLimpo) return;

      doc.setTextColor(0, 0, 0);

      switch (tipo) {
        case 'enderecamento':
          // Endereçamento: negrito, maiúsculo, esquerda
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          const linesEnd = doc.splitTextToSize(textoLimpo.toUpperCase(), maxWidth);
          for (const line of linesEnd) {
            checkNewPage();
            doc.text(line, marginLeft, y);
            y += 6;
          }
          y += 10;
          break;

        case 'secao':
          // Seção: negrito, maiúsculo, espaçamento antes
          checkNewPage(15);
          y += 8;
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(textoLimpo.toUpperCase(), marginLeft, y);
          y += 8;
          break;

        case 'citacao':
          // Citação longa ABNT: recuo 4cm, fonte 10pt, espaçamento simples
          checkNewPage(20);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          const citacaoWidth = maxWidth - 40; // Recuo adicional de 4cm
          const linesCit = doc.splitTextToSize(textoLimpo, citacaoWidth);
          for (const line of linesCit) {
            checkNewPage();
            doc.text(line, marginLeft + 40, y); // 4cm de recuo
            y += 4; // Espaçamento simples
          }
          y += 6;
          break;

        case 'pedido':
          // Pedido: com recuo
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          const linesPed = doc.splitTextToSize(textoLimpo, maxWidth - 10);
          for (let i = 0; i < linesPed.length; i++) {
            checkNewPage();
            doc.text(linesPed[i], marginLeft + 10, y);
            y += 5;
          }
          y += 3;
          break;

        default:
          // Parágrafo normal ABNT: recuo 1,25cm na primeira linha, justificado, 1,5 entrelinhas
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(textoLimpo, maxWidth - 12.5); // Considerando recuo
          
          for (let i = 0; i < lines.length; i++) {
            checkNewPage();
            const xPos = i === 0 ? marginLeft + 12.5 : marginLeft; // Recuo 1,25cm na primeira linha
            doc.text(lines[i], xPos, y);
            y += 6; // Aproximadamente 1,5 entrelinhas para fonte 12pt
          }
          y += 3; // Espaçamento duplo entre parágrafos
          break;
      }
    };

    // Processar conteúdo
    const processarConteudo = (texto: string) => {
      const paragrafos = texto.split('\n');
      
      for (const paragrafo of paragrafos) {
        const p = paragrafo.trim();
        if (!p) {
          y += 3;
          continue;
        }
        
        const tipo = detectarTipo(p);
        addTextoABNT(p, tipo);
      }
    };

    // Processar cada etapa
    if (conteudo.etapa1) {
      processarConteudo(conteudo.etapa1);
    }
    
    if (conteudo.etapa2) {
      y += 5;
      processarConteudo(conteudo.etapa2);
    }
    
    if (conteudo.etapa3) {
      y += 5;
      processarConteudo(conteudo.etapa3);
    }

    // Área de Assinatura
    checkNewPage(50);
    y += 20;
    
    const assinaturaX = pageWidth / 2;
    
    // Imagem de assinatura
    if ((dadosPessoais as DadosPessoais)?.assinaturaUrl) {
      try {
        const imgResponse = await fetch((dadosPessoais as DadosPessoais).assinaturaUrl!);
        if (imgResponse.ok) {
          const imgBuffer = await imgResponse.arrayBuffer();
          const imgBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
          const imgType = (dadosPessoais as DadosPessoais).assinaturaUrl!.includes('.png') ? 'PNG' : 'JPEG';
          
          doc.addImage(
            `data:image/${imgType.toLowerCase()};base64,${imgBase64}`,
            imgType,
            assinaturaX - 25,
            y - 10,
            50,
            20
          );
          y += 15;
        }
      } catch (imgError) {
        console.log("Não foi possível carregar imagem de assinatura");
        doc.setDrawColor(0, 0, 0);
        doc.line(assinaturaX - 40, y, assinaturaX + 40, y);
        y += 5;
      }
    } else {
      doc.setDrawColor(0, 0, 0);
      doc.line(assinaturaX - 40, y, assinaturaX + 40, y);
      y += 5;
    }
    
    // Nome e OAB
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const nomeAssinatura = (dadosPessoais as DadosPessoais)?.assinaturaNome || 
                          (dadosPessoais as DadosPessoais)?.nomeAdvogado || 
                          "________________________";
    doc.text(nomeAssinatura, assinaturaX, y, { align: 'center' });
    y += 5;
    
    if ((dadosPessoais as DadosPessoais)?.oabNumero && (dadosPessoais as DadosPessoais)?.oabEstado) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `OAB/${(dadosPessoais as DadosPessoais).oabEstado} nº ${(dadosPessoais as DadosPessoais).oabNumero}`, 
        assinaturaX, 
        y, 
        { align: 'center' }
      );
    }

    // Anexo de Jurisprudências
    if (jurisprudencias && jurisprudencias.length > 0) {
      doc.addPage();
      y = marginTop;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("JURISPRUDÊNCIAS CITADAS", pageWidth / 2, y, { align: 'center' });
      y += 8;

      doc.setDrawColor(180, 180, 180);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 10;

      jurisprudencias.forEach((juris: Jurisprudencia, index: number) => {
        checkNewPage(35);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${juris.tribunal} - ${juris.numeroProcesso}`, marginLeft, y);
        y += 6;

        if (juris.relator) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Relator: ${juris.relator}`, marginLeft, y);
          y += 5;
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const ementaLines = doc.splitTextToSize(juris.ementa, maxWidth);
        
        for (const line of ementaLines) {
          checkNewPage();
          doc.text(line, marginLeft, y);
          y += 4;
        }
        
        y += 8;
      });
    }

    // Rodapé com numeração (a partir da página 2)
    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        `${i}`,
        pageWidth - marginRight,
        marginTop - 10,
        { align: 'right' }
      );
    }

    // Gerar PDF
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

    console.log("PDF ABNT gerado com sucesso");

    // Upload para Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const filename = `peticao-${Date.now()}-${titulo.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}.pdf`;
    const bucketName = "pdfs-educacionais";

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucketName}/${filename}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/pdf",
        },
        body: pdfUint8Array,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Erro ao fazer upload:", errorText);
      throw new Error("Erro ao fazer upload do PDF");
    }

    // Gerar URL assinada
    const signedUrlResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/${bucketName}/${filename}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 86400 }),
      }
    );

    if (!signedUrlResponse.ok) {
      throw new Error("Erro ao gerar URL assinada");
    }

    const { signedURL } = await signedUrlResponse.json();
    const fullSignedUrl = `${supabaseUrl}/storage/v1${signedURL}`;

    console.log("PDF salvo:", fullSignedUrl);

    return new Response(
      JSON.stringify({ 
        pdfUrl: fullSignedUrl,
        message: "PDF gerado com formatação ABNT! Link válido por 24 horas."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
