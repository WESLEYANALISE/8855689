import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini disponíveis
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function callGeminiWithFallback(prompt: string): Promise<string> {
  const errors: string[] = [];
  
  for (const apiKey of GEMINI_KEYS) {
    try {
      console.log('Tentando Gemini API...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 16384,
            }
          })
        }
      );

      if (response.status === 429) {
        console.log('Rate limit, tentando próxima key...');
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        errors.push(`Status ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        return text;
      }
    } catch (error) {
      errors.push(String(error));
      continue;
    }
  }
  
  throw new Error(`Todas as chaves Gemini falharam: ${errors.join(', ')}`);
}

function extractJsonFromText(text: string): any {
  try {
    // Tentar encontrar JSON em blocos de código markdown
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      return JSON.parse(jsonBlockMatch[1].trim());
    }
    
    // Tentar encontrar JSON diretamente
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (e) {
    console.error('Erro ao extrair JSON, tentando recuperar parcial:', e);
    
    // Tentar recuperar JSON parcial/truncado
    try {
      const jsonMatch = text.match(/\{[\s\S]*/);
      if (jsonMatch) {
        let partialJson = jsonMatch[0];
        
        // Contar chaves e colchetes abertos
        const openBraces = (partialJson.match(/\{/g) || []).length;
        const closeBraces = (partialJson.match(/\}/g) || []).length;
        const openBrackets = (partialJson.match(/\[/g) || []).length;
        const closeBrackets = (partialJson.match(/\]/g) || []).length;
        
        // Fechar strings abertas (procurar por aspas não fechadas)
        if ((partialJson.match(/"/g) || []).length % 2 !== 0) {
          partialJson += '"';
        }
        
        // Adicionar colchetes e chaves faltantes
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          partialJson += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          partialJson += '}';
        }
        
        return JSON.parse(partialJson);
      }
    } catch (recoveryError) {
      console.error('Não foi possível recuperar JSON parcial:', recoveryError);
    }
    
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, titulo, forceReprocess, isConcurso } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar tabela correta baseado no tipo de notícia
    const tabela = isConcurso ? 'noticias_concursos_cache' : 'noticias_juridicas_cache';
    console.log(`Processando notícia (${tabela}):`, titulo || url);

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe no cache e tem conteúdo processado
    const { data: cacheExistente } = await supabase
      .from(tabela)
      .select('conteudo_formatado, analise_ia, termos_json')
      .eq('link', url)
      .single();

    if (cacheExistente && !forceReprocess) {
      // Se já tem dados processados, retornar
      if (cacheExistente.conteudo_formatado && cacheExistente.analise_ia && cacheExistente.termos_json) {
        console.log('Usando dados do cache existente');
        return new Response(
          JSON.stringify({
            success: true,
            fromCache: true,
            conteudo_formatado: cacheExistente.conteudo_formatado,
            analise_ia: cacheExistente.analise_ia,
            termos_json: cacheExistente.termos_json
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar HTML da página
    console.log('Buscando HTML da notícia...');
    let htmlContent = '';
    
    try {
      const htmlResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      if (htmlResponse.ok) {
        htmlContent = await htmlResponse.text();
      }
    } catch (e) {
      console.log('Erro ao buscar HTML:', e);
    }

    // Extrair texto básico do HTML
    let textoExtraido = '';
    if (htmlContent) {
      // Extrair parágrafos
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      let match;
      const paragrafos: string[] = [];
      
      while ((match = pRegex.exec(htmlContent)) !== null) {
        let texto = match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
          .trim();
        
        if (texto.length > 30) {
          paragrafos.push(texto);
        }
      }
      
      textoExtraido = paragrafos.join('\n\n');
    }

    // Prompt simplificado e mais direto para garantir formatação correta
    const prompt = `Analise esta notícia jurídica e retorne um JSON.

TÍTULO: ${titulo || 'Não informado'}
CONTEÚDO: ${textoExtraido || 'Sem conteúdo - use o título'}

Retorne APENAS este JSON (sem markdown ao redor):

{
  "conteudo_formatado": "### O que aconteceu\n\nPrimeiro parágrafo sobre o fato. Use **negrito** para termos importantes como **nomes** e **datas**.\n\nSegundo parágrafo com mais detalhes.\n\n---\n\n### Por que isso importa\n\nExplicação da relevância para cidadãos. Destaque **consequências práticas**.\n\n---\n\n### Pontos principais\n\n• **Primeiro ponto:** explicação detalhada\n\n• **Segundo ponto:** explicação detalhada\n\n• **Terceiro ponto:** explicação detalhada\n\n---\n\n### Na prática\n\nO que muda para advogados e cidadãos.",

  "analise_ia": {
    "resumoExecutivo": "Resumo técnico em 2-3 parágrafos para profissionais.",
    "resumoFacil": "Explicação simples como para leigos.",
    "pontosPrincipais": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "impactoJuridico": "Impacto na prática jurídica"
  },

  "termos_json": [
    {"termo": "Termo 1", "significado": "Definição"},
    {"termo": "Termo 2", "significado": "Definição"}
  ]
}

REGRAS OBRIGATÓRIAS para conteudo_formatado:
1. Use ### para títulos (sem emojis)
2. Use --- para separar seções
3. Use **texto** para negrito
4. Use • para bullet points
5. Use \\n\\n entre parágrafos (linha em branco)
6. Parágrafos curtos (2-3 linhas)
7. Mínimo 4 seções com títulos ###
8. Mínimo 3 bullet points na seção de pontos`;

    console.log('Chamando Gemini para processar...');
    const geminiResponse = await callGeminiWithFallback(prompt);
    
    // Extrair JSON da resposta
    const resultado = extractJsonFromText(geminiResponse);
    
    if (!resultado) {
      console.error('Resposta Gemini não parseável:', geminiResponse.substring(0, 500));
      throw new Error('Não foi possível processar a resposta do Gemini');
    }

    console.log('Processamento concluído, salvando no cache...');

    // Garantir que conteudo_formatado tem quebras de parágrafo
    let conteudoFormatado = resultado.conteudo_formatado || '';
    if (conteudoFormatado) {
      // Normalizar quebras de linha
      conteudoFormatado = conteudoFormatado
        .replace(/\n{3,}/g, '\n\n')
        .replace(/([.!?])\s+(?=[A-Z])/g, '$1\n\n')
        .trim();
    }

    // Atualizar cache com os novos dados na tabela correta
    const { error: updateError } = await supabase
      .from(tabela)
      .update({
        conteudo_formatado: conteudoFormatado,
        analise_ia: JSON.stringify(resultado.analise_ia || {}),
        termos_json: resultado.termos_json || [],
        updated_at: new Date().toISOString()
      })
      .eq('link', url);

    if (updateError) {
      console.error('Erro ao atualizar cache:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        fromCache: false,
        conteudo_formatado: conteudoFormatado,
        analise_ia: resultado.analise_ia,
        termos_json: resultado.termos_json
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no processamento:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
