import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

// Comprimir imagem e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[TinyPNG] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`);
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/octet-stream',
    },
    body: imageBytes as unknown as BodyInit,
  });

  if (!shrinkResponse.ok) {
    throw new Error(`TinyPNG shrink error: ${shrinkResponse.status}`);
  }

  const shrinkResult = await shrinkResponse.json();
  const outputUrl = shrinkResult.output?.url;
  
  if (!outputUrl) {
    throw new Error('TinyPNG não retornou URL de output');
  }

  const convertResponse = await fetch(outputUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('api:' + apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ convert: { type: 'image/webp' } }),
  });

  if (!convertResponse.ok) {
    const fallbackResponse = await fetch(outputUrl);
    return new Uint8Array(await fallbackResponse.arrayBuffer());
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer());
  const reducao = Math.round((1 - webpBytes.length / imageBytes.length) * 100);
  console.log(`[TinyPNG] WebP: ${imageBytes.length} → ${webpBytes.length} bytes (${reducao}% redução)`);
  
  return webpBytes;
}

// Função para gerar imagem com Gemini - suporta múltiplos modelos
async function gerarImagemComGemini(prompt: string, apiKey: string, modelo: string): Promise<string> {
  console.log(`[gerar-imagem-flashcard] Tentando modelo: ${modelo}`);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[gerar-imagem-flashcard] Modelo ${modelo} falhou: ${response.status} - ${errorText.substring(0, 200)}`);
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText}`);
  }

  const data = await response.json();
  
  // Verificar se há erros na resposta
  if (data.error) {
    console.log(`[gerar-imagem-flashcard] Erro Gemini: ${data.error.message}`);
    throw new Error(`GEMINI_ERROR: ${data.error.message}`);
  }
  
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    console.log('[gerar-imagem-flashcard] Nenhum candidato na resposta');
    throw new Error('Nenhum candidato na resposta');
  }

  // Verificar se o candidato foi bloqueado
  if (candidates[0].finishReason === 'SAFETY' || candidates[0].finishReason === 'BLOCKED') {
    console.log(`[gerar-imagem-flashcard] Conteúdo bloqueado: ${candidates[0].finishReason}`);
    throw new Error(`Conteúdo bloqueado: ${candidates[0].finishReason}`);
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    console.log('[gerar-imagem-flashcard] Candidato sem partes');
    throw new Error('Candidato sem partes');
  }

  // Procurar pela parte que contém a imagem
  for (const part of parts) {
    if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
      console.log('[gerar-imagem-flashcard] Imagem encontrada na resposta');
      return part.inlineData.data;
    }
  }
  
  throw new Error('Imagem não encontrada na resposta');
}

// Função com fallback multi-modelo e multi-chave
async function gerarImagemComFallback(prompt: string, apiKeys: string[]): Promise<string> {
  console.log(`[gerar-imagem-flashcard] ${apiKeys.length} chaves, ${MODELOS_IMAGEM.length} modelos disponíveis`);
  
  let lastError = '';
  
  for (const modelo of MODELOS_IMAGEM) {
    console.log(`[gerar-imagem-flashcard] 🎨 Tentando modelo: ${modelo}`);
    let modeloFalhouPor404 = false;
    
    for (let i = 0; i < apiKeys.length; i++) {
      try {
        console.log(`[gerar-imagem-flashcard] Tentando GEMINI_KEY_${i + 1} com ${modelo}...`);
        const result = await gerarImagemComGemini(prompt, apiKeys[i], modelo);
        console.log(`[gerar-imagem-flashcard] ✅ Sucesso com GEMINI_KEY_${i + 1} no modelo ${modelo}`);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = errorMessage;
        console.log(`[gerar-imagem-flashcard] ❌ GEMINI_KEY_${i + 1} falhou: ${errorMessage.substring(0, 150)}`);
        
        // Se modelo não existe (404), pular para próximo modelo
        if (errorMessage.includes('404')) {
          console.log(`[gerar-imagem-flashcard] Modelo ${modelo} não disponível, tentando próximo...`);
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
      console.log(`[gerar-imagem-flashcard] ⚠️ Todas as chaves falharam no modelo ${modelo}, tentando próximo modelo...`);
    }
  }
  
  throw new Error(`Todas as ${apiKeys.length} chaves falharam em todos os ${MODELOS_IMAGEM.length} modelos. Último erro: ${lastError}`);
}

// Função para gerar prompt visual com Google Gemini
async function gerarPromptVisualComIA(exemplo: string, apiKey: string): Promise<string> {
  const analysisPrompt = `Você é um diretor de arte especializado em criar ilustrações para educação jurídica.

Analise este EXEMPLO PRÁTICO de um flashcard jurídico e crie um PROMPT VISUAL detalhado para gerar uma ilustração.

EXEMPLO PRÁTICO:
"${exemplo.substring(0, 1000)}"

Sua tarefa:
1. Identifique a AÇÃO PRINCIPAL sendo realizada (roubar, assinar, agredir, fugir, etc.)
2. Identifique os PERSONAGENS envolvidos e seus papéis (criminoso, vítima, testemunha, etc.)
3. Identifique o CENÁRIO/LOCAL onde acontece (rua, casa, loja, escritório, etc.)
4. Descreva a CENA VISUAL de forma cinematográfica

REGRAS:
- Foque na AÇÃO REAL, não nas consequências legais
- Descreva personagens brasileiros em contexto brasileiro
- A cena deve ser DINÂMICA, mostrando movimento
- NÃO inclua elementos de tribunal, juízes ou advogados
- A ilustração deve ser IMEDIATA e MEMORÁVEL

Responda APENAS com o prompt visual em inglês, em até 80 palavras, focando na ação dinâmica. Não use JSON.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: analysisPrompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      console.log('[gerar-imagem-flashcard] Falha ao gerar prompt visual');
      return '';
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch (e) {
    console.log('[gerar-imagem-flashcard] Erro ao gerar prompt visual:', e);
  }
  
  return '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flashcard_id, exemplo, tabela } = await req.json();

    if (!flashcard_id || !exemplo) {
      throw new Error('flashcard_id e exemplo são obrigatórios');
    }

    const tabelaDestino = tabela === 'artigos-lei' ? 'FLASHCARDS - ARTIGOS LEI' : 'FLASHCARDS_GERADOS';

    console.log(`[gerar-imagem-flashcard] Gerando imagem para flashcard ${flashcard_id} na tabela ${tabelaDestino}`);

    // Coletar chaves disponíveis
    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
      Deno.env.get('GOOGLE_API_KEY'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');
    
    if (apiKeys.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }

    console.log(`[gerar-imagem-flashcard] ${apiKeys.length} chaves disponíveis`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Passo 1: Usar IA para criar um prompt visual detalhado
    console.log('[gerar-imagem-flashcard] Etapa 1: Gerando prompt visual...');
    let promptVisual = await gerarPromptVisualComIA(exemplo, apiKeys[0]);
    
    if (!promptVisual) {
      promptVisual = `A dynamic scene showing: ${exemplo.substring(0, 200)}`;
    }
    console.log(`[gerar-imagem-flashcard] Prompt visual: ${promptVisual.substring(0, 100)}...`);

    // Passo 2: Gerar imagem em 16:9 (landscape) - SEM TEXTO
    const imagePrompt = `CRITICAL: Generate an image with ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO WRITING OF ANY KIND.

Create a GTA 5 style HORIZONTAL WIDESCREEN illustration in 16:9 aspect ratio showing this scene:

${promptVisual}

VISUAL REQUIREMENTS:
- 16:9 WIDESCREEN LANDSCAPE format
- GTA 5 artistic style: bold stylized digital painting, vibrant saturated colors, dramatic black outlines
- Show the MAIN ACTION in progress - dynamic, not static
- Brazilian setting (architecture, clothing, environment typical of Brazil)
- Cinematic composition with the action as focal point
- Clear character expressions and body language
- Dramatic lighting
- All humans must have exactly 5 fingers per hand

STRICTLY PROHIBITED (VERY IMPORTANT):
- ZERO text, letters, words, numbers, or any typography anywhere in the image
- NO signs, banners, labels, or written content
- All documents, papers, signs, screens must be COMPLETELY BLANK
- No courtrooms, judges, lawyers, or legal proceedings
- Never include any form of writing or characters`;

    console.log('[gerar-imagem-flashcard] Etapa 2: Gerando imagem com fallback multi-modelo...');
    
    const base64Data = await gerarImagemComFallback(imagePrompt, apiKeys);

    // Converter base64 para bytes
    const binaryString = atob(base64Data);
    const originalBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      originalBytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`[gerar-imagem-flashcard] Imagem gerada: ${originalBytes.length} bytes`);

    // Passo 3: Comprimir e converter para WebP
    let finalBytes: Uint8Array = originalBytes;
    if (TINYPNG_API_KEY) {
      try {
        console.log('[gerar-imagem-flashcard] Etapa 3: Comprimindo e convertendo para WebP...');
        finalBytes = await comprimirParaWebP(originalBytes, TINYPNG_API_KEY);
      } catch (compressError) {
        console.log('[gerar-imagem-flashcard] Continuando com imagem não comprimida');
        finalBytes = originalBytes;
      }
    } else {
      console.log('[gerar-imagem-flashcard] TINYPNG_API_KEY não configurada, pulando compressão');
    }

    // Upload para storage como WebP
    const prefixo = tabela === 'artigos-lei' ? 'flashcards-lei' : 'flashcards';
    const fileName = `flashcard_${flashcard_id}_${Date.now()}.webp`;
    const filePath = `${prefixo}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(filePath, finalBytes, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      console.error(`[gerar-imagem-flashcard] Erro upload:`, uploadError);
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('imagens')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    console.log(`[gerar-imagem-flashcard] Upload concluído: ${imageUrl}`);

    // Atualizar flashcard com a URL da imagem
    const { error: updateError } = await supabase
      .from(tabelaDestino)
      .update({ url_imagem_exemplo: imageUrl })
      .eq('id', flashcard_id);

    if (updateError) {
      console.error(`[gerar-imagem-flashcard] Erro ao atualizar:`, updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        url: imageUrl,
        flashcard_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[gerar-imagem-flashcard] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});