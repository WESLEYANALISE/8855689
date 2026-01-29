import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini API keys com fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean);

async function callGeminiWithFallback(prompt: string): Promise<string> {
  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      if (response.status === 429 || response.status === 503) continue;
    } catch (error) {
      console.error('Gemini API error:', error);
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&aacute;/gi, 'á').replace(/&Aacute;/gi, 'Á')
    .replace(/&eacute;/gi, 'é').replace(/&Eacute;/gi, 'É')
    .replace(/&iacute;/gi, 'í').replace(/&Iacute;/gi, 'Í')
    .replace(/&oacute;/gi, 'ó').replace(/&Oacute;/gi, 'Ó')
    .replace(/&uacute;/gi, 'ú').replace(/&Uacute;/gi, 'Ú')
    .replace(/&agrave;/gi, 'à').replace(/&Agrave;/gi, 'À')
    .replace(/&atilde;/gi, 'ã').replace(/&Atilde;/gi, 'Ã')
    .replace(/&otilde;/gi, 'õ').replace(/&Otilde;/gi, 'Õ')
    .replace(/&ccedil;/gi, 'ç').replace(/&Ccedil;/gi, 'Ç')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

async function extrairTextoCompleto(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DireitoPremium/1.0)' },
      redirect: 'follow'
    });
    if (!response.ok) return null;
    
    const html = await response.text();
    
    let texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '');
    
    const articleMatch = texto.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
    if (articleMatch) texto = articleMatch[1];
    
    texto = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    texto = decodeHTMLEntities(texto);
    
    return texto.slice(0, 10000);
  } catch {
    return null;
  }
}

async function processarNoticia(noticia: any): Promise<{
  conteudo_formatado: string;
  resumo_executivo: string;
  resumo_facil: string;
  pontos_principais: string[];
  termos: Array<{termo: string; significado: string}>;
} | null> {
  try {
    console.log(`Processando: ${noticia.titulo?.slice(0, 50)}...`);
    
    const textoOriginal = await extrairTextoCompleto(noticia.url);
    if (!textoOriginal || textoOriginal.length < 200) {
      console.log('Texto muito curto, ignorando');
      return null;
    }
    
    const prompt = `Você é um editor político. Analise esta notícia e retorne um JSON com TODAS as informações:

TÍTULO: ${noticia.titulo}
FONTE: ${noticia.fonte}

TEXTO ORIGINAL:
${textoOriginal.slice(0, 6000)}

Retorne EXATAMENTE este JSON:
{
  "conteudo_formatado": "RESUMO da notícia em 3-5 parágrafos curtos, com SUAS PRÓPRIAS PALAVRAS. NÃO copie o texto original. Explique os fatos principais de forma objetiva e didática, como um professor explicaria. Separe parágrafos por linha dupla.",
  "resumo_executivo": "Análise técnica em 3-4 frases SEM marcações Markdown. Explique o contexto político, quem são os envolvidos e as implicações de forma clara e direta.",
  "resumo_facil": "Explicação em 2-3 frases BEM SIMPLES, sem Markdown. O que aconteceu? Por que eu deveria me importar? Como isso afeta minha vida? Linguagem coloquial.",
  "pontos_principais": ["ponto 1", "ponto 2", "ponto 3", "ponto 4"],
  "termos": [
    {"termo": "Termo técnico/político 1", "significado": "Explicação simples"},
    {"termo": "Termo técnico/político 2", "significado": "Explicação simples"}
  ]
}

IMPORTANTE:
- conteudo_formatado: NÃO copie o texto original - faça um RESUMO próprio em português claro e objetivo
- resumo_executivo e resumo_facil: NÃO use asteriscos (**), hífens (-) ou qualquer Markdown
- termos: inclua TODOS os termos políticos, jurídicos ou técnicos da notícia
- Retorne APENAS o JSON válido, sem texto adicional`;

    const resposta = await callGeminiWithFallback(prompt);
    
    // Limpar resposta antes de parsear
    let jsonString = resposta.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonString) {
      console.log('Falha ao extrair JSON da resposta');
      return null;
    }
    
    // Remover caracteres de controle que quebram o JSON
    jsonString = jsonString
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\r?\n/g, ' ')
      .replace(/\t/g, ' ');
    
    const dados = JSON.parse(jsonString);
    
    let conteudoLimpo = dados.conteudo_formatado || '';
    conteudoLimpo = conteudoLimpo
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([.!?])\s*\n(?!\n)/g, '$1\n\n')
      .trim();
    
    return {
      conteudo_formatado: conteudoLimpo,
      resumo_executivo: dados.resumo_executivo || '',
      resumo_facil: dados.resumo_facil || '',
      pontos_principais: dados.pontos_principais || [],
      termos: dados.termos || []
    };
  } catch (error) {
    console.error('Erro ao processar notícia:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando processamento de notícias pendentes...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Corrigir notícias sem data_publicacao (usar created_at)
    const { data: semData } = await supabase
      .from('noticias_politicas_cache')
      .select('id, created_at')
      .is('data_publicacao', null);
    
    if (semData && semData.length > 0) {
      console.log(`Corrigindo ${semData.length} notícias sem data_publicacao...`);
      for (const n of semData) {
        await supabase
          .from('noticias_politicas_cache')
          .update({ data_publicacao: n.created_at })
          .eq('id', n.id);
      }
    }

    // 2. Buscar notícias não processadas
    const { data: pendentes, error } = await supabase
      .from('noticias_politicas_cache')
      .select('*')
      .or('processado.is.null,processado.eq.false')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    if (!pendentes || pendentes.length === 0) {
      console.log('Nenhuma notícia pendente para processar');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma notícia pendente', processadas: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando ${pendentes.length} notícias pendentes...`);
    let processadas = 0;

    for (const noticia of pendentes) {
      const processado = await processarNoticia(noticia);
      
      if (processado) {
        const { error: updateError } = await supabase
          .from('noticias_politicas_cache')
          .update({
            conteudo_formatado: processado.conteudo_formatado,
            resumo_executivo: processado.resumo_executivo,
            resumo_facil: processado.resumo_facil,
            pontos_principais: processado.pontos_principais,
            termos: processado.termos,
            processado: true
          })
          .eq('id', noticia.id);

        if (!updateError) {
          processadas++;
          console.log(`✓ Processada: ${noticia.titulo?.slice(0, 40)}...`);
        } else {
          console.error('Erro ao atualizar:', updateError);
        }
      } else {
        // Marcar como processado mesmo se falhou para não tentar novamente
        await supabase
          .from('noticias_politicas_cache')
          .update({ processado: true })
          .eq('id', noticia.id);
      }
    }

    console.log(`Processamento concluído: ${processadas}/${pendentes.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processadas,
        total_pendentes: pendentes.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
