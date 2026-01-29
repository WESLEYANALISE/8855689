import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ElementoIdentificado {
  nome: string;
  descricao: string;
  posicao: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  tipo: 'botao' | 'busca' | 'icone' | 'tab' | 'menu' | 'card' | 'lista';
  importancia: 'alta' | 'media' | 'baixa';
}

interface PassoTutorial {
  ordem: number;
  titulo: string;
  descricao: string;
  screenshot_url: string;
  anotacoes: Array<{
    tipo: 'retangulo' | 'seta' | 'circulo';
    posicao?: { x: number; y: number; largura: number; altura: number };
    de?: { x: number; y: number };
    para?: { x: number; y: number };
    cor: string;
  }>;
}

async function callGeminiVision(base64Image: string, apiKey: string): Promise<ElementoIdentificado[]> {
  const prompt = `Analise esta screenshot de um aplicativo jurídico brasileiro.
Identifique TODOS os elementos interativos visíveis:
- Botões de ação (play, download, buscar, voltar)
- Campos de busca
- Ícones de funcionalidade
- Tabs/abas
- Menus e navegação
- Cards clicáveis
- Listas de itens

Para cada elemento, forneça:
1. Nome/título do elemento (em português)
2. Descrição do que faz (máximo 2 frases)
3. Posição aproximada em porcentagem da tela (top, left, width, height - valores de 0 a 100)
4. Tipo: botao, busca, icone, tab, menu, card, lista
5. Importância: alta, media, baixa

Retorne APENAS um JSON válido com array de objetos, sem markdown:
[
  {
    "nome": "Buscar Artigo",
    "descricao": "Campo para buscar artigos por número ou palavra-chave",
    "posicao": { "top": 15, "left": 5, "width": 90, "height": 8 },
    "tipo": "busca",
    "importancia": "alta"
  }
]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/png',
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini Vision error:', error);
    throw new Error(`Gemini Vision failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  
  // Clean and parse JSON
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleanedText);
  } catch {
    console.error('Failed to parse Gemini response:', cleanedText);
    return [];
  }
}

async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  console.log('Downloading image from:', imageUrl);
  
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = base64Encode(arrayBuffer);
  
  console.log('Image downloaded, size:', arrayBuffer.byteLength, 'bytes');
  return base64;
}

async function takeScreenshot(url: string, firecrawlKey: string): Promise<{ base64: string; url: string } | null> {
  console.log('Taking screenshot of:', url);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['screenshot'],
      waitFor: 8000, // Wait longer for SPA to fully render
      timeout: 30000,
      actions: [
        { type: 'wait', milliseconds: 3000 }, // Initial wait
        { type: 'scroll', direction: 'down', amount: 100 }, // Trigger lazy loading
        { type: 'wait', milliseconds: 2000 }, // Wait for content
        { type: 'scroll', direction: 'up', amount: 100 }, // Scroll back
        { type: 'wait', milliseconds: 1000 } // Final wait
      ]
    }),
  });

  if (!response.ok) {
    console.error('Firecrawl error:', await response.text());
    return null;
  }

  const data = await response.json();
  const screenshotUrl = data.data?.screenshot;
  
  if (!screenshotUrl) {
    console.error('No screenshot URL returned');
    return null;
  }
  
  console.log('Screenshot URL received:', screenshotUrl);
  
  // Download the image and convert to base64
  const base64 = await downloadImageAsBase64(screenshotUrl);
  
  return { base64, url: screenshotUrl };
}

function gerarPassosFromElementos(elementos: ElementoIdentificado[], screenshotUrl: string): PassoTutorial[] {
  // Sort by importance and position
  const sorted = elementos
    .filter(e => e.importancia === 'alta' || e.importancia === 'media')
    .sort((a, b) => {
      const importanciaOrder = { alta: 0, media: 1, baixa: 2 };
      return importanciaOrder[a.importancia] - importanciaOrder[b.importancia];
    })
    .slice(0, 8); // Max 8 passos

  const cores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

  return sorted.map((elemento, index) => ({
    ordem: index + 1,
    titulo: elemento.nome,
    descricao: elemento.descricao,
    screenshot_url: screenshotUrl,
    anotacoes: [
      {
        tipo: 'retangulo' as const,
        posicao: {
          x: elemento.posicao.left,
          y: elemento.posicao.top,
          largura: elemento.posicao.width,
          altura: elemento.posicao.height
        },
        cor: cores[index % cores.length]
      },
      {
        tipo: 'seta' as const,
        de: { 
          x: Math.min(elemento.posicao.left + elemento.posicao.width + 5, 95), 
          y: elemento.posicao.top + elemento.posicao.height / 2 
        },
        para: { 
          x: elemento.posicao.left + elemento.posicao.width, 
          y: elemento.posicao.top + elemento.posicao.height / 2 
        },
        cor: cores[index % cores.length]
      }
    ]
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secao, url, titulo, descricao, icone } = await req.json();

    if (!secao || !url) {
      return new Response(
        JSON.stringify({ success: false, error: 'secao e url são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('DIREITO_PREMIUM_API_KEY');
    
    if (!firecrawlKey || !geminiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API keys não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Gerando tutorial para: ${secao}`);

    // 1. Take screenshot and get base64
    const screenshotData = await takeScreenshot(url, firecrawlKey);
    
    if (!screenshotData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao capturar screenshot' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Screenshot capturado, analisando com Gemini Vision...');

    // 2. Analyze with Gemini Vision (using base64)
    const elementos = await callGeminiVision(screenshotData.base64, geminiKey);
    
    console.log(`${elementos.length} elementos identificados`);

    // 3. Generate tutorial steps (using original URL for display)
    const passos = gerarPassosFromElementos(elementos, screenshotData.url);

    // 4. Save to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('tutoriais_app')
      .upsert({
        secao,
        titulo: titulo || `Tutorial: ${secao}`,
        descricao: descricao || `Aprenda a usar a funcionalidade ${secao}`,
        icone: icone || 'HelpCircle',
        passos,
        screenshot_principal: screenshotData.url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'secao' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tutorial salvo com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        tutorial: data,
        elementos_identificados: elementos.length,
        passos_gerados: passos.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar tutorial:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
