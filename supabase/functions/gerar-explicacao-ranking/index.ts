import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`API key rate limited, trying next...`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Gemini error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini call failed:', error);
      continue;
    }
  }
  throw new Error('All Gemini API keys exhausted');
}

const RANKING_CONTEXTS: Record<string, { titulo: string; contexto: string }> = {
  despesas: {
    titulo: 'Ranking de Gastos Parlamentares',
    contexto: `Este ranking mostra os deputados federais que mais gastaram usando a Cota para o Exercício da Atividade Parlamentar (CEAP), também conhecida como "cota parlamentar". A CEAP é um auxílio financeiro mensal concedido aos deputados para custear despesas relacionadas ao exercício do mandato.`
  },
  proposicoes: {
    titulo: 'Ranking de Produtividade Legislativa',
    contexto: `Este ranking mostra os deputados federais que mais apresentaram proposições legislativas no ano atual. Proposições incluem Projetos de Lei (PL), Projetos de Lei Complementar (PLP), Propostas de Emenda à Constituição (PEC), Requerimentos, entre outros tipos de iniciativas parlamentares.`
  },
  presenca: {
    titulo: 'Ranking de Presença e Assiduidade',
    contexto: `Este ranking mostra os deputados federais com maior participação em eventos parlamentares nos últimos 30 dias. Eventos incluem sessões plenárias, reuniões de comissões, audiências públicas e outras atividades oficiais da Câmara dos Deputados.`
  },
  comissoes: {
    titulo: 'Ranking de Atuação em Comissões',
    contexto: `Este ranking mostra os deputados federais mais ativos em órgãos e comissões da Câmara dos Deputados. As comissões são grupos de trabalho especializados que analisam e discutem projetos de lei antes de serem votados em plenário.`
  },
  discursos: {
    titulo: 'Ranking de Discursos Proferidos',
    contexto: `Este ranking mostra os deputados federais que mais fizeram discursos em plenário. Os discursos permitem aos parlamentares expressar posições, debater temas e representar seus eleitores na tribuna da Câmara.`
  },
  frentes: {
    titulo: 'Ranking de Frentes Parlamentares',
    contexto: `Este ranking mostra os deputados federais que participam de mais frentes parlamentares. Frentes são grupos suprapartidários focados em temas específicos como saúde, educação, meio ambiente, etc.`
  },
  'menos-despesas': {
    titulo: 'Ranking dos Deputados Mais Econômicos',
    contexto: `Este ranking mostra os deputados federais que menos gastaram da cota parlamentar, demonstrando economia de recursos públicos durante o exercício do mandato.`
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo } = await req.json();

    if (!tipo || !RANKING_CONTEXTS[tipo]) {
      return new Response(
        JSON.stringify({ error: 'Tipo de ranking inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache no Supabase
    const { data: cached } = await supabase
      .from('ranking_explicacoes')
      .select('*')
      .eq('tipo', tipo)
      .single();

    if (cached) {
      console.log(`[gerar-explicacao-ranking] Cache hit para ${tipo}`);
      return new Response(
        JSON.stringify({ explicacao: cached.explicacao, titulo: cached.titulo, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar nova explicação
    const { titulo, contexto } = RANKING_CONTEXTS[tipo];

    const prompt = `Você é um especialista em política brasileira e transparência pública. Gere uma explicação detalhada e didática sobre o seguinte ranking de deputados federais.

TÍTULO: ${titulo}

CONTEXTO BASE: ${contexto}

Sua explicação deve incluir:

1. **O que é este ranking?**
   - Explique de forma clara e acessível o que está sendo medido

2. **Por que é importante?**
   - Explique a relevância deste indicador para a transparência e fiscalização popular

3. **Como interpretar os dados?**
   - Oriente o cidadão sobre como analisar estes números
   - Destaque que números altos não significam necessariamente algo positivo ou negativo

4. **De onde vêm os dados?**
   - Mencione que os dados são oficiais da Câmara dos Deputados
   - Explique que são dados públicos disponíveis no Portal da Transparência

5. **Dica de cidadania**
   - Dê uma dica prática de como o cidadão pode usar essa informação

Use linguagem acessível, evite jargões técnicos e seja imparcial. Não faça juízos de valor sobre deputados específicos.

Formate a resposta em Markdown com títulos em negrito.`;

    const explicacao = await callGeminiWithFallback(prompt);

    // Salvar no cache do Supabase
    await supabase.from('ranking_explicacoes').upsert({
      tipo,
      titulo,
      explicacao,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tipo' });

    console.log(`[gerar-explicacao-ranking] Explicação gerada e cacheada para ${tipo}`);

    return new Response(
      JSON.stringify({ explicacao, titulo, cached: false }),
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
