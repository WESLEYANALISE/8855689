import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Buscar obras na Wikipedia
async function buscarObrasWikipedia(filosofo: string): Promise<any[]> {
  try {
    console.log(`[gerar-obras-filosofo] Buscando obras na Wikipedia para: ${filosofo}`);
    
    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(filosofo)}&format=json&srlimit=1`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.length) {
      console.log('[gerar-obras-filosofo] Nenhum resultado encontrado na Wikipedia');
      return [];
    }
    
    const pageTitle = searchData.query.search[0].title;
    console.log(`[gerar-obras-filosofo] Página encontrada: ${pageTitle}`);
    
    const contentUrl = `https://pt.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&format=json&prop=text|sections`;
    const contentResponse = await fetch(contentUrl);
    const contentData = await contentResponse.json();
    
    if (!contentData.parse?.text?.['*']) {
      console.log('[gerar-obras-filosofo] Conteúdo não encontrado');
      return [];
    }
    
    const htmlContent = contentData.parse.text['*'];
    const obras = extrairObrasDoHTML(htmlContent, filosofo);
    
    console.log(`[gerar-obras-filosofo] ${obras.length} obras extraídas da Wikipedia`);
    return obras;
  } catch (error) {
    console.error('[gerar-obras-filosofo] Erro ao buscar Wikipedia:', error);
    return [];
  }
}

// Extrair obras do HTML da Wikipedia
function extrairObrasDoHTML(html: string, filosofo: string): any[] {
  const obras: any[] = [];
  
  const listaRegex = /<li[^>]*>(.*?)<\/li>/gi;
  const matches = html.matchAll(listaRegex);
  
  for (const match of matches) {
    const item = match[1];
    
    const textoLimpo = item
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const anoMatch = textoLimpo.match(/\((\d{4})\)|[-–]\s*(\d{4})|,\s*(\d{4})/);
    
    if (anoMatch && textoLimpo.length > 10 && textoLimpo.length < 500) {
      const ano = anoMatch[1] || anoMatch[2] || anoMatch[3];
      
      let titulo = textoLimpo.split(/\(\d{4}\)|[-–]\s*\d{4}|,\s*\d{4}/)[0].trim();
      titulo = titulo.replace(/^[•\-–*]\s*/, '').trim();
      
      if (titulo.length > 5 && titulo.length < 200) {
        const jaExiste = obras.some(o => 
          o.titulo.toLowerCase().includes(titulo.toLowerCase().substring(0, 20)) ||
          titulo.toLowerCase().includes(o.titulo.toLowerCase().substring(0, 20))
        );
        
        if (!jaExiste) {
          obras.push({
            titulo: titulo,
            tituloOriginal: titulo,
            ano: ano,
            relevanciaJuridica: `Obra de ${filosofo} com contribuições para o pensamento filosófico e jurídico.`
          });
        }
      }
    }
  }
  
  obras.sort((a, b) => parseInt(a.ano) - parseInt(b.ano));
  
  return obras.slice(0, 25);
}

// Função para chamar Gemini com fallback de chaves
async function chamarGemini(prompt: string, apiKeys: string[]): Promise<string> {
  const modelo = 'gemini-2.0-flash';
  
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      console.log(`[gerar-obras-filosofo] Tentando GEMINI_KEY_${i + 1}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKeys[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 8000
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-obras-filosofo] Erro na API Gemini: ${response.status}`, errorText.substring(0, 200));
        
        if (response.status === 429 || response.status === 503) {
          continue;
        }
        throw new Error(`GEMINI_ERROR_${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Resposta vazia do Gemini');
      }
      
      console.log(`[gerar-obras-filosofo] ✅ Sucesso com GEMINI_KEY_${i + 1}`);
      return text;
    } catch (error) {
      console.log(`[gerar-obras-filosofo] ❌ GEMINI_KEY_${i + 1} falhou:`, error);
      if (i === apiKeys.length - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('Todas as chaves falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filosofo } = await req.json();

    if (!filosofo) {
      return new Response(
        JSON.stringify({ error: 'Nome do filósofo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe no cache
    console.log(`[gerar-obras-filosofo] Verificando cache para: ${filosofo}`);
    
    const { data: cacheData, error: cacheError } = await supabase
      .from('obras_filosofos_cache')
      .select('obras')
      .eq('filosofo', filosofo)
      .maybeSingle();

    if (cacheData?.obras) {
      console.log(`[gerar-obras-filosofo] ✅ Obras encontradas no cache para "${filosofo}"`);
      return new Response(
        JSON.stringify({ obras: cacheData.obras, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gerar-obras-filosofo] Gerando lista de obras para: ${filosofo}`);

    // Primeiro, tentar buscar na Wikipedia
    let obras = await buscarObrasWikipedia(filosofo);
    
    // Se não encontrou obras suficientes na Wikipedia, usar Gemini
    if (obras.length < 5) {
      console.log('[gerar-obras-filosofo] Poucas obras na Wikipedia, usando Gemini...');
      
      const apiKeys = [
        Deno.env.get('GEMINI_KEY_1'),
        Deno.env.get('GEMINI_KEY_2'),
        Deno.env.get('GEMINI_KEY_3'),
        Deno.env.get('DIREITO_PREMIUM_API_KEY'),
      ].filter(Boolean) as string[];
      
      if (apiKeys.length > 0) {
        const prompt = `Você é um especialista em filosofia e história do pensamento jurídico.

Liste TODAS as obras principais do filósofo "${filosofo}" que são relevantes para o estudo do Direito e da Filosofia.

RETORNE APENAS UM ARRAY JSON VÁLIDO, sem markdown, sem explicações, apenas o JSON puro.

Formato exato:
[
  {
    "titulo": "Nome da Obra em Português",
    "tituloOriginal": "Nome Original (se diferente)",
    "ano": "Ano de publicação ou período aproximado",
    "relevanciaJuridica": "Uma frase curta explicando a relevância para o Direito"
  }
]

IMPORTANTE:
- Liste TODAS as obras relevantes (mínimo 5, máximo 20)
- Ordene cronologicamente
- Inclua apenas obras reais e verificáveis
- Foque em obras com impacto no pensamento jurídico, político e ético
- Retorne APENAS o array JSON, nada mais`;

        try {
          const resposta = await chamarGemini(prompt, apiKeys);
          
          const jsonMatch = resposta.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const obrasGemini = JSON.parse(jsonMatch[0]);
            
            // Mesclar obras da Wikipedia com Gemini, evitando duplicatas
            for (const obraGemini of obrasGemini) {
              const jaExiste = obras.some(o => 
                o.titulo.toLowerCase().includes(obraGemini.titulo.toLowerCase().substring(0, 15)) ||
                obraGemini.titulo.toLowerCase().includes(o.titulo.toLowerCase().substring(0, 15))
              );
              
              if (!jaExiste) {
                obras.push(obraGemini);
              }
            }
          }
        } catch (geminiError) {
          console.error('[gerar-obras-filosofo] Erro no Gemini:', geminiError);
        }
      }
    }

    // Ordenar por ano
    obras.sort((a, b) => parseInt(a.ano) - parseInt(b.ano));

    // Salvar no cache
    if (obras.length > 0) {
      console.log(`[gerar-obras-filosofo] Salvando ${obras.length} obras no cache...`);
      
      const { error: insertError } = await supabase
        .from('obras_filosofos_cache')
        .upsert({
          filosofo,
          obras
        }, { onConflict: 'filosofo' });

      if (insertError) {
        console.error('[gerar-obras-filosofo] Erro ao salvar cache:', insertError);
      } else {
        console.log(`[gerar-obras-filosofo] ✅ Obras salvas no cache`);
      }
    }

    console.log(`[gerar-obras-filosofo] ✅ ${obras.length} obras encontradas para ${filosofo}`);

    return new Response(
      JSON.stringify({ obras, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-obras-filosofo] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
