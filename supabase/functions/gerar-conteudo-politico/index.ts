import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com múltiplas chaves Gemini
const getGeminiKeys = (): string[] => {
  return [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
    Deno.env.get('DIREITO_PREMIUM_API_KEY'),
  ].filter((key): key is string => !!key);
};

// Modelos para fallback
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

async function buscarWikipedia(termo: string): Promise<string | null> {
  try {
    console.log('Buscando Wikipedia para:', termo);
    const searchUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.log('Wikipedia não encontrou:', termo);
      return null;
    }
    
    const data = await response.json();
    
    // Buscar conteúdo completo
    const contentUrl = `https://pt.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(termo)}`;
    const contentResponse = await fetch(contentUrl);
    
    if (!contentResponse.ok) return data.extract || null;
    
    const html = await contentResponse.text();
    
    // Extrair texto básico do HTML
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000);
    
    console.log('Wikipedia conteúdo extraído:', textContent.length, 'caracteres');
    return textContent || data.extract;
  } catch (error) {
    console.error('Erro ao buscar Wikipedia:', error);
    return null;
  }
}

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const keys = getGeminiKeys();
  
  if (keys.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }

  console.log(`Tentando com ${keys.length} chaves disponíveis...`);

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const apiKey = keys[keyIndex];
    
    for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
      const model = GEMINI_MODELS[modelIndex];
      
      try {
        console.log(`Tentativa: Chave ${keyIndex + 1}, Modelo ${model}`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro ${response.status} com chave ${keyIndex + 1}, modelo ${model}:`, errorText);
          
          if (response.status === 429 || response.status === 503) {
            console.log('Rate limit ou indisponível, tentando próxima chave...');
            break;
          }
          
          if (response.status === 400) {
            console.log('Chave inválida ou expirada, tentando próxima...');
            break;
          }
          
          continue;
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (content) {
          console.log(`Sucesso com chave ${keyIndex + 1}, modelo ${model}!`);
          return content;
        }
        
        console.log('Resposta sem conteúdo, tentando próximo modelo...');
      } catch (error) {
        console.error(`Erro de rede com chave ${keyIndex + 1}, modelo ${model}:`, error);
        continue;
      }
    }
  }

  throw new Error('Todas as chaves e modelos falharam. Tente novamente mais tarde.');
}

async function gerarImagemCapa(titulo: string, orientacao: string): Promise<string | null> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.log('LOVABLE_API_KEY não configurada, pulando geração de imagem');
      return null;
    }

    // Temas realistas baseados na orientação política
    const temaVisual = orientacao === 'esquerda' 
      ? 'workers union gathering, social movements, protest signs with democratic slogans, solidarity'
      : orientacao === 'centro' 
      ? 'parliament building interior, legislative session, democratic debate, diplomacy meeting'
      : 'free market city skyline, business district, individual liberty, traditional architecture';

    const corTom = orientacao === 'esquerda' ? 'warm red and orange'
      : orientacao === 'centro' ? 'neutral gold and beige'
      : 'deep blue and silver';

    const prompt = `Photorealistic image for political education article: "${titulo}".
Scene: ${temaVisual}. 
Style: Professional photography, editorial quality, cinematic lighting, ${corTom} color grading.
NO text, NO faces shown directly, NO specific country flags, NO party symbols.
Focus on symbolic elements of democracy: podiums, voting booths, parliamentary halls, civic buildings, books of law.
16:9 aspect ratio. Ultra high resolution, sharp details.`;

    console.log('Gerando imagem de capa com Gemini...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      console.error('Erro ao gerar imagem:', response.status);
      return null;
    }

    const data = await response.json();
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageBase64) {
      console.log('Nenhuma imagem gerada');
      return null;
    }

    // Upload para Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extrair base64 puro
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `politica-artigo-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('politica-capas')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro ao fazer upload da imagem:', uploadError);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('politica-capas')
      .getPublicUrl(fileName);

    console.log('Imagem gerada e salva:', publicUrl.publicUrl);
    return publicUrl.publicUrl;

  } catch (error) {
    console.error('Erro ao gerar imagem de capa:', error);
    return null;
  }
}

async function gerarConteudoGemini(
  titulo: string, 
  wikipediaContent: string | null,
  categoria: string
): Promise<string> {
  const prompt = `Você é um educador político brasileiro especializado em criar conteúdo acessível e informativo.

${wikipediaContent ? `Use as seguintes informações como base para criar um artigo educativo original e completo:\n\n${wikipediaContent.slice(0, 10000)}` : `Crie um artigo educativo sobre: ${titulo}`}

CATEGORIA: ${categoria}
TÍTULO: ${titulo}

REGRAS IMPORTANTES:
1. Escreva em português brasileiro claro e acessível
2. Use linguagem que qualquer cidadão possa entender
3. Estruture com subtítulos (##) para organizar o conteúdo
4. Inclua exemplos práticos quando aplicável
5. Explique termos técnicos entre parênteses
6. Mantenha tom neutro e educativo, sem viés político
7. Tamanho: entre 1200 e 2000 palavras (artigo detalhado)
8. Comece diretamente com o conteúdo, sem repetir o título
9. NÃO mencione Wikipedia ou fontes externas
10. Escreva como se fosse conteúdo 100% original

FORMATAÇÃO OBRIGATÓRIA:
- Separe cada parágrafo com uma linha em branco
- Use subtítulos (##) a cada 2-3 parágrafos
- Cada parágrafo deve ter 3-5 frases
- Use listas quando fizer sentido
- Quebre o texto em seções claras: Introdução, Contexto Histórico, Como Funciona, Exemplos Práticos, Conclusão

Formato Markdown.`;

  return await chamarGeminiComFallback(prompt);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigoId, termo, titulo, categoria } = await req.json();
    
    console.log('=== Gerando conteúdo político ===');
    console.log('artigoId:', artigoId);
    console.log('termo:', termo);
    console.log('titulo:', titulo);
    console.log('categoria:', categoria);

    // Buscar conteúdo da Wikipedia (usado internamente, não exposto ao usuário)
    const wikipediaContent = termo ? await buscarWikipedia(termo) : null;
    console.log('Wikipedia encontrado:', !!wikipediaContent);

    // Gerar conteúdo com Gemini (com fallback)
    const conteudo = await gerarConteudoGemini(titulo, wikipediaContent, categoria);
    console.log('Conteúdo gerado:', conteudo.length, 'caracteres');

    // Gerar imagem de capa
    const orientacao = categoria.replace('orientacao-', '');
    const imagemUrl = await gerarImagemCapa(titulo, orientacao);
    console.log('Imagem de capa:', imagemUrl ? 'gerada' : 'não gerada');

    // Salvar no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const updateData: Record<string, unknown> = {
      conteudo: conteudo,
      gerado_em: new Date().toISOString()
    };

    if (imagemUrl) {
      updateData.imagem_url = imagemUrl;
    }

    if (artigoId) {
      console.log('Atualizando artigo existente:', artigoId);
      const { error } = await supabase
        .from('politica_blog_orientacao')
        .update(updateData)
        .eq('id', artigoId);

      if (error) {
        console.error('Erro ao atualizar:', error);
        throw error;
      }
    } else {
      console.log('Criando novo artigo');
      const { error } = await supabase
        .from('politica_blog_orientacao')
        .upsert({
          orientacao: orientacao,
          titulo,
          termo_wikipedia: termo,
          conteudo: conteudo,
          imagem_url: imagemUrl,
          gerado_em: new Date().toISOString()
        }, {
          onConflict: 'orientacao,termo_wikipedia'
        });

      if (error) {
        console.error('Erro ao criar:', error);
        throw error;
      }
    }

    console.log('=== Conteúdo salvo com sucesso ===');

    return new Response(
      JSON.stringify({ success: true, conteudo, imagemUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== ERRO ===');
    console.error('Mensagem:', error instanceof Error ? error.message : 'Erro desconhecido');
    console.error('Stack:', error instanceof Error ? error.stack : '');
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar conteúdo' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
