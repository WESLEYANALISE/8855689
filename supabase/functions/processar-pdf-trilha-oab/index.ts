import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Extrair texto com Mistral OCR usando URL direta do Drive
async function extrairTextoComMistral(pdfUrl: string): Promise<Array<{ index: number; markdown: string }>> {
  const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
  
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY não configurada');
  }

  const urlConvertida = converterUrlDrive(pdfUrl);
  console.log("Enviando URL para Mistral OCR:", urlConvertida);
  
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: urlConvertida
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erro Mistral OCR:", response.status, errorText);
    throw new Error(`Mistral OCR falhou: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`Mistral OCR extraiu ${data.pages?.length || 0} páginas`);
  
  return data.pages || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, pdfUrl } = await req.json();
    
    if (!area || !pdfUrl) {
      throw new Error("Parâmetros 'area' e 'pdfUrl' são obrigatórios");
    }

    console.log(`Processando PDF para área: ${area}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar status para "extraindo"
    await supabase.from('oab_trilhas_areas')
      .update({ status: 'extraindo', pdf_url: pdfUrl })
      .eq('area', area);

    // Extrair com Mistral OCR usando URL direta (sem baixar o PDF)
    console.log("Extraindo texto com Mistral OCR via URL...");
    const paginas = await extrairTextoComMistral(pdfUrl);

    if (paginas.length === 0) {
      throw new Error("Nenhuma página extraída do PDF");
    }

    // Limpar conteúdo anterior
    await supabase.from('oab_trilhas_conteudo')
      .delete()
      .eq('area', area);

    // Salvar cada página em batches para evitar timeout
    console.log(`Salvando ${paginas.length} páginas...`);
    let paginasComConteudo = 0;
    const batchSize = 20;
    
    for (let i = 0; i < paginas.length; i += batchSize) {
      const batch = paginas.slice(i, i + batchSize);
      const inserts = batch
        .filter(p => (p.markdown?.trim() || '').length > 50)
        .map(p => ({
          area,
          pagina: p.index + 1,
          conteudo: p.markdown?.trim() || ''
        }));
      
      if (inserts.length > 0) {
        const { error } = await supabase.from('oab_trilhas_conteudo')
          .upsert(inserts, { onConflict: 'area,pagina' });
        
        if (error) {
          console.error(`Erro ao salvar batch ${i}:`, error);
        } else {
          paginasComConteudo += inserts.length;
        }
      }
    }

    // Atualizar status para "analisando"
    await supabase.from('oab_trilhas_areas')
      .update({ 
        status: 'analisando', 
        total_paginas: paginas.length 
      })
      .eq('area', area);

    console.log(`✅ Extração concluída: ${paginasComConteudo} páginas com conteúdo`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalPaginas: paginas.length,
        paginasComConteudo,
        concluido: true,
        message: `${paginasComConteudo} páginas extraídas com sucesso via Mistral OCR`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro no processamento:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
