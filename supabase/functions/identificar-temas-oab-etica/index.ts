import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizarTitulo(titulo: string): string {
  return titulo
    .replace(/\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X)(\s+E\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X))*\s*$/gi, '')
    .replace(/\s+\d+(\s+E\s+\d+)*\s*$/gi, '')
    .replace(/\s+PARTE\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X|\d+)\s*$/gi, '')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Ética] Iniciando identificação de temas...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar páginas extraídas
    const { data: paginas, error: fetchError } = await supabase
      .from('oab_etica_paginas')
      .select('*')
      .order('pagina', { ascending: true });

    if (fetchError) throw fetchError;
    if (!paginas || paginas.length === 0) {
      throw new Error('Nenhuma página encontrada. Execute a extração primeiro.');
    }

    console.log(`Analisando ${paginas.length} páginas...`);

    // Preparar conteúdo para análise
    const conteudoParaAnalise = paginas.map(p => 
      `=== PÁGINA ${p.pagina} ===\n${p.conteudo?.substring(0, 2000) || ''}`
    ).join('\n\n');

    // Buscar chave Gemini
    const geminiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3')
    ].filter(Boolean);

    if (geminiKeys.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];

    const prompt = `Você é um especialista em Ética Profissional da OAB e Estatuto da Advocacia.

Analise o conteúdo das páginas deste material de Ética e identifique os TEMAS principais abordados.

Para cada tema identificado, forneça:
1. O título do tema
2. A página onde ele começa
3. A página onde ele termina
4. Subtópicos dentro desse tema (se houver)

IMPORTANTE:
- Agrupe conteúdos relacionados que aparecem em páginas consecutivas
- Os temas devem refletir a estrutura do Estatuto da OAB e Código de Ética
- Exemplos de temas comuns: "Da Advocacia", "Dos Direitos do Advogado", "Dos Deveres do Advogado", "Das Infrações e Sanções Disciplinares", "Do Processo Disciplinar", etc.

CONTEÚDO DAS PÁGINAS:
${conteudoParaAnalise.substring(0, 100000)}

Responda APENAS com um JSON válido no seguinte formato:
{
  "temas": [
    {
      "ordem": 1,
      "titulo": "Título do Tema",
      "pagina_inicial": 1,
      "pagina_final": 10,
      "subtopicos": ["Subtópico 1", "Subtópico 2"]
    }
  ]
}`;

    console.log("Enviando para Gemini...");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Erro Gemini:", errorText);
      throw new Error(`Erro na API Gemini: ${geminiResponse.status}`);
    }

    const geminiResult = await geminiResponse.json();
    const responseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log("Resposta Gemini recebida");

    // Extrair JSON da resposta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Não foi possível extrair JSON da resposta');
    }

    const temasData = JSON.parse(jsonMatch[0]);
    let temas = temasData.temas || [];

    console.log(`${temas.length} temas identificados`);

    // Agrupar temas sequenciais com títulos similares
    const temasAgrupados: any[] = [];
    let grupoAtual: any = null;

    for (const tema of temas) {
      const tituloNormalizado = normalizarTitulo(tema.titulo);
      
      if (grupoAtual && normalizarTitulo(grupoAtual.titulo) === tituloNormalizado) {
        grupoAtual.pagina_final = tema.pagina_final;
        if (tema.subtopicos) {
          grupoAtual.subtopicos = [...(grupoAtual.subtopicos || []), ...tema.subtopicos];
        }
      } else {
        if (grupoAtual) {
          temasAgrupados.push(grupoAtual);
        }
        grupoAtual = { ...tema };
      }
    }
    
    if (grupoAtual) {
      temasAgrupados.push(grupoAtual);
    }

    // Reordenar
    temasAgrupados.forEach((tema, index) => {
      tema.ordem = index + 1;
    });

    console.log(`${temasAgrupados.length} temas após agrupamento`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        temas: temasAgrupados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Erro na identificação:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});