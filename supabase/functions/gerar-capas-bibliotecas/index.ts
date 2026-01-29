import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Modelos de imagem disponíveis (ordem de prioridade)
const MODELOS_IMAGEM = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-image-generation'
];

// Configuração das bibliotecas com prompts temáticos para capas 2:3
const BIBLIOTECAS_CONFIG = [
  {
    nome: "Biblioteca de Estudos",
    prompt: "A vertical book cover 2:3 ratio, Brazilian law students studying with books in an elegant dark wood library, scales of justice on desk, warm golden lighting, legal textbooks, academic atmosphere, professional photography, premium quality, cinematic lighting. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO WRITING."
  },
  {
    nome: "Biblioteca Clássicos",
    prompt: "A vertical book cover 2:3 ratio, ancient classical library with leather-bound legal books, marble columns, golden hour light streaming through tall windows, antique desk with quill and inkwell, Renaissance atmosphere, museum quality, dramatic lighting. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO WRITING."
  },
  {
    nome: "Biblioteca da OAB",
    prompt: "A vertical book cover 2:3 ratio, Brazilian Bar Association office, modern legal office with OAB certificate on wall, professional lawyer desk with gavela, Brazilian flag, elegant wood paneling, corporate premium photography, sophisticated lighting. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO WRITING."
  },
  {
    nome: "Biblioteca de Oratória",
    prompt: "A vertical book cover 2:3 ratio, eloquent speaker at Brazilian courtroom podium, dramatic gesture, professional attire, audience in background, theatrical lighting, persuasive atmosphere, cinematic quality, powerful presence. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO WRITING."
  },
  {
    nome: "Biblioteca de Liderança",
    prompt: "A vertical book cover 2:3 ratio, successful law firm leader in executive office, panoramic city view, team meeting in background, modern corporate design, power and success symbols, premium business photography, motivational atmosphere. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO WRITING."
  },
  {
    nome: "Biblioteca Fora da Toga",
    prompt: "A vertical book cover 2:3 ratio, lawyer reading leisurely in cozy home library, casual elegant attire, coffee cup, bookshelves with varied literature, warm ambient lighting, work-life balance theme, relaxed sophisticated atmosphere. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO WRITING."
  }
];

// Função para gerar imagem com Gemini - suporta múltiplos modelos
async function gerarImagemComGemini(prompt: string, apiKey: string, modelo: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["image", "text"],
          responseMimeType: "text/plain"
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[gerar-capas-bibliotecas] Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return part.inlineData.data;
    }
  }
  
  throw new Error('Imagem não gerada pela IA');
}

// Função com fallback multi-modelo e multi-chave
async function gerarImagemComFallback(prompt: string, apiKeys: string[]): Promise<string> {
  console.log(`[gerar-capas-bibliotecas] ${apiKeys.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);
  
  let lastError = '';
  
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-capas-bibliotecas] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        console.log(`[gerar-capas-bibliotecas] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComGemini(prompt, apiKeys[i], modelo);
        console.log(`[gerar-capas-bibliotecas] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = errorMessage;
        console.log(`[gerar-capas-bibliotecas] ❌ GEMINI_KEY_${i + 1} falhou: ${errorMessage.substring(0, 150)}`);
        
        // Se modelo não existe (404), pular para próximo modelo
        if (errorMessage.includes('404')) {
          console.log(`[gerar-capas-bibliotecas] Modelo ${modelo} não disponível, tentando próximo...`);
          modeloFalhouPor404 = true;
          break;
        }
        
        // Se for erro 429 (quota), continuar para próxima chave
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          continue;
        }
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`[gerar-capas-bibliotecas] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }
  
  throw new Error(`Todas as ${apiKeys.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${lastError}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { biblioteca, regenerarTodas } = await req.json();

    // Coletar chaves Gemini disponíveis
    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    const TINIFY_API_KEY = Deno.env.get("TINIFY_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (apiKeys.length === 0) {
      throw new Error("Nenhuma chave GEMINI configurada");
    }

    console.log(`[gerar-capas-bibliotecas] ${apiKeys.length} chaves Gemini disponíveis`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determinar quais bibliotecas processar
    const bibliotecasParaProcessar = regenerarTodas 
      ? BIBLIOTECAS_CONFIG 
      : BIBLIOTECAS_CONFIG.filter(b => b.nome === biblioteca);

    if (bibliotecasParaProcessar.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Biblioteca não encontrada", 
        disponiveis: BIBLIOTECAS_CONFIG.map(b => b.nome) 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resultados = [];

    for (const bib of bibliotecasParaProcessar) {
      console.log(`🎨 Gerando capa para: ${bib.nome}`);

      try {
        // 1. Gerar imagem com Gemini (fallback multi-chave e multi-modelo)
        const imageBase64 = await gerarImagemComFallback(bib.prompt, apiKeys);

        console.log(`✅ Imagem gerada para ${bib.nome}`);

        // 2. Converter base64 para Uint8Array
        const binaryString = atob(imageBase64);
        let imageBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          imageBytes[i] = binaryString.charCodeAt(i);
        }

        console.log(`[gerar-capas-bibliotecas] Imagem original: ${imageBytes.length} bytes`);

        // 3. Comprimir com TinyPNG se disponível
        if (TINIFY_API_KEY) {
          try {
            console.log(`🗜️ Comprimindo imagem com TinyPNG...`);
            
            const tinifyResponse = await fetch("https://api.tinify.com/shrink", {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`api:${TINIFY_API_KEY}`)}`,
                "Content-Type": "application/octet-stream",
              },
              body: imageBytes,
            });

            if (tinifyResponse.ok) {
              const tinifyData = await tinifyResponse.json();
              
              // Converter para WebP
              const convertResponse = await fetch(tinifyData.output.url, {
                method: "POST",
                headers: {
                  Authorization: `Basic ${btoa(`api:${TINIFY_API_KEY}`)}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  convert: { type: ["image/webp"] },
                  resize: { method: "cover", width: 400, height: 600 }
                }),
              });

              if (convertResponse.ok) {
                const webpBuffer = await convertResponse.arrayBuffer();
                imageBytes = new Uint8Array(webpBuffer);
                console.log(`✅ Comprimido e convertido para WebP: ${Math.round(imageBytes.length / 1024)}KB`);
              }
            }
          } catch (compressError) {
            console.warn("Erro ao comprimir, usando imagem original:", compressError);
          }
        }

        // 4. Upload para Supabase Storage
        const fileName = `capa-${bib.nome.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}-${Date.now()}.webp`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("imagens")
          .upload(`capas-bibliotecas/${fileName}`, imageBytes, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) {
          console.error("Erro ao fazer upload:", uploadError);
          resultados.push({ biblioteca: bib.nome, sucesso: false, erro: uploadError.message });
          continue;
        }

        // 5. Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from("imagens")
          .getPublicUrl(`capas-bibliotecas/${fileName}`);

        console.log(`📤 Upload concluído: ${publicUrl}`);

        // 6. Atualizar tabela CAPA-BIBILIOTECA
        const { error: updateError } = await supabase
          .from("CAPA-BIBILIOTECA")
          .update({ capa: publicUrl })
          .eq("Biblioteca", bib.nome);

        if (updateError) {
          // Tentar inserir se não existir
          const { error: insertError } = await supabase
            .from("CAPA-BIBILIOTECA")
            .insert({ Biblioteca: bib.nome, capa: publicUrl });
          
          if (insertError) {
            console.error("Erro ao atualizar/inserir:", insertError);
          }
        }

        resultados.push({ 
          biblioteca: bib.nome, 
          sucesso: true, 
          url: publicUrl,
          tamanhoKB: Math.round(imageBytes.length / 1024)
        });

      } catch (bibError) {
        console.error(`Erro processando ${bib.nome}:`, bibError);
        resultados.push({ 
          biblioteca: bib.nome, 
          sucesso: false, 
          erro: bibError instanceof Error ? bibError.message : "Erro desconhecido" 
        });
      }
    }

    return new Response(JSON.stringify({ 
      sucesso: true,
      resultados,
      processadas: resultados.filter(r => r.sucesso).length,
      total: bibliotecasParaProcessar.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
