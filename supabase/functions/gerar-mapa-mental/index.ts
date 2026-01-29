import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Modelos de imagem disponíveis (ordem de prioridade)
const MODELOS_IMAGEM = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-image-generation'
];

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[compressao] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`)
  
  const blob = new Blob([new Uint8Array(imageBytes)], { type: 'image/png' })
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(`api:${apiKey}`)}` },
    body: blob
  })

  if (!shrinkResponse.ok) {
    throw new Error(`TinyPNG erro: ${shrinkResponse.status}`)
  }

  const result = await shrinkResponse.json()
  if (!result.output?.url) {
    throw new Error('TinyPNG não retornou URL')
  }

  const convertResponse = await fetch(result.output.url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ convert: { type: 'image/webp' } })
  })

  if (!convertResponse.ok) {
    const fallbackResponse = await fetch(result.output.url)
    return new Uint8Array(await fallbackResponse.arrayBuffer())
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer())
  console.log(`[compressao] WebP: ${imageBytes.length} -> ${webpBytes.length} bytes (${Math.round((1 - webpBytes.length / imageBytes.length) * 100)}% menor)`)
  return webpBytes
}

// Função para upload no Supabase Storage
async function uploadParaSupabase(
  supabase: any,
  bytes: Uint8Array,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true
    })

  if (uploadError) {
    console.error('[upload] Erro:', uploadError)
    throw new Error(`Erro no upload: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  console.log(`[upload] URL pública: ${publicUrl}`)
  return publicUrl
}

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
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[gerar-mapa-mental] Erro na API Gemini (${modelo}): ${response.status}`, errorText.substring(0, 200));
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inlineData?.data);
  
  if (!imagePart?.inlineData?.data) {
    throw new Error('Imagem não gerada pela IA');
  }
  
  return imagePart.inlineData.data;
}

// Função com fallback multi-modelo e multi-chave
async function gerarImagemComFallback(prompt: string, chaves: string[]): Promise<string> {
  const chavesValidas = chaves.filter(Boolean);
  
  if (chavesValidas.length === 0) {
    throw new Error('Nenhuma chave de API de imagem configurada');
  }

  console.log(`[gerar-mapa-mental] ${chavesValidas.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);

  let ultimoErro = '';

  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-mapa-mental] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;

    for (let i = 0; i < chavesValidas.length; i++) {
      try {
        console.log(`[gerar-mapa-mental] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComGemini(prompt, chavesValidas[i], modelo);
        console.log(`[gerar-mapa-mental] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        ultimoErro = errorMessage;
        console.log(`[gerar-mapa-mental] ❌ GEMINI_KEY_${i + 1} falhou: ${errorMessage.substring(0, 150)}`);
        
        // Se modelo não existe (404), pular para próximo modelo
        if (errorMessage.includes('404')) {
          console.log(`[gerar-mapa-mental] Modelo ${modelo} não disponível, tentando próximo...`);
          modeloFalhouPor404 = true;
          break;
        }
        
        // Se for erro 429 e ainda há chaves, continuar
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          continue;
        }
      }
    }
    
    if (!modeloFalhouPor404) {
      console.log(`[gerar-mapa-mental] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }

  throw new Error(`Todas as ${chavesValidas.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${ultimoErro}`);
}

// Etapa 1: Analisar artigo com Gemini TEXT para extrair estrutura
async function analisarArtigoParaMapaMental(
  artigo: string,
  numeroArtigo: string,
  codigoNome: string,
  apiKey: string
): Promise<string> {
  const promptAnalise = `Você é um especialista em educação jurídica e design de infográficos. Analise este artigo de lei brasileira e crie uma descrição visual detalhada para um infográfico estilo mapa mental.

ARTIGO: Art. ${numeroArtigo} - ${codigoNome || 'Lei Brasileira'}
CONTEÚDO: "${artigo}"

ANALISE E EXTRAIA:
1. CONCEITO CENTRAL: Qual é o princípio jurídico principal? (máximo 5 palavras)
2. ELEMENTOS-CHAVE: Liste 4-6 conceitos essenciais que derivam da ideia principal
3. Para cada elemento:
   - Título (2-4 palavras em PORTUGUÊS)
   - Breve explicação (máximo 10 palavras em PORTUGUÊS)
   - Ícone sugerido (descreva um ícone simples e reconhecível)
   - Conexão com o conceito principal
4. ESQUEMA DE CORES: Sugira um esquema de cores profissional baseado na área jurídica

FORMATO DE SAÍDA:
Crie um prompt descritivo e detalhado em INGLÊS para gerar um infográfico vertical premium com:
- Layout hierárquico claro do topo para baixo
- Blocos organizados com cantos arredondados
- Ícones flat design para cada conceito
- Conexões visuais entre elementos relacionados
- Toda a estrutura visual descrita em detalhes

Retorne APENAS o prompt de geração de imagem em inglês, sem explicações adicionais.`;

  console.log('[gerar-mapa-mental] Etapa 1: Analisando artigo com Gemini TEXT...');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptAnalise }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[gerar-mapa-mental] Erro na análise:', response.status, errorText);
    throw new Error(`Erro na análise do artigo: ${response.status}`);
  }

  const data = await response.json();
  const promptGerado = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  console.log('[gerar-mapa-mental] Prompt estruturado gerado:', promptGerado.substring(0, 200) + '...');
  
  return promptGerado;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigo, numeroArtigo, codigoNome } = await req.json();

    if (!artigo || !numeroArtigo) {
      return new Response(
        JSON.stringify({ error: 'Artigo e número do artigo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Coletar chaves disponíveis
    const chavesImagem = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');
    
    if (chavesImagem.length === 0) {
      throw new Error('Nenhuma chave de API de imagem configurada');
    }

    console.log(`[gerar-mapa-mental] ${chavesImagem.length} chaves de imagem disponíveis`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`[gerar-mapa-mental] Iniciando geração para Art. ${numeroArtigo} - ${codigoNome}`);

    // Etapa 1: Analisar artigo e gerar prompt estruturado
    const promptEstruturado = await analisarArtigoParaMapaMental(
      artigo,
      numeroArtigo,
      codigoNome,
      chavesImagem[0]
    );

    // Etapa 2: Prompt final com estilo NotebookLM
    const promptFinal = `${promptEstruturado}

CRITICAL DESIGN STYLE - NOTEBOOKLM PREMIUM INFOGRAPHIC:

LAYOUT:
- PORTRAIT orientation (9:16 aspect ratio, vertical)
- Large title block at the TOP with "Art. ${numeroArtigo}" prominently displayed
- Clean visual hierarchy flowing from TOP to BOTTOM
- Each concept in its own rounded rectangle "card" with subtle shadow
- Connecting lines with smooth curves between related concepts
- Generous white space between elements

COLOR SCHEME:
- Primary: Deep professional blue (#1a365d, #2b6cb0)
- Accent: Warm orange/gold (#ed8936, #d69e2e) for highlights
- Background: Clean white (#ffffff) or very light gray (#f7fafc)
- Text: Dark gray (#1a202c) for readability
- Subtle gradients on cards and connectors

TYPOGRAPHY:
- Bold, modern sans-serif headers
- Clean readable body text
- Good contrast ratios

ICONS:
- Flat design style icons (simple, geometric, recognizable)
- One icon per concept card
- Icons should be relevant to the legal concept

VISUAL ELEMENTS:
- Rounded rectangles with subtle shadows
- Smooth connecting lines with gradient colors
- Professional, corporate look
- NO hand-drawn or sketchy elements
- NO 3D effects - clean flat design
- HIGH RESOLUTION, crisp vector-style graphics

MANDATORY TEXT REQUIREMENTS:
- ALL text in the image MUST be in BRAZILIAN PORTUGUESE
- Title: "Art. ${numeroArtigo}"
- Subtitle: "${codigoNome || 'Lei Brasileira'}"
- Use Portuguese legal terms: "CONCEITO CENTRAL", "ELEMENTOS-CHAVE", "REQUISITOS", "CONSEQUÊNCIAS", "EXCEÇÕES", "APLICAÇÃO"

This should look like a premium educational infographic from Google NotebookLM or a top-tier design agency - clean, modern, professional, and highly readable.`;

    console.log('[gerar-mapa-mental] Etapa 2: Gerando imagem com fallback multi-modelo...');

    const base64Data = await gerarImagemComFallback(promptFinal, chavesImagem);

    // Converter base64 para blob
    const binaryString = atob(base64Data);
    let uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    console.log(`[gerar-mapa-mental] Imagem gerada com sucesso, tamanho: ${uint8Array.length} bytes`);

    // Etapa 3: Comprimir e converter para WebP
    if (TINYPNG_API_KEY) {
      try {
        const compressed = await comprimirParaWebP(uint8Array, TINYPNG_API_KEY)
        uint8Array = new Uint8Array(compressed)
      } catch (compressError) {
        console.error('[gerar-mapa-mental] Erro na compressão (continuando sem):', compressError)
      }
    }

    // Etapa 4: Upload para Supabase Storage como WebP
    const filePath = `mapas-mentais/art_${numeroArtigo}_${Date.now()}.webp`
    const imageUrl = await uploadParaSupabase(supabase, uint8Array, 'imagens', filePath, 'image/webp')

    console.log('[gerar-mapa-mental] Upload concluído:', imageUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: imageUrl,
        message: 'Mapa mental gerado com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-mapa-mental] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});