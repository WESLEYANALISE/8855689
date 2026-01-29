import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, pdfUrl } = await req.json();

    if (!area || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: "area e pdfUrl são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mistralKey = Deno.env.get("MISTRAL_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📚 Iniciando extração para área: ${area}`);

    // Atualizar status para "extraindo"
    await supabase
      .from("oab_base_conhecimento_areas")
      .update({ status: "extraindo", pdf_url: pdfUrl })
      .eq("area", area);

    // Converter URL do Google Drive para formato de download
    let downloadUrl = pdfUrl;
    const driveMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      const fileId = driveMatch[1];
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    console.log(`📥 Baixando PDF de: ${downloadUrl}`);

    // Baixar o PDF
    const pdfResponse = await fetch(downloadUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Erro ao baixar PDF: ${pdfResponse.status}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    // Converter para base64 em chunks para evitar stack overflow
    const uint8Array = new Uint8Array(pdfBuffer);
    let base64Pdf = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      base64Pdf += String.fromCharCode(...chunk);
    }
    base64Pdf = btoa(base64Pdf);

    console.log(`📄 PDF baixado: ${(pdfBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

    // Extrair texto com Mistral OCR
    console.log(`🔍 Extraindo texto com Mistral OCR...`);

    const mistralResponse = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          document_url: `data:application/pdf;base64,${base64Pdf}`,
        },
        include_image_base64: false,
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error(`❌ Erro Mistral OCR: ${errorText}`);
      throw new Error(`Erro no Mistral OCR: ${mistralResponse.status}`);
    }

    const mistralData = await mistralResponse.json();
    const paginas = mistralData.pages || [];

    console.log(`✅ Extraídas ${paginas.length} páginas`);

    // Limpar dados antigos dessa área
    await supabase
      .from("oab_base_conhecimento")
      .delete()
      .eq("area", area);

    // Inserir cada página
    let totalTokens = 0;
    for (let i = 0; i < paginas.length; i++) {
      const pagina = paginas[i];
      const conteudo = pagina.markdown || "";
      const tokensEstimados = Math.ceil(conteudo.length / 4);
      totalTokens += tokensEstimados;

      await supabase.from("oab_base_conhecimento").insert({
        area,
        pagina: i + 1,
        conteudo,
        tokens_estimados: tokensEstimados,
        pdf_url: pdfUrl,
      });

      // Log de progresso a cada 10 páginas
      if ((i + 1) % 10 === 0) {
        console.log(`📝 Processadas ${i + 1}/${paginas.length} páginas`);
      }
    }

    // Atualizar status da área
    await supabase
      .from("oab_base_conhecimento_areas")
      .update({
        status: "concluido",
        total_paginas: paginas.length,
        total_chunks: paginas.length,
        total_tokens: totalTokens,
      })
      .eq("area", area);

    console.log(`✅ Extração concluída: ${paginas.length} páginas, ${totalTokens} tokens`);

    return new Response(
      JSON.stringify({
        success: true,
        area,
        totalPaginas: paginas.length,
        totalTokens,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro na extração:", errorMessage);

    // Tentar atualizar status para erro
    try {
      const body = await req.clone().json();
      const area = body?.area;
      if (area) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("oab_base_conhecimento_areas")
          .update({ status: "erro" })
          .eq("area", area);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
