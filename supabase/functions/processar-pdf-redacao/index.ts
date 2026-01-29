import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Converte bytes para base64 de forma segura
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

// Converte URL do Google Drive para URL de download direto
function converterUrlDrive(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

// Baixa PDF do Google Drive
async function baixarPdfDrive(url: string): Promise<Uint8Array> {
  const downloadUrl = converterUrlDrive(url);
  console.log("Baixando PDF de:", downloadUrl);
  
  let response = await fetch(downloadUrl, { redirect: 'follow' });
  
  if (!response.ok) {
    throw new Error(`Falha ao baixar PDF: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('text/html')) {
    const html = await response.text();
    const confirmMatch = html.match(/href="(\/uc\?export=download[^"]+)"/);
    if (confirmMatch) {
      const confirmUrl = `https://drive.google.com${confirmMatch[1].replace(/&amp;/g, '&')}`;
      response = await fetch(confirmUrl, { redirect: 'follow' });
    } else {
      throw new Error("Link de download não encontrado");
    }
  }
  
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  
  const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 5));
  if (!pdfHeader.startsWith('%PDF')) {
    throw new Error("Arquivo não é um PDF válido");
  }
  
  console.log(`PDF baixado: ${uint8Array.length} bytes`);
  return uint8Array;
}

// Extrai texto do PDF usando Mistral OCR
async function extrairTextoMistral(pdfBytes: Uint8Array): Promise<string> {
  const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
  if (!MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY não configurada");
  }
  
  const pdfBase64 = bytesToBase64(pdfBytes);
  console.log(`PDF convertido para base64: ${pdfBase64.length} caracteres`);
  console.log("Chamando Mistral OCR...");
  
  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: `data:application/pdf;base64,${pdfBase64}`
      }
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erro Mistral OCR:", response.status, errorText);
    throw new Error(`Erro Mistral OCR: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log("Mistral OCR respondeu com sucesso");
  
  // Extrair texto de todas as páginas
  let textoCompleto = "";
  if (result.pages && Array.isArray(result.pages)) {
    for (const page of result.pages) {
      if (page.markdown) {
        textoCompleto += `\n\n--- PÁGINA ${page.index + 1} ---\n\n${page.markdown}`;
      }
    }
  }
  
  console.log(`Texto extraído: ${textoCompleto.length} caracteres de ${result.pages?.length || 0} páginas`);
  return textoCompleto;
}

// Chama Gemini com fallback entre múltiplas chaves
async function chamarGemini(prompt: string): Promise<string> {
  const keys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
    Deno.env.get("GEMINI_KEY_3"),
  ].filter(Boolean);
  
  if (keys.length === 0) {
    throw new Error("Nenhuma chave Gemini configurada");
  }
  
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  
  for (const key of keys) {
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192,
              },
            }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            console.log(`Gemini ${model} respondeu com sucesso`);
            return text;
          }
        }
      } catch (e) {
        console.log(`Falha com ${model}: ${e}`);
      }
    }
  }
  
  throw new Error("Todas as chaves/modelos Gemini falharam");
}

// Estrutura o texto extraído em categorias usando Gemini
async function estruturarConteudo(textoExtraido: string): Promise<any[]> {
  const prompt = `Analise o seguinte texto extraído de um material didático sobre REDAÇÃO para concursos/ENEM e estruture-o em um JSON.

O JSON deve ser um array de objetos com a seguinte estrutura:
{
  "categoria": "Nome da categoria principal (ex: Fundamentos, Estrutura, Argumentação, etc)",
  "subcategoria": "Subcategoria se houver, ou null",
  "titulo": "Título específico do tópico",
  "conteudo": "Conteúdo completo em markdown, bem formatado e detalhado",
  "exemplos": ["Exemplo 1", "Exemplo 2"],
  "dicas": ["Dica 1", "Dica 2"],
  "ordem": número sequencial começando em 1
}

IMPORTANTE:
- Extraia TODO o conteúdo relevante do texto
- Organize em categorias lógicas como: Fundamentos, Estrutura do Texto, Coesão e Coerência, Argumentação, Competências ENEM, Repertório, Temas, Erros Comuns, etc
- Mantenha o conteúdo original mas formate bem em markdown
- Se encontrar exemplos de redação, inclua-os
- Crie entre 20-50 itens dependendo da quantidade de conteúdo
- Retorne APENAS o JSON, sem explicações antes ou depois

TEXTO EXTRAÍDO:
${textoExtraido.substring(0, 100000)}`;

  const resposta = await chamarGemini(prompt);
  
  // Extrair JSON da resposta
  let jsonStr = resposta;
  const jsonMatch = resposta.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  
  try {
    const conteudos = JSON.parse(jsonStr);
    console.log(`Estruturados ${conteudos.length} itens de conteúdo`);
    return conteudos;
  } catch (e) {
    console.error("Erro ao parsear JSON do Gemini:", e);
    throw new Error("Falha ao estruturar conteúdo - resposta inválida do Gemini");
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl } = await req.json();
    
    if (!pdfUrl) {
      throw new Error("pdfUrl é obrigatório");
    }
    
    console.log("Iniciando processamento do PDF de redação:", pdfUrl);
    
    // 1. Baixar PDF
    const pdfBytes = await baixarPdfDrive(pdfUrl);
    
    // 2. Extrair texto com Mistral OCR
    const textoExtraido = await extrairTextoMistral(pdfBytes);
    
    if (!textoExtraido || textoExtraido.length < 100) {
      throw new Error("Texto extraído muito curto ou vazio");
    }
    
    // 3. Estruturar conteúdo com Gemini
    const conteudos = await estruturarConteudo(textoExtraido);
    
    // 4. Salvar no banco
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Limpar dados antigos
    await supabase.from("redacao_conteudo").delete().neq("id", 0);
    console.log("Dados antigos removidos");
    
    // Inserir novos conteúdos
    const registros = conteudos.map((c: any, index: number) => ({
      categoria: c.categoria || "Geral",
      subcategoria: c.subcategoria || null,
      titulo: c.titulo || `Tópico ${index + 1}`,
      conteudo: c.conteudo || "",
      exemplos: c.exemplos || [],
      dicas: c.dicas || [],
      ordem: c.ordem || index + 1,
    }));
    
    const { data, error } = await supabase
      .from("redacao_conteudo")
      .insert(registros)
      .select();
    
    if (error) {
      console.error("Erro ao inserir:", error);
      throw new Error(`Erro ao salvar: ${error.message}`);
    }
    
    console.log(`${data.length} registros salvos com sucesso!`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído! ${data.length} tópicos extraídos e salvos.`,
        totalRegistros: data.length,
        categorias: [...new Set(registros.map((r: any) => r.categoria))],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no processamento:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
