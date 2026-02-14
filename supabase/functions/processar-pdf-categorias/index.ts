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
    const { materiaId, pdfUrl } = await req.json();

    if (!materiaId || !pdfUrl) {
      throw new Error("materiaId e pdfUrl são obrigatórios");
    }

    console.log(`[Categorias] Processando PDF para matéria ${materiaId}: ${pdfUrl}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from('categorias_materias')
      .update({ status_processamento: 'extraindo', pdf_url: pdfUrl })
      .eq('id', materiaId);

    if (pdfUrl.includes('/folders/') || pdfUrl.includes('/drive/folders')) {
      throw new Error("A URL fornecida é de uma pasta do Google Drive. Forneça a URL direta do arquivo PDF.");
    }

    let downloadUrl = pdfUrl;
    if (pdfUrl.includes('drive.google.com')) {
      let fileId = null;
      const filePattern = pdfUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (filePattern) fileId = filePattern[1];
      if (!fileId) {
        const dPattern = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (dPattern) fileId = dPattern[1];
      }
      if (!fileId) {
        const queryPattern = pdfUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (queryPattern) fileId = queryPattern[1];
      }
      if (fileId) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log(`ID do arquivo extraído: ${fileId}`);
      } else {
        throw new Error("Não foi possível extrair o ID do arquivo da URL do Google Drive.");
      }
    }

    const pdfResponse = await fetch(downloadUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!pdfResponse.ok) {
      throw new Error(`Erro ao baixar PDF: ${pdfResponse.status}`);
    }

    const contentType = pdfResponse.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error("O Google Drive retornou HTML. Verifique se o arquivo está compartilhado publicamente.");
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const uint8Array = new Uint8Array(pdfBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Pdf = btoa(binary);

    console.log(`PDF baixado: ${Math.round(pdfBuffer.byteLength / 1024)} KB`);

    const mistralKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralKey) throw new Error("MISTRAL_API_KEY não configurada");

    console.log("Iniciando extração com Mistral OCR...");

    const mistralResponse = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: { type: 'document_url', document_url: `data:application/pdf;base64,${base64Pdf}` }
      })
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error("Erro Mistral:", errorText);
      throw new Error(`Erro no Mistral OCR: ${mistralResponse.status}`);
    }

    const mistralData = await mistralResponse.json();
    const pages = mistralData.pages || [];
    console.log(`Total de páginas extraídas: ${pages.length}`);

    if (pages.length === 0) throw new Error("Nenhuma página foi extraída do PDF");

    // Deletar páginas antigas
    await supabase.from('categorias_materia_paginas').delete().eq('materia_id', materiaId);

    // Inserir novas páginas em lotes
    const batchSize = 50;
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize).map((page: any, idx: number) => ({
        materia_id: materiaId,
        pagina: i + idx + 1,
        conteudo: page.markdown || page.text || ''
      }));

      const { error: insertError } = await supabase
        .from('categorias_materia_paginas')
        .upsert(batch, { onConflict: 'materia_id,pagina' });

      if (insertError) throw insertError;
      console.log(`Inseridas páginas ${i + 1} a ${Math.min(i + batchSize, pages.length)}`);
    }

    await supabase
      .from('categorias_materias')
      .update({ status_processamento: 'identificando', total_paginas: pages.length })
      .eq('id', materiaId);

    console.log(`✅ Extração concluída: ${pages.length} páginas`);

    return new Response(
      JSON.stringify({ success: true, totalPaginas: pages.length, message: `${pages.length} páginas extraídas com sucesso` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro no processamento:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
