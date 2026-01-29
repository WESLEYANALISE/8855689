import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl } = await req.json();
    
    console.log("[Ética] Processando PDF:", pdfUrl);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se é uma URL do Google Drive
    let downloadUrl = pdfUrl;
    
    if (pdfUrl.includes('drive.google.com/drive/folders')) {
      throw new Error('Por favor, forneça o link direto do arquivo PDF, não da pasta.');
    }
    
    if (pdfUrl.includes('drive.google.com')) {
      let fileId = null;
      
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/
      ];
      
      for (const pattern of patterns) {
        const match = pdfUrl.match(pattern);
        if (match) {
          fileId = match[1];
          break;
        }
      }
      
      if (fileId) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log("ID do arquivo extraído:", fileId);
        console.log("URL de download:", downloadUrl);
      } else {
        throw new Error('Não foi possível extrair o ID do arquivo do Google Drive');
      }
    }

    // Baixar o PDF
    const pdfResponse = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!pdfResponse.ok) {
      throw new Error(`Erro ao baixar PDF: ${pdfResponse.status}`);
    }

    const contentType = pdfResponse.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      throw new Error('O arquivo não é um PDF válido ou requer permissão de acesso.');
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    
    console.log(`PDF baixado: ${Math.round(pdfBytes.length / 1024)} KB`);

    // Converter para base64
    let base64Pdf = '';
    const chunkSize = 8192;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.slice(i, Math.min(i + chunkSize, pdfBytes.length));
      base64Pdf += String.fromCharCode(...chunk);
    }
    base64Pdf = btoa(base64Pdf);

    console.log("Iniciando extração com Mistral OCR...");

    // Chamar Mistral OCR
    const mistralKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralKey) {
      throw new Error('MISTRAL_API_KEY não configurada');
    }

    const ocrResponse = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralKey}`
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          document_url: `data:application/pdf;base64,${base64Pdf}`
        }
      })
    });

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error("Erro Mistral:", errorText);
      throw new Error(`Erro na extração OCR: ${ocrResponse.status}`);
    }

    const ocrResult = await ocrResponse.json();
    console.log("Resposta Mistral recebida");
    
    const pages = ocrResult.pages || [];
    console.log(`Total de páginas extraídas: ${pages.length}`);

    // Limpar páginas antigas da tabela de ética
    const { error: deleteError } = await supabase
      .from('oab_etica_paginas')
      .delete()
      .gte('id', 0); // Delete all

    if (deleteError) {
      console.log("Tabela oab_etica_paginas pode não existir, tentando criar...");
    }

    // Inserir páginas extraídas
    const paginasParaInserir = pages.map((page: any, index: number) => ({
      pagina: index + 1,
      conteudo: page.markdown || page.text || ''
    }));

    if (paginasParaInserir.length > 0) {
      // Inserir em batches de 50
      for (let i = 0; i < paginasParaInserir.length; i += 50) {
        const batch = paginasParaInserir.slice(i, i + 50);
        const { error: insertError } = await supabase
          .from('oab_etica_paginas')
          .insert(batch);
        
        if (insertError) {
          console.error("Erro ao inserir páginas:", insertError);
          throw insertError;
        }
      }
    }

    console.log(`${paginasParaInserir.length} páginas salvas com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalPaginas: pages.length,
        message: `${pages.length} páginas extraídas com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Erro no processamento:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});