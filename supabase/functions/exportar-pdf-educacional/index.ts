import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📄 Função exportar-pdf-educacional iniciada');
    const { content, filename, title, darkMode = false } = await req.json();
    console.log('📄 Dados recebidos:', { filename, title, contentLength: content?.length, darkMode });

    if (!content || !filename || !title) {
      console.error('❌ Dados faltando:', { content: !!content, filename: !!filename, title: !!title });
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: content, filename, title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Validação de dados OK');

    // Importar jsPDF dinamicamente (método correto)
    console.log('📦 Importando jsPDF...');
    const jsPDF = (await import("https://esm.sh/jspdf@2.5.1")).default;
    console.log('✅ jsPDF importado');
    
    const doc = new jsPDF();
    console.log('✅ Documento PDF criado');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // MARGENS ABNT: Superior 3cm, Inferior 2cm, Esquerda 3cm, Direita 2cm
    const marginTop = 30;
    const marginBottom = 20;
    const marginLeft = 30;
    const marginRight = 20;
    const maxWidth = pageWidth - marginLeft - marginRight;
    let y = marginTop;

    // Aplicar fundo escuro se darkMode estiver ativado
    if (darkMode) {
      doc.setFillColor(15, 15, 15); // Cor de fundo escuro (#0f0f0f)
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    // CABEÇALHO ABNT (Título centralizado em 14pt, negrito)
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    if (darkMode) doc.setTextColor(255, 255, 255); // Texto branco no modo escuro
    const titleLines = doc.splitTextToSize(title, maxWidth);
    titleLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 7;
    });
    y += 10;

    // Data (10pt, normal)
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    if (darkMode) doc.setTextColor(200, 200, 200); // Texto cinza claro
    const date = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${date}`, pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Função auxiliar para verificar e adicionar nova página
    const checkAndAddPage = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight - marginBottom) {
        doc.addPage();
        if (darkMode) {
          doc.setFillColor(15, 15, 15);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          doc.setTextColor(255, 255, 255);
        }
        y = marginTop;
        return true;
      }
      return false;
    };

    // Processar conteúdo markdown
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Processar formatação com fontes e tamanhos ABNT
      // Função auxiliar para remover emojis
      const removeEmojis = (text: string) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]/gu, '').trim();
      };
      
      if (line.startsWith('# ')) {
        checkAndAddPage(20);
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        if (darkMode) doc.setTextColor(255, 255, 255);
        const text = removeEmojis(line.replace('# ', ''));
        const splitText = doc.splitTextToSize(text, maxWidth);
        
        splitText.forEach((textLine: string, index: number) => {
          if (index > 0) checkAndAddPage(10);
          doc.text(textLine, marginLeft, y);
          y += 7;
        });
        y += 8;
      } else if (line.startsWith('## ')) {
        checkAndAddPage(18);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        if (darkMode) doc.setTextColor(240, 240, 240);
        const text = removeEmojis(line.replace('## ', ''));
        const splitText = doc.splitTextToSize(text, maxWidth);
        
        splitText.forEach((textLine: string, index: number) => {
          if (index > 0) checkAndAddPage(8);
          doc.text(textLine, marginLeft, y);
          y += 6;
        });
        y += 6;
      } else if (line.startsWith('### ')) {
        checkAndAddPage(16);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        if (darkMode) doc.setTextColor(230, 230, 230);
        const text = removeEmojis(line.replace('### ', ''));
        const splitText = doc.splitTextToSize(text, maxWidth);
        
        splitText.forEach((textLine: string, index: number) => {
          if (index > 0) checkAndAddPage(8);
          doc.text(textLine, marginLeft, y);
          y += 6;
        });
        y += 5;
      } else if (/^\d+\.\s/.test(line)) {
        // Lista numerada
        checkAndAddPage(14);
        doc.setFontSize(14);
        doc.setFont("times", "normal");
        if (darkMode) doc.setTextColor(200, 200, 200);
        const text = line;
        const splitText = doc.splitTextToSize(text, maxWidth - 10);
        
        splitText.forEach((textLine: string, index: number) => {
          if (index > 0) checkAndAddPage(9);
          doc.text(textLine, marginLeft + 10, y);
          y += 7;
        });
        y += 4;
      } else if (line.includes('- [ ]') || line.includes('- [x]')) {
        // Checkbox
        checkAndAddPage(14);
        doc.setFontSize(14);
        doc.setFont("times", "normal");
        if (darkMode) doc.setTextColor(200, 200, 200);
        const checkbox = line.includes('[x]') ? '☑' : '☐';
        const text = line.replace(/- \[[ x]\]/, checkbox);
        const splitText = doc.splitTextToSize(text, maxWidth - 10);
        
        splitText.forEach((textLine: string, index: number) => {
          if (index > 0) checkAndAddPage(9);
          doc.text(textLine, marginLeft + 10, y);
          y += 7;
        });
        y += 4;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        checkAndAddPage(14);
        doc.setFontSize(14);
        doc.setFont("times", "normal");
        if (darkMode) doc.setTextColor(200, 200, 200);
        const text = line.replace(/^[*-] /, '• ');
        const splitText = doc.splitTextToSize(text, maxWidth - 10);
        
        splitText.forEach((textLine: string, index: number) => {
          if (index > 0) checkAndAddPage(9);
          doc.text(textLine, marginLeft + 10, y);
          y += 7;
        });
        y += 4;
      } else if (line.startsWith('>')) {
        checkAndAddPage(16);
        doc.setFontSize(14);
        doc.setFont("times", "italic");
        if (darkMode) doc.setTextColor(180, 180, 180);
        const text = removeEmojis(line.replace(/^>\s*\*?/, '').replace(/\*$/g, ''));
        const splitText = doc.splitTextToSize(text, maxWidth - 20);
        
        splitText.forEach((textLine: string, index: number) => {
          if (index > 0) checkAndAddPage(9);
          doc.text(textLine, marginLeft + 10, y);
          y += 7;
        });
        y += 5;
      } else if (line.startsWith('---')) {
        y += 8;
      } else if (line.trim() === '') {
        y += 6;
      } else if (line.trim().length > 0) {
        checkAndAddPage(14);
        doc.setFontSize(14);
        doc.setFont("times", "normal");
        if (darkMode) doc.setTextColor(200, 200, 200);
        
        // Função para remover TODOS os emojis Unicode
        const removeAllEmojis = (text: string) => {
          return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]/gu, '').trim();
        };
        
        let processedLine = removeAllEmojis(line);
        
        // Detectar formatações: negrito **texto**, itálico *texto* ou _texto_, código `texto`
        const hasFormatting = /\*\*.*?\*\*|\*.*?\*|_.*?_|`.*?`/.test(processedLine);
        
        if (!hasFormatting) {
          // Texto simples sem formatação
          const splitText = doc.splitTextToSize(processedLine, maxWidth);
          splitText.forEach((textLine: string, index: number) => {
            if (index > 0) {
              y += 8;
              checkAndAddPage(12);
            }
            doc.text(textLine, marginLeft, y);
          });
          y += 9;
        } else {
          // Texto com formatação - processar linha por linha
          // Primeiro, obter o texto limpo para calcular quebras de linha
          const plainText = processedLine
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            .replace(/`(.*?)`/g, '$1');
          
          const textLines = doc.splitTextToSize(plainText, maxWidth);
          
          // Para cada linha de texto, renderizar com formatação
          textLines.forEach((textLine: string, lineIndex: number) => {
            if (lineIndex > 0) {
              y += 8;
              checkAndAddPage(12);
            }
            
            // Encontrar a parte correspondente no texto original
            let currentX = marginLeft;
            let remainingText = processedLine;
            let lineRendered = '';
            
            // Processar tokens de formatação
            const formatRegex = /(\*\*.*?\*\*|\*.*?\*|_.*?_|`.*?`|[^*_`]+)/g;
            let match;
            
            while ((match = formatRegex.exec(remainingText)) !== null) {
              const token = match[0];
              let text = token;
              let bold = false;
              let italic = false;
              let code = false;
              
              // Identificar tipo de formatação
              if (token.startsWith('**') && token.endsWith('**')) {
                text = token.slice(2, -2);
                bold = true;
              } else if ((token.startsWith('*') && token.endsWith('*') && !token.startsWith('**')) ||
                         (token.startsWith('_') && token.endsWith('_'))) {
                text = token.slice(1, -1);
                italic = true;
              } else if (token.startsWith('`') && token.endsWith('`')) {
                text = token.slice(1, -1);
                code = true;
              }
              
              // Verificar se este texto está na linha atual
              if (lineRendered.length + text.length <= textLine.length) {
                // Aplicar estilo
                if (bold) {
                  doc.setFont("times", "bold");
                  if (darkMode) doc.setTextColor(255, 255, 255);
                } else if (italic) {
                  doc.setFont("times", "italic");
                  if (darkMode) doc.setTextColor(220, 220, 220);
                } else if (code) {
                  doc.setFont("courier", "normal");
                  if (darkMode) doc.setTextColor(200, 220, 255);
                } else {
                  doc.setFont("times", "normal");
                  if (darkMode) doc.setTextColor(200, 200, 200);
                }
                
                const textWidth = doc.getTextWidth(text);
                doc.text(text, currentX, y);
                currentX += textWidth;
                lineRendered += text;
              }
            }
            
            // Resetar estilo
            doc.setFont("times", "normal");
            if (darkMode) doc.setTextColor(200, 200, 200);
          });
          
          y += 9;
        }
      }
    }

    // Rodapé ABNT - Numeração a partir da 2ª página, 10pt
    const totalPages = doc.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("times", "normal");
      if (darkMode) doc.setTextColor(150, 150, 150);
      doc.text(
        `${i}`,
        pageWidth - marginRight,
        pageHeight - 15,
        { align: 'right' }
      );
    }

    // Gerar PDF como array buffer
    console.log('📄 Gerando PDF...');
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
    console.log('✅ PDF gerado - Tamanho:', pdfUint8Array.length, 'bytes');

    // Criar cliente Supabase
    console.log('🔑 Criando cliente Supabase...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Cliente Supabase criado');

    // Nome do arquivo único
    const uniqueFilename = `${filename}-${Date.now()}.pdf`;
    console.log('📁 Nome do arquivo:', uniqueFilename);

    // Upload para Storage
    console.log('☁️ Fazendo upload para storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs-educacionais')
      .upload(uniqueFilename, pdfUint8Array, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });
    
    console.log('Upload resultado:', { uploadData, uploadError });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      throw uploadError;
    }

    console.log('✅ Upload concluído com sucesso');

    // Gerar URL pública assinada (válida por 24 horas)
    console.log('🔗 Gerando URL assinada...');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pdfs-educacionais')
      .createSignedUrl(uniqueFilename, 86400); // 24 horas

    console.log('URL assinada resultado:', { signedUrlData, signedUrlError });

    if (!signedUrlData || signedUrlError) {
      console.error('❌ Erro ao gerar URL assinada:', signedUrlError);
      throw new Error('Não foi possível gerar URL do PDF');
    }

    console.log('✅ URL assinada gerada:', signedUrlData.signedUrl);

    const response = {
      pdfUrl: signedUrlData.signedUrl,
      message: 'PDF gerado com sucesso. Link válido por 24 horas.'
    };
    console.log('✅ Resposta final:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao gerar PDF:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
