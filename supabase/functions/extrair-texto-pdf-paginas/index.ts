import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEY = Deno.env.get("GEMINI_KEY_1") || Deno.env.get("GEMINI_KEY_2") || Deno.env.get("GEMINI_KEY_3");

// OCR com Gemini Vision - extrai texto de uma página
async function extrairTextoPagina(base64Pdf: string, pagina: number): Promise<string> {
  const prompt = `Extraia TODO o texto da página ${pagina} deste PDF. Transcreva EXATAMENTE como aparece. Se vazia: [VAZIA]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "application/pdf", data: base64Pdf } }
            ] 
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 8000 }
        })
      }
    );

    if (!response.ok) return "";
    const data = await response.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return texto === "[VAZIA]" || texto.length < 10 ? "" : texto;
  } catch {
    return "";
  }
}

// Obter total de páginas
async function obterTotalPaginas(base64Pdf: string): Promise<number> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [
              { text: "Quantas páginas tem este PDF? Responda APENAS o número." },
              { inline_data: { mime_type: "application/pdf", data: base64Pdf } }
            ] 
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 10 }
        })
      }
    );

    if (!response.ok) return 50;
    const data = await response.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "50";
    return Math.min(parseInt(texto.match(/\d+/)?.[0] || "50"), 500);
  } catch {
    return 50;
  }
}

// Processar lote de páginas em paralelo
async function processarLote(
  base64Pdf: string, 
  paginas: number[], 
  supabase: any, 
  tituloLivro: string
): Promise<number> {
  const resultados = await Promise.allSettled(
    paginas.map(async (pagina) => {
      const texto = await extrairTextoPagina(base64Pdf, pagina);
      if (!texto || texto.length < 20) return null;
      
      const { error } = await supabase
        .from("BIBLIOTECA-LEITURA-DINAMICA")
        .upsert({
          "Titulo da Obra": tituloLivro,
          "Pagina": pagina,
          "Conteúdo": texto,
          "Titulo do Capitulo": null
        }, { onConflict: "Titulo da Obra,Pagina" });
      
      return error ? null : pagina;
    })
  );

  return resultados.filter(r => r.status === "fulfilled" && r.value !== null).length;
}

// Processamento em background com paralelismo
async function processarEmBackground(pdfUrl: string, tituloLivro: string) {
  console.log(`[BG] Iniciando: "${tituloLivro}"`);
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Download PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error(`[BG] Erro download: ${pdfResponse.status}`);
      return;
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(
      new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    
    console.log(`[BG] PDF: ${Math.round(pdfBuffer.byteLength / 1024)}KB`);

    const totalPaginas = await obterTotalPaginas(base64Pdf);
    console.log(`[BG] Total: ${totalPaginas} páginas`);

    let paginasSalvas = 0;
    const LOTE_SIZE = 5; // Processar 5 páginas simultaneamente

    // Processar em lotes paralelos
    for (let i = 1; i <= totalPaginas; i += LOTE_SIZE) {
      const lote = Array.from(
        { length: Math.min(LOTE_SIZE, totalPaginas - i + 1) }, 
        (_, idx) => i + idx
      );
      
      console.log(`[BG] Lote ${Math.ceil(i / LOTE_SIZE)}: páginas ${lote[0]}-${lote[lote.length - 1]}`);
      
      const salvas = await processarLote(base64Pdf, lote, supabase, tituloLivro);
      paginasSalvas += salvas;
      
      console.log(`[BG] ✓ ${salvas} páginas salvas (total: ${paginasSalvas})`);
      
      // Pequeno delay entre lotes para evitar rate limit
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`[BG] CONCLUÍDO: ${paginasSalvas}/${totalPaginas} páginas`);
  } catch (e) {
    console.error(`[BG] Erro:`, e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl, tituloLivro } = await req.json();
    
    if (!pdfUrl || !tituloLivro) {
      throw new Error("pdfUrl e tituloLivro são obrigatórios");
    }

    console.log(`[API] Recebido: "${tituloLivro}"`);
    
    // Processar em background
    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processarEmBackground(pdfUrl, tituloLivro));
    } else {
      processarEmBackground(pdfUrl, tituloLivro);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        mensagem: "Processamento iniciado em background (5 páginas simultâneas)",
        tituloLivro,
        background: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[API] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
