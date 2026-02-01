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
    const { topicoId, pdfUrl } = await req.json();

    if (!topicoId || !pdfUrl) {
      throw new Error("topicoId e pdfUrl são obrigatórios");
    }

    console.log(`[OAB Tópico] Processando PDF para tópico ${topicoId}: ${pdfUrl}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar status para 'extraindo'
    await supabase
      .from('oab_trilhas_topicos')
      .update({ 
        status: 'extraindo',
        pdf_url: pdfUrl 
      })
      .eq('id', topicoId);

    // Validar que é uma URL de arquivo, não de pasta
    if (pdfUrl.includes('/folders/') || pdfUrl.includes('/drive/folders')) {
      throw new Error("A URL fornecida é de uma pasta do Google Drive. Por favor, forneça a URL direta do arquivo PDF.");
    }

    // Converter URL do Google Drive para formato de download direto
    function converterUrlDrive(url: string): string {
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const fileId = match[1];
          return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }
      
      return url;
    }

    const urlConvertida = converterUrlDrive(pdfUrl);
    console.log("URL convertida para Mistral OCR:", urlConvertida);

    // Obter chave Mistral
    const mistralKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralKey) {
      throw new Error("MISTRAL_API_KEY não configurada");
    }

    // Usar Mistral OCR para extrair texto
    console.log("Iniciando extração com Mistral OCR...");

    const mistralResponse = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: {
          type: 'document_url',
          document_url: urlConvertida
        }
      })
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error("Erro Mistral:", errorText);
      throw new Error(`Erro no Mistral OCR: ${mistralResponse.status}`);
    }

    const mistralData = await mistralResponse.json();
    console.log("Resposta Mistral recebida");

    const pages = mistralData.pages || [];
    console.log(`Total de páginas extraídas: ${pages.length}`);

    if (pages.length === 0) {
      throw new Error("Nenhuma página foi extraída do PDF");
    }

    // Deletar páginas antigas (se existir tabela)
    await supabase
      .from('oab_trilhas_topico_paginas')
      .delete()
      .eq('topico_id', topicoId);

    // Inserir novas páginas em lotes
    const batchSize = 50;
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize).map((page: any, idx: number) => ({
        topico_id: topicoId,
        pagina: i + idx + 1,
        conteudo: page.markdown || page.text || ''
      }));

      const { error: insertError } = await supabase
        .from('oab_trilhas_topico_paginas')
        .upsert(batch, { onConflict: 'topico_id,pagina' });

      if (insertError) {
        console.error("Erro ao inserir páginas:", insertError);
        throw insertError;
      }

      console.log(`Inseridas páginas ${i + 1} a ${Math.min(i + batchSize, pages.length)}`);
    }

    // Atualizar tópico com total de páginas e status
    await supabase
      .from('oab_trilhas_topicos')
      .update({ 
        status: 'identificando',
        total_paginas: pages.length
      })
      .eq('id', topicoId);

    console.log(`✅ Extração concluída: ${pages.length} páginas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalPaginas: pages.length,
        message: `${pages.length} páginas extraídas com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro no processamento:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
