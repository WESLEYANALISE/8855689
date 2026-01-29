import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { votacao } = await req.json();
    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    console.log('Gerando explicação para votação:', votacao.id);

    // Buscar apenas estatísticas de votos (mais eficiente)
    const votosUrl = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${votacao.id}/votos`;
    const votosResponse = await fetch(votosUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    let estatisticas = { sim: 0, nao: 0, abstencao: 0, obstrucao: 0 };
    if (votosResponse.ok) {
      const votosData = await votosResponse.json();
      const votos = votosData.dados || [];
      
      estatisticas = {
        sim: votos.filter((v: any) => v.tipoVoto === 'Sim').length,
        nao: votos.filter((v: any) => v.tipoVoto === 'Não').length,
        abstencao: votos.filter((v: any) => v.tipoVoto === 'Abstenção').length,
        obstrucao: votos.filter((v: any) => v.tipoVoto === 'Obstrução').length
      };
    }

    const prompt = `Explique esta votação de forma clara em até 400 palavras:

**Votação:** ${votacao.descricao}
**Data:** ${new Date(votacao.dataHoraRegistro).toLocaleDateString('pt-BR')}
**Resultado:** ${votacao.aprovacao === 1 ? 'APROVADO' : 'REJEITADO'}
**Votos:** Sim: ${estatisticas.sim}, Não: ${estatisticas.nao}, Abstenção: ${estatisticas.abstencao}

Explique:
1. O que foi votado e por que é importante
2. Principais argumentos de cada lado
3. Impacto prático para a sociedade
4. Próximos passos

Use linguagem clara e markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API retornou status ${response.status}`);
    }

    const data = await response.json();
    const explicacao = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!explicacao) {
      throw new Error('Não foi possível gerar a explicação');
    }

    console.log('Explicação gerada com sucesso');

    return new Response(JSON.stringify({ explicacao }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao gerar explicação:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});