import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para gerar imagem com Gemini via API REST (mesmas chaves da professora)
async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  const API_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
    Deno.env.get('DIREITO_PREMIUM_API_KEY')
  ].filter(Boolean);
  
  console.log(`Tentando ${API_KEYS.length} chaves Gemini disponíveis`);
  
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"]
            }
          })
        }
      );
      
      if (!response.ok) {
        console.log(`Chave ${i + 1} falhou: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      for (const part of data.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          console.log(`Sucesso com chave ${i + 1}`);
          return part.inlineData.data;
        }
      }
    } catch (err) {
      console.log(`Chave ${i + 1} erro:`, err);
      continue;
    }
  }
  
  return null;
}

// Função para gerar imagem com Hugging Face (fallback)
async function gerarImagemComHuggingFace(prompt: string): Promise<string | null> {
  const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
  
  if (!HF_TOKEN) {
    console.log('Token Hugging Face não configurado');
    return null;
  }
  
  try {
    console.log('Tentando Hugging Face FLUX...');
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    
    if (hfResponse.ok) {
      const arrayBuffer = await hfResponse.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log('Sucesso com Hugging Face FLUX');
      return base64;
    } else {
      console.log(`Hugging Face falhou: ${hfResponse.status}`);
      return null;
    }
  } catch (err) {
    console.error('Erro Hugging Face:', err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating background image...");
    console.log("Prompt:", prompt.substring(0, 100) + "...");

    // Tentar Gemini primeiro
    let base64Image = await gerarImagemComGemini(prompt);
    
    // Fallback para Hugging Face
    if (!base64Image) {
      console.log('Gemini falhou, tentando Hugging Face...');
      base64Image = await gerarImagemComHuggingFace(prompt);
    }
    
    if (!base64Image) {
      throw new Error("Nenhuma imagem gerada. Todas as APIs falharam.");
    }

    // Retornar imagem como data URL
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return new Response(JSON.stringify({ 
      success: true,
      imageUrl: imageUrl
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});