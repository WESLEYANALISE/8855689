import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini com fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean);

interface Capitulo {
  numero: number;
  titulo: string;
  pagina_inicio: number;
}

async function callGeminiWithFallback(prompt: string, maxRetries = 3): Promise<string> {
  for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
    const apiKey = GEMINI_KEYS[keyIndex];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192,
              },
            }),
          }
        );

        if (response.status === 429 || response.status === 503) {
          console.log(`Key ${keyIndex + 1} rate limited, tentando próxima...`);
          break; // Tenta próxima chave
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro Gemini (key ${keyIndex + 1}, tentativa ${attempt + 1}):`, errorText);
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          return text;
        }
      } catch (error) {
        console.error(`Erro na chamada Gemini (key ${keyIndex + 1}, tentativa ${attempt + 1}):`, error);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
  }
  
  throw new Error('Todas as chaves Gemini falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroTitulo, paginas } = await req.json();
    
    if (!livroTitulo || !paginas || !Array.isArray(paginas)) {
      return new Response(
        JSON.stringify({ error: 'livroTitulo e paginas são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analisando capítulos do livro: ${livroTitulo}`);
    console.log(`Total de páginas: ${paginas.length}`);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe índice
    const { data: indiceExistente } = await supabase
      .from('leitura_livros_indice')
      .select('*')
      .eq('livro_titulo', livroTitulo)
      .single();

    if (indiceExistente?.analise_concluida) {
      console.log('Índice já existe, retornando cache');
      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          indice: indiceExistente.indice_capitulos,
          totalCapitulos: indiceExistente.total_capitulos,
          totalPaginas: indiceExistente.total_paginas,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar amostra do conteúdo para análise
    // Pegar as primeiras 30 páginas e uma amostra das demais para identificar padrões
    const paginasParaAnalisar: string[] = [];
    
    // Primeiras 30 páginas (onde geralmente está o índice/início)
    for (let i = 0; i < Math.min(30, paginas.length); i++) {
      paginasParaAnalisar.push(`[PÁGINA ${paginas[i].pagina}]\n${paginas[i].conteudo.substring(0, 800)}`);
    }
    
    // Amostras do resto do livro (a cada 10 páginas)
    for (let i = 30; i < paginas.length; i += 10) {
      if (paginas[i]) {
        paginasParaAnalisar.push(`[PÁGINA ${paginas[i].pagina}]\n${paginas[i].conteudo.substring(0, 500)}`);
      }
    }

    const prompt = `Você é um especialista em análise de estrutura de livros. Analise o conteúdo abaixo e identifique TODOS os capítulos do livro.

LIVRO: "${livroTitulo}"

CONTEÚDO PARA ANÁLISE:
${paginasParaAnalisar.join('\n\n---\n\n')}

TAREFA:
1. Identifique TODOS os capítulos, incluindo: Prólogo, Prefácio, Introdução, Apresentação, Capítulos numerados, Epílogo, Conclusão, Pós-escrito, etc.
2. Para cada capítulo, identifique:
   - O número sequencial (1, 2, 3...)
   - O título LIMPO e PADRONIZADO (corrija erros de OCR, caracteres estranhos, formatação quebrada)
   - A página onde começa

REGRAS CRÍTICAS (OBRIGATÓRIAS):
1. As páginas_inicio DEVEM estar em ORDEM CRESCENTE. Se o capítulo 1 começa na página 5, o capítulo 2 DEVE começar em uma página >= 6
2. NUNCA duplique nomes de capítulos. Cada título deve ser ÚNICO
3. Se encontrar nomes de autores/juízes (ex: "Keen, J.", "Foster, J."), são VOTOS separados dentro do mesmo livro, trate cada um como um capítulo
4. "Pós-escrito" ou "Posfácio" geralmente vem NO FINAL do livro, após todos os outros capítulos
5. Ignore sumários/índices - eles NÃO são capítulos
6. Se não souber a página exata, estime baseado na ordem do conteúdo

REGRAS DE PADRONIZAÇÃO:
- Padronize os títulos: "Capítulo I - O Nome" ou "Capítulo 1 - O Nome"
- Se o título original estiver mal formatado (ex: "C a p í t u l o  1" ou "CAP1TULO"), corrija para o formato correto
- Remova caracteres especiais/estranhos dos títulos
- Para votos de juízes, use formato: "Voto de [Nome do Juiz]"

RESPONDA APENAS com um JSON válido no formato:
{
  "capitulos": [
    {"numero": 1, "titulo": "Apresentação", "pagina_inicio": 5},
    {"numero": 2, "titulo": "Voto de Foster, J.", "pagina_inicio": 8},
    {"numero": 3, "titulo": "Voto de Tatting, J.", "pagina_inicio": 15},
    {"numero": 4, "titulo": "Pós-escrito", "pagina_inicio": 45}
  ]
}

Não inclua explicações, apenas o JSON.`;

    console.log('Enviando para Gemini...');
    const resposta = await callGeminiWithFallback(prompt);
    
    // Extrair JSON da resposta
    let capitulos: Capitulo[] = [];
    try {
      // Tentar extrair JSON do texto
      const jsonMatch = resposta.match(/\{[\s\S]*"capitulos"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        capitulos = parsed.capitulos || [];
      }
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      console.log('Resposta raw:', resposta);
      
      // Fallback: criar índice básico
      capitulos = [{
        numero: 1,
        titulo: "Conteúdo do Livro",
        pagina_inicio: 1
      }];
    }

    // Garantir que temos pelo menos um capítulo
    if (capitulos.length === 0) {
      capitulos = [{
        numero: 1,
        titulo: "Conteúdo do Livro",
        pagina_inicio: 1
      }];
    }

    console.log(`Capítulos identificados: ${capitulos.length}`);
    console.log('Capítulos:', JSON.stringify(capitulos, null, 2));

    // Salvar no banco
    const { error: upsertError } = await supabase
      .from('leitura_livros_indice')
      .upsert({
        livro_titulo: livroTitulo,
        indice_capitulos: capitulos,
        total_capitulos: capitulos.length,
        total_paginas: paginas.length,
        analise_concluida: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'livro_titulo'
      });

    if (upsertError) {
      console.error('Erro ao salvar índice:', upsertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        indice: capitulos,
        totalCapitulos: capitulos.length,
        totalPaginas: paginas.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na análise de capítulos:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
