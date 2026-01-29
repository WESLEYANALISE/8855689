import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com 3 chaves API
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function chamarGeminiComFallback(prompt: string): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      console.log(`Tentando com GEMINI_KEY_${i + 1}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8000,
            }
          })
        }
      );

      if (response.ok) {
        console.log(`Sucesso com GEMINI_KEY_${i + 1}`);
        return response;
      }

      // Se erro 429 (quota excedida) ou 503 (serviço indisponível), tentar próxima chave
      if (response.status === 429 || response.status === 503) {
        console.log(`Quota/serviço indisponível na KEY_${i + 1} (status ${response.status}), tentando próxima...`);
        lastError = new Error(`API Key ${i + 1}: status ${response.status}`);
        continue;
      }

      // Outros erros, retornar resposta com erro
      const errorText = await response.text();
      console.error(`Erro na API Gemini (KEY_${i + 1}):`, response.status, errorText);
      lastError = new Error(`API Key ${i + 1}: ${response.status} - ${errorText}`);
      
    } catch (err) {
      console.error(`Exceção com KEY_${i + 1}:`, err);
      lastError = err as Error;
      if (i < GEMINI_KEYS.length - 1) continue;
    }
  }

  throw lastError || new Error('Todas as chaves API falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, livroTitulo, paginaNumero } = await req.json();
    
    if (!texto) {
      throw new Error('Texto é obrigatório');
    }

    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave GEMINI configurada');
    }

    console.log(`Formatando página ${paginaNumero} do livro: ${livroTitulo}`);
    console.log(`Chaves disponíveis: ${GEMINI_KEYS.length}`);

    // Limpar marcadores de imagem do texto antes de formatar
    const textoLimpo = texto
      .replace(/\[IMAGEM_DETECTADA:[^\]]*\]/g, '')
      .replace(/\[Imagem[^\]]*\]/gi, '')
      .replace(/\[Figura[^\]]*\]/gi, '')
      .replace(/\[Capa[^\]]*\]/gi, '')
      .replace(/\[Página de rosto[^\]]*\]/gi, '')
      .replace(/\[Ilustração[^\]]*\]/gi, '')
      .trim();

    const prompt = `Você é um formatador de texto especializado em livros clássicos. Analise o texto abaixo e retorne um JSON com a formatação correta para leitura mobile.

TEXTO DA PÁGINA ${paginaNumero}:
"""
${textoLimpo}
"""

REGRAS DE FORMATAÇÃO:
1. NÃO modifique o conteúdo do texto, apenas formate para melhor leitura
2. Identifique se há início de capítulo (CAPÍTULO, LIVRO, PARTE, etc.) e formate como título
3. Separe parágrafos corretamente
4. IMPORTANTE - Identifique TODAS as citações, incluindo:
   - Texto entre aspas duplas "..."
   - Texto entre aspas francesas «...»  
   - Texto entre parênteses que contém citações ou falas "(citou: '...')" ou "(disse ele: '...')"
   - Frases em latim, grego ou outro idioma
   - Qualquer trecho que seja uma citação de outro autor ou fonte
5. Mantenha notas de rodapé separadas
6. Remova espaços duplicados e quebras de linha excessivas
7. IGNORE qualquer menção a imagens, figuras ou ilustrações - formate apenas o texto

FORMATAÇÃO HTML:
- Use <p class="indent"> para parágrafos normais com indentação
- Use <h2 class="chapter-title"> para títulos de capítulos (CAPÍTULO I, CAPÍTULO II, etc.)
- Use <h3 class="subtitle"> para subtítulos menores
- Use <blockquote> para TODAS as citações (aspas, parênteses com falas, latim, etc.)
- Use <p class="footnote"> para notas de rodapé
- Use <span class="emphasis"> para trechos em itálico/destaque

RETORNE APENAS JSON (sem markdown):
{
  "tipo": "conteudo" ou "capitulo",
  "capitulo_detectado": {
    "numero": null ou número,
    "titulo": null ou "título do capítulo",
    "parte": null ou "LIVRO PRIMEIRO" etc
  },
  "html_formatado": "<p class=\\"indent\\">Parágrafo formatado...</p>",
  "tema_visual": "breve descrição do tema" ou null
}`;

    const response = await chamarGeminiComFallback(prompt);
    const data = await response.json();
    
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('Resposta vazia da IA');
    }
    
    // Limpar markdown se presente
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extrair apenas o JSON válido (entre { e })
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON não encontrado na resposta');
    }
    
    let jsonStr = jsonMatch[0];
    
    // Limpar caracteres problemáticos que podem aparecer após o JSON
    // Encontrar o último } e truncar ali
    let braceCount = 0;
    let lastValidIndex = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      if (jsonStr[i] === '{') braceCount++;
      if (jsonStr[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          lastValidIndex = i + 1;
          break;
        }
      }
    }
    
    if (lastValidIndex > 0) {
      jsonStr = jsonStr.substring(0, lastValidIndex);
    }
    
    // Tentar fazer parse
    let resultado;
    try {
      resultado = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.error('JSON recebido:', jsonStr.substring(0, 500));
      // Fallback: retornar formatação básica
      resultado = {
        tipo: 'conteudo',
        html_formatado: texto.split('\n').map((p: string) => 
          p.trim() ? `<p class="indent">${p.trim()}</p>` : ''
        ).join(''),
        capitulo_detectado: null
      };
    }
    
    console.log(`Formatação concluída. Tipo: ${resultado.tipo}`);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro em formatar-leitura:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao formatar texto' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
